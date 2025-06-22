import time
import logging

logger = logging.getLogger(__name__)

# ############################################################################ #
# Misc Utils

type HexString = str
type Timestamp = int

def current_timestamp() -> Timestamp:
    "Get the current POSIX timestamp in seconds"
    return int(time.time())

def current_timestamp_hex() -> HexString:
    "Get the current POSIX timestamp in seconds as a hex string"
    return hex(current_timestamp())

NULL_256 = "0x" + 32 * "00"
ZERO_HASH =  NULL_256

# ############################################################################ #
# Types

type Hash32 = HexString
type BlockHash = Hash32
type BeaconBlockRoot = Hash32
type BlockNumber = int
type BlockSpec = int|str|HexString
type Address = HexString
type PayloadId = HexString

def get_block_number(b):
    "Get the block number from a block object"
    return int(b.get("number"), 16)

ZERO_ADDRESS = "0x" + 40 * "0"
