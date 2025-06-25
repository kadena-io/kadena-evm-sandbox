// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract ExampleHeaderOracle {
    address constant BEACON_ROOTS = 0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02;

    function getBeaconRoot(uint256 timestamp) external view returns (bytes32) {
        (bool success, bytes memory data) = BEACON_ROOTS.staticcall(
            abi.encode(timestamp)
        );
        require(success, "Beacon root call failed");
        return abi.decode(data, (bytes32));
    }
}
