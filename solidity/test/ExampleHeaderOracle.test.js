const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ZeroHash, isHexString, getBytes  } = require("ethers");

describe("ExampleHeaderOracle", function () {
    let exampleHeaderOracle;
    let owner;

    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        const ExampleHeaderOracle = await ethers.getContractFactory("ExampleHeaderOracle");
        exampleHeaderOracle = await ExampleHeaderOracle.deploy();
        await exampleHeaderOracle.waitForDeployment();
    });

    describe("Contract deployment", function () {
        it("Should deploy successfully", async function () {
            expect(await exampleHeaderOracle.getAddress()).to.be.properAddress;
            console.log(`Contract deployed at: ${await exampleHeaderOracle.getAddress()}`);
        });
    });

    describe("Precompile availability check", function () {
        it("Should check if beacon root precompile is available", async function () {
            const precompileAddress = "0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02";

            // Check if there's code at the precompile address
            const code = await ethers.provider.getCode(precompileAddress);
            console.log(`Code at precompile address: ${code}`);

            // On a client with EIP-4788, this Should return "0x" (empty but callable)
            // If it returns "0x", the precompile exists but has no bytecode (which is expected)
        });
    });

    describe("getBeaconRoot", function () {
        it("Should handle beacon root query for current block timestamp", async function () {
            const currentBlock = await ethers.provider.getBlock("latest");
            const timestamp = currentBlock.timestamp;

            console.log(`Testing with current block timestamp: ${timestamp}`);
            console.log(`Current block number: ${currentBlock.number}`);

            try {
                const beaconRoot = await exampleHeaderOracle.getBeaconRoot(timestamp);

                // Should be a valid 32-byte hex string
                expect(isHexString(beaconRoot, 32)).to.be.true;
                expect(getBytes(beaconRoot)).to.have.lengthOf(32);

                // The beacon root Should NOT be the zero hash for the current block
                expect(beaconRoot).to.not.equal(ZeroHash);

                console.log(`✓ Beacon root for timestamp ${timestamp}: ${beaconRoot}`);
            } catch (error) {
                console.log(`Error calling getBeaconRoot: ${error.message}`);
                throw error;
            }
        });

        it("Should test direct precompile call", async function () {
            const precompileAddress = "0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02";
            const currentBlock = await ethers.provider.getBlock("latest");
            const timestamp = currentBlock.timestamp;

            try {
                // Direct call to precompile
                const result = await ethers.provider.call({
                    to: precompileAddress,
                    data: ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [timestamp])
                });

                console.log(`Direct precompile call result: ${result}`);

                // Should be a valid 32-byte hex string
                expect(isHexString(result, 32)).to.be.true;
                expect(getBytes(result)).to.have.lengthOf(32);

                // Should NOT be the zero hash for the current block
                expect(result).to.not.equal(ZeroHash);
            } catch (error) {
                console.log(`Direct precompile call failed: ${error.message}`);
                throw error; // Fail the test if an error occurs
            }
        });

        it("Should revert for old timestamp", async function () {
            const oldTimestamp = 1000000000; // Year 2001

            await expect(
                exampleHeaderOracle.getBeaconRoot(oldTimestamp)
            ).to.be.revertedWith("Beacon root call failed");
        });
    });

    describe("Configuration Check", function () {
        it("Should verify chain configuration", async function () {
            const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
            console.log(`Chain ID: ${chainId}`);

            // Check if we can get network info
            const blockNumber = await ethers.provider.getBlockNumber();
            console.log(`Current block number: ${blockNumber}`);

            // This helps debug 
            console.log("Checking we are on the corect network and can get a block number...");
        });
    });


});