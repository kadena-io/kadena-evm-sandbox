from dataclasses import dataclass, asdict
import asyncio
import json
import logging

# local modules
from rpc import AuthRPC, RpcException, RpcErrorException, Url
from execution_api import *
from ethtypes import *

logger = logging.getLogger(__name__)

# ############################################################################ #
# Fork Choice State

@dataclass
class ForkChoiceState():
    "Execution Layer Fork Choice State"

    # According to the Bellatrix fork choice rules, this is the only way to
    # set the latest block. Is that true?
    headBlockHash: BlockHash

    # I think, we have some degree of freedom to pick what makes sense here.
    safeBlockHash: BlockHash

    # I think, we have to place a value here. Not sure what it should be.
    # We have to figure out of node implementations have any hard
    # requirements (e.g. that ther must never be a reorg of a finalized
    # block). Otherwise we could pick some confidence threshold here for.
    # That threshold should probably be dynamic in case of has power
    # changes.
    finalizedBlockHash: BlockHash

    def __init__(
        self,
        headBlockHash: BlockHash,
        safeBlockHash: BlockHash|None,
        finalizedBlockHash: BlockHash|None,
    ):
        if headBlockHash == ZERO_HASH:
            raise ValueError("headBlockHash must not be ZERO_HASH")
        if headBlockHash is None:
            raise ValueError("headBlockHash must not be None")
        if finalizedBlockHash == ZERO_HASH:
            raise ValueError("finalizedBlockHash must not be ZERO_HASH")
        if finalizedBlockHash is None:
            raise ValueError("finalizedBlockHash must not be None")
        self.headBlockHash = headBlockHash
        self.safeBlockHash = safeBlockHash if safeBlockHash is not None else ZERO_HASH
        self.finalizedBlockHash = finalizedBlockHash if finalizedBlockHash is not None else ZERO_HASH

# ############################################################################ #
# Fork Choice Attributes

@dataclass
class ForkChoiceAttributes():

    timestamp: HexString
    prevRandao: HexString
    suggestedFeeRecipient: Address

    # Originally, Ethereum PoW used the fee recipient for this, too.
    # Maybe we can use withdrawls instead?
    withdrawals: list[dict]

    # This is going to be the Chainweb parent hash
    parentBeaconBlockRoot: BeaconBlockRoot

    def __init__(
        self,
        miner_address: Address,
        parent_beacon_block_root: BeaconBlockRoot
    ):
        self.timestamp = current_timestamp_hex()
        self.prevRandao = NULL_256
        self.suggestedFeeRecipient = miner_address
        self.withdrawals = [{
            "index": "0x00",
            "validatorIndex": "0x00",
            "address": miner_address,
            "amount": "0x1",
        }]
        self.parentBeaconBlockRoot = parent_beacon_block_root

# ############################################################################ #
# Fork Choice Update Params

type ForkChoiceParams = tuple[ForkChoiceState, ForkChoiceAttributes|None]

def fork_choice_update_params(
    fork_choice_state: ForkChoiceState,
    parent_beacon_block_root: BeaconBlockRoot,
    miner_address: Address
) -> ForkChoiceParams:
    attributes = ForkChoiceAttributes(miner_address, parent_beacon_block_root)
    # return [
    #     asdict(fork_choice_state),
    #     asdict(attributes)
    # ]
    return (fork_choice_state, attributes)

def fork_sync_params(fork_choice_state: ForkChoiceState) -> ForkChoiceParams:
    return (fork_choice_state, None)

# ############################################################################ #
# Ethereum Engine JSON-RPC

# Engine RPC
class EngineRPC(AuthRPC, CommonEthRPC):
    "Engine JSON-RPC client"

    def __init__(self, url: Url, jwt_secret: HexString):
        super().__init__(url, jwt_secret = jwt_secret)

    # eth methods
    # Inherited from CommonEthRPC

    # engine methods
    def engine_exchangeCapabilities(self):
        return self.rpc("engine_exchangeCapabilities")

    def engine_forkchoiceUpdatedV3(self, params: ForkChoiceParams):
        params_dict = [asdict(params[0]), asdict(params[1]) if params[1] is not None else None]
        logger.info("Calling engine_forkchoiceUpdatedV3 with %s", params_dict)
        return self.rpc("engine_forkchoiceUpdatedV3", params_dict)

    def engine_getPayloadV3(self, payload_id: HexString):
        return self.rpc("engine_getPayloadV3", [payload_id])

    def engine_newPayloadV3(self):
        return self.rpc("engine_newPayloadV3")

# ############################################################################ #
# Engine Client

class EngineClient(EngineRPC):
    "An engine client with async methods"

    async def sync(
        self,
        fork_choice_state: ForkChoiceState,
    ):
        """
        Submit fork choice for the given head block hash without building a new block.
        """
        while True:

            # new fork choice state
            params = fork_sync_params(fork_choice_state)
            try:
                build = self.engine_forkchoiceUpdatedV3(params)
            except RpcErrorException as e:
                logger.error("Failed to sync: %s", e.error)
                if e.error.get("code") == -38002:
                    raise InvalidForkChoiceStateException(params) from e
            logger.debug(json.dumps(build, indent=2))
            status = build["payloadStatus"].get("status")
            logger.info("fork choice status: %s", status)
            match status:
                case "VALID":
                    return True
                case "INVALID":
                    raise InvalidPayloadStatusException("Fork choice failed: INVALID payload Status")
                case "SYNCING":
                    logger.info("Fork choice pending (sleeping for 0.5s)")
                    await asyncio.sleep(0.5)
                case _:
                    raise InvalidPayloadStatusException("Unexpected RPC status: {status}")

    async def wait_for_fork(
        self,
        fork_choice_state: ForkChoiceState,
        cur_beacon_block_root: BeaconBlockRoot,
        miner_address: Address
    ):
        """
        Submit fork choice for the given head block hash and await a payload job id.
        """
        while True:
            params = fork_choice_update_params(
                fork_choice_state,
                cur_beacon_block_root,
                miner_address
            )
            build = self.engine_forkchoiceUpdatedV3(params)
            logger.debug(json.dumps(build, indent=2))
            status = build.get("payloadStatus").get("status")
            logger.info("fork choice status: %s", status)
            match status:
                case "VALID":
                    payload_id = build.get("payloadId")
                    if payload_id is None:
                        logger.warning("WARNING: payload id is None: %s", params)
                    return payload_id
                case "INVALID":
                    raise InvalidPayloadStatusException("Fork choice failed: INVALID")
                case "SYNCING":
                    logger.info("Fork choice pending (sleeping for 0.5s)")
                    await asyncio.sleep(0.5)
                case _:
                    raise InvalidPayloadStatusException("Unexpected RPC status: {status}")

    async def wait_for_payload(self, payload_id):
        """
        Await payload for the given payload build id
        """
        if payload_id is None:
            raise ValueError("Payload id must not be None")
        for i in range(10):
            try:
                r = self.engine_getPayloadV3(payload_id)
                logger.debug(json.dumps(r, indent=2))
                logger.info("got execution payload for: %s", payload_id)
                return r.get("executionPayload")
            except RpcException:
                logger.warning("Waiting for payload after %d seconds -- retrying", i + 1)
                await asyncio.sleep(1)
        raise GetPayloadException(f"Finally failed to get payload after {i+1} seconds")

    async def wait_for_node(self):
        while True:
            try:
                self.eth_chainId()
                logger.info('Node is ready')
                break
            except requests.Timeout:
                logger.info("Waiting for node... (timeout)")
                time.sleep(1)
            except requests.ConnectionError:
                logger.warning("Waiting for node... (connection error)")
                await asyncio.sleep(1)
