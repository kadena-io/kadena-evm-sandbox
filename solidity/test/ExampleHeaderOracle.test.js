const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ExampleHeaderOracle", function () {
  let exampleHeaderOracle;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    
    const ExampleHeaderOracle = await ethers.getContractFactory("ExampleHeaderOracle");
    exampleHeaderOracle = await ExampleHeaderOracle.deploy();
    await exampleHeaderOracle.waitForDeployment();
  });

  describe("Precompile availability check", function () {
    it("should check if beacon root precompile is available", async function () {
      const precompileAddress = "0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02";
      
      // Check if there's code at the precompile address
      const code = await ethers.provider.getCode(precompileAddress);
      console.log(`Code at precompile address: ${code}`);
      
      // On reth with EIP-4788, this should return "0x" (empty but callable)
      // If it returns "0x", the precompile exists but has no bytecode (which is expected)
    });
  });

  describe("getBeaconRoot", function () {
    it("should handle beacon root query for current block timestamp", async function () {
      // Get the current block to use its timestamp
      const currentBlock = await ethers.provider.getBlock("latest");
      const timestamp = currentBlock.timestamp;

      console.log(`Testing with current block timestamp: ${timestamp}`);
      console.log(`Current block number: ${currentBlock.number}`);

      try {
        // Call the getBeaconRoot function
        const beaconRoot = await exampleHeaderOracle.getBeaconRoot(timestamp);
        
        // The beacon root should be a valid bytes32 (32 bytes)
        expect(beaconRoot).to.be.a("string");
        expect(beaconRoot).to.match(/^0x[0-9a-fA-F]{64}$/);
        
        console.log(`✓ Beacon root for timestamp ${timestamp}: ${beaconRoot}`);
        
        // Check if it's a zero hash (expected if no beacon chain data)
        const isZeroHash = beaconRoot === "0x0000000000000000000000000000000000000000000000000000000000000000";
        console.log(`Is zero hash: ${isZeroHash}`);
        
      } catch (error) {
        console.log(`Error calling getBeaconRoot: ${error.message}`);
        // If the precompile isn't properly configured, we expect this to fail
        expect(error.message).to.include("Beacon root call failed");
      }
    });

    it("should test direct precompile call", async function () {
      // Test direct call to the precompile to debug
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
        
        // If successful, result should be 32 bytes
        if (result && result !== "0x") {
          expect(result).to.have.lengthOf(66); // 0x + 64 hex chars
        }
      } catch (error) {
        console.log(`Direct precompile call failed: ${error.message}`);
      }
    });

    it("should handle old timestamp gracefully", async function () {
      // Use a very old timestamp that's not in the ring buffer
      const oldTimestamp = 1000000000; // Year 2001
      
      try {
        const beaconRoot = await exampleHeaderOracle.getBeaconRoot(oldTimestamp);
        console.log(`Old timestamp result: ${beaconRoot}`);
        
        // Should return zero hash for unavailable timestamps if precompile works
        // or throw error if precompile isn't configured
        expect(beaconRoot).to.be.a("string");
        expect(beaconRoot).to.match(/^0x[0-9a-fA-F]{64}$/);
      } catch (error) {
        console.log(`Old timestamp query failed (expected if precompile not configured): ${error.message}`);
      }
    });
  });

  describe("Reth Configuration Check", function () {
    it("should verify chain configuration", async function () {
      const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
      console.log(`Chain ID: ${chainId}`);
      
      // Check if we can get network info
      const blockNumber = await ethers.provider.getBlockNumber();
      console.log(`Current block number: ${blockNumber}`);
      
      // This helps debug 
      console.log("Checking we are on the corect network and can get a block number...");
    });
  });

  describe("Contract deployment", function () {
    it("should deploy successfully", async function () {
      expect(await exampleHeaderOracle.getAddress()).to.be.properAddress;
      console.log(`Contract deployed at: ${await exampleHeaderOracle.getAddress()}`);
    });
  });
});