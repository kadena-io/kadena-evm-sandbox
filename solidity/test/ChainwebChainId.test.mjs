import { expect } from "chai";
import { callChainIdContract, getChainIdContract, getNetworks, withChainweb } from "./utils/utils.js";

import pkg from 'hardhat';
const { ethers, network } = pkg;

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
