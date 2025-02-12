import { expect } from "chai";

import pkg from "hardhat";
const { network, chainweb } = pkg;

describe("ChainwebChainId Tests", async function () {
  chainweb.withChainweb();
  it("Should return the chainweb chain id", async function () {
    for (const chainId of chainweb.getChainIds()) {
      await chainweb.switchChain(chainId);
      const cid = network.config.chainwebChainId;
      const a = await chainweb.callChainIdContract();
      expect(a).to.equal(cid);
    }
  });
});
