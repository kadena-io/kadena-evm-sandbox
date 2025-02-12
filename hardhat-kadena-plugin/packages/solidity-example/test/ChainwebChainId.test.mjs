import { expect } from "chai";
// import { callChainIdContract, getNetworks } from "./utils/utils.js";

import pkg from "hardhat";
const { ethers, network, chainweb } = pkg;

const { callChainIdContract, withChainweb, getNetworks } = chainweb.utils;

describe("ChainwebChainId Tests", async function () {
  withChainweb();

  it("Should return the chainweb chain id", async function () {
    for (const netname of getNetworks()) {
      await switchNetwork(netname);
      const cid = network.config.chainwebChainId;
      const a = await callChainIdContract();
      expect(a).to.equal(cid);
    }
  });
});
