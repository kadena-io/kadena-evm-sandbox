import { expect, assert } from "chai";
import { useEnvironment } from "./helpers.mjs";

// import pkg from 'hardhat';
// const { ethers, network } = pkg;


// import { CHAIN_ID_ADDRESS, CHAIN_ID_ABI } from '../src/index.mjs';

const NETWOKR_STEM = 'kadena_chainweb'

describe("ChainwebChainId Tests", async function () {
  useEnvironment("hardhat-project");
  it("Should do something", async function () {
    console.log("doing something");
  });

  // it("Should return the chainweb chain id", async function () {
  //   const networks = Object.keys(hre.config.networks).filter(net => net.includes(NETWORK_STEM));
  //   for (const netname of networks) {
  //     await switchNetwork(netname);
  //     const cid = network.config.chainwebChainId;
  //     const contract = new ethers.Contract(CHAIN_ID_ADDRESS, CHAIN_ID_ABI, ethers.provider)
  //     await contract.chainwebChainId()
  //     expect(await contract.chainwebChainId()).to.equal(cid);
  //   }
  // });
});
