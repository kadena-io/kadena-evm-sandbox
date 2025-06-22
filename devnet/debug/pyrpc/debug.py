import os
import engine_api

NODE = "bootnode"

NODE_URL = f"http://{NODE}:8551"
JWT_SECRET = os.getenv("JWT_SECRET", "0x")

engine = engine_api.EngineClient(NODE_URL, JWT_SECRET)

def get_forkchoice_state(n: int|None = 0) -> engine_api.ForkChoiceState:
    """
    Get fork choice state at depth of n.
    """
    latest = engine.eth_getBlockByNumber("latest")
    safe = engine.eth_getBlockByNumber("safe")
    final = engine.eth_getBlockByNumber("finalized")

    if n is None or n == 0:
        new_head = latest
    else:
        new_head = engine.eth_getBlockByNumber(latest["number"] - n)
    
    # Update the fork choice state
    new_state = engine_api.ForkChoiceState(
        headBlockHash=new_head["hash"],
        safeBlockHash=safe["hash"],
        finalizedBlockHash=final["hash"],
    )
    return new_state

def rewind_forkchoice_update_params(n: int, produceBlock: bool = True) -> engine_api.ForkChoiceParams:
    """
    Rewinds the fork choice state and updates it.
    """
    if n <= 0:
        raise ValueError("n must be greater than 0")

    latest = engine.eth_getBlockByNumber("latest")
    safe = engine.eth_getBlockByNumber("safe")
    final = engine.eth_getBlockByNumber("finalized")
    new_head = engine.eth_getBlockByNumber(int(latest["number"],16) - n)
    new_state = engine_api.ForkChoiceState(
        headBlockHash=new_head["hash"],
        safeBlockHash=safe["safe"],
        finalizedBlockHash=final["hash"],
    )

    if produceBlock:
        new_succ = engine.eth_getBlockByNumber(int(new_head["number"],16) + 1)
        parent_beacon_block_root = new_succ["parentBeaconblockRoot"]
        miner_address = new_succ['withdrawals'][0]['address']
        return engine_api.fork_choice_update_params(
            fork_choice_state=new_state,
            parent_beacon_block_root=parent_beacon_block_root,
            miner_address=miner_address,
        )
    else:
        return engine_api.fork_sync_params(new_state)

# ################################################################################
# Test Rewind and catchup of EL client

# current state
latest = engine.eth_getBlockByNumber("latest")
safe = engine.eth_getBlockByNumber("safe")
final = engine.eth_getBlockByNumber("finalized")

# docker compose stop NODE

# rewind by n blocks
n = 3
fcu_params = rewind_forkchoice_update_params(n)
fcu_result = engine.engine_forkchoiceUpdatedV3(fcu_params)
