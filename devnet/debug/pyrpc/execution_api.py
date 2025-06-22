import asyncio
import time
import requests
import logging

# local modules
from rpc import RPC, RpcException
from ethtypes import BlockHash, BlockSpec, Address

logger = logging.getLogger(__name__)

# ############################################################################ #
# Ethereum JSON-RPC

class CommonEthRPC(RPC):
    "Ethereum RPC methods that are also exposed by the Engine"

    def eth_blockNumber(self) -> int:
        "Returns the latest block number of the blockchain"
        return int(self.rpc("eth_blockNumber"), 16)

    def eth_call(self, tx, block_spec: BlockSpec = "latest", state = None):
        "Executes a new message call immediately without creating a transaction on the block chain"
        return self.rpc("eth_call", [tx, block_spec, state])

    def eth_chainId(self):
        "Returns the current network/chain ID, used to sign replay-protected transaction introduced in EIP-155"
        return self.rpc("eth_chainId")

    def eth_getCode(self, address: Address, block: BlockSpec = "latest"):
        "Returns the compiled bytecode of a smart contract"
        return self.rpc("eth_getCode", [address, block])

    def eth_getBlockByHash(self, block_hash: BlockHash):
        "Returns information of the block matching the given block hash."
        return self.rpc("eth_getBlockByHash", [block_hash, False])

    def eth_getBlockByNumber(self, block_spec: BlockSpec):
        """
        Returns information of the block matching the given block number.

        Parameters:
        - number: int|str - block numbe as integer or hex string, or the
            string "earliest", "latest", "safe", "finalized", or "pending".
        """
        if isinstance(block_spec, int):
            block_spec = hex(max(block_spec, 0))
        return self.rpc("eth_getBlockByNumber", [block_spec, False])

    def eth_getLogs(self, log_filter):
        "Returns an array of all logs matching a given filter object"
        return self.rpc("eth_getLogs", [log_filter])

    def eth_sendRawTransaction(self, tx):
        "Creates new message call transaction or a contract creation for signed transactions"
        return self.rpc("eth_sendRawTransaction", [tx])

    def eth_syncing(self):
        "Returns an object with data about the sync status or False"
        return self.rpc("eth_syncing")

# eth
class EthRPC(CommonEthRPC):
    "Ethereum JSON-RPC client"

    # eth methods
    # inherited from CommonEthRPC

    def eth_getTransactionReceipt(self, block_hash: BlockHash):
        "Returns the transaction receipt for a particular transaction hash"
        return self.rpc("eth_getTransactionReceipt", [block_hash])

    def eth_getTransactionByBlockNumberAndIndex(self, block_number:int, index:int):
        "Returns the transaction receipt for a particular transaction hash"
        return self.rpc("eth_getTransactionByBlockNumberAndIndex", [block_number, index])

    def eth_getBalance(self, address: Address, block: BlockSpec = "latest"):
        "Returns the balance of the account of given address in wei"
        return self.rpc("eth_getBalance", [address, block])

    def eth_getAccount(self, address: Address, block: BlockSpec = "latest"):
        "Returns the account information of the given address"
        return self.rpc("eth_getAccount", [address, block])

    def eth_getTransactionCount(self, address: Address, block: BlockSpec = "latest"):
        "Returns the number of transactions sent from an address"
        return self.rpc("eth_getTransactionCount", [address, block])

    def eth_gasPrice(self):
        "Returns the current price per gas in wei"
        return self.rpc("eth_gasPrice")

    # net methods
    def net_peerCount(self):
        return self.rpc("net_peerCount")

    def net_version(self):
        return self.rpc("net_version")

    def net_listening(self):
        return self.rpc("net_listening")

    # admin methods
    def admin_nodeInfo(self):
        return self.rpc("admin_nodeInfo")

    def admin_addPeer(self, peer: str):
        return self.rpc("admin_addPeer", [peer])

    def admin_removePeer(self, peer: str):
        return self.rpc("admin_removePeer", [peer])

    def admin_addTrustedPeer(self, peer: str):
        return self.rpc("admin_addTrustedPeer", [peer])

    def admin_removeTrustedPeer(self, peer: str):
        return self.rpc("admin_removeTrustedPeer", [peer])

    def admin_peers(self):
        return self.rpc("admin_peers")

    # debug methods
    def debug_getBadBlocks(self):
        return self.rpc("debug_getBadBlocks")

    def debug_metrics(self):
        return self.rpc("debug_metrics")

    def debug_traceChain(self, block: BlockSpec):
        return self.rpc("debug_traceChain", [block])

    def debug_traceTransaction(self, tx: str):
        return self.rpc("debug_traceTransaction", [tx])

    def debug_traceBlockByNumber(self, block: BlockSpec):
        return self.rpc("debug_traceBlock", [block])

# ############################################################################ #
# Asynchronous Actions

class InvalidPayloadStatusException(RpcException):
    "Raised on an invalid payload status"

class InvalidForkChoiceStateException(RpcException):
    "Raised on an invalid fork choice state"

class GetPayloadException(RpcException):
    pass

class EthClient(EthRPC):
    async def wait_for_node(self):
        while True:
            try:
                self.admin_nodeInfo()
                logger.info('Node is ready')
                break
            except requests.Timeout:
                logger.info("Waiting for node... (timeout)")
                time.sleep(1)
            except requests.ConnectionError:
                logger.warning("Waiting for node... (connection error)")
                await asyncio.sleep(1)
