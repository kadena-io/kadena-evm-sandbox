const { expect } = require("chai");
const { ethers, network, switchNetwork } = require("hardhat");
const { ZeroAddress } = require("ethers");
const { getSigners, deployContracts, authorizeContracts, crossChainTransfer, initCrossChain, requestSpvProof, redeemCrossChain, computeOriginHash, createTamperedProof } = require("./utils/utils");


describe("SimpleToken Integration Tests", async function () {
  let signers;
  let token0;
  let token1;
  let token0Info;
  let token1Info;

  beforeEach(async function () {
    signers = await getSigners();
    const deployed = await deployContracts();

    // Store contract instances for direct calls
    token0 = deployed.tokens[0].contract;
    token1 = deployed.tokens[1].contract;

    // Keep deployment info accessible when needed
    token0Info = deployed.tokens[0];
    token1Info = deployed.tokens[1];

    await authorizeContracts(token0, token0Info, [token0Info, token1Info]);
    await authorizeContracts(token1, token1Info, [token0Info, token1Info]);

    await switchNetwork(token0Info.network.name);
  });

  context("Success Test Cases", async function () {
    it("Should transfer tokens to same address from chain 0 to chain 1", async function () {
      const sender = signers.deployer;
      const receiver = signers.deployer;
      const amount = ethers.parseEther("10");

      const senderBalanceBefore = await token0.balanceOf(sender.address);
      const receiverBalanceBefore = await token1.balanceOf(receiver.address);
      await crossChainTransfer(token0, token0Info, token1, token1Info, sender, receiver, amount)
      const senderBalanceAfter = await token0.balanceOf(sender.address);
      const receiverBalanceAfter = await token1.balanceOf(receiver.address);
      expect(senderBalanceBefore - amount).to.equal(senderBalanceAfter);
      expect(receiverBalanceBefore + amount).to.equal(receiverBalanceAfter);
    });

    it("Should transfer tokens to different address from chain 0 to chain 1", async function () {
      const sender = signers.deployer;
      const receiver = signers.alice;
      const amount = ethers.parseEther("10");

      const senderBalanceBefore = await token0.balanceOf(sender.address);
      const receiverBalanceBefore = await token1.balanceOf(receiver.address);
      await crossChainTransfer(token0, token0Info, token1, token1Info, sender, receiver, amount)
      const senderBalanceAfter = await token0.balanceOf(sender.address);
      const receiverBalanceAfter = await token1.balanceOf(receiver.address);
      expect(senderBalanceBefore - amount).to.equal(senderBalanceAfter);
      expect(receiverBalanceBefore + amount).to.equal(receiverBalanceAfter);
    });
  });

  context("Error Test Cases", async function () {
    it("Should revert on second redeem", async function () {
      const sender = signers.deployer;
      const receiver = signers.deployer;
      const amount = ethers.parseEther("10")
      const origin = await initCrossChain(token0, token0Info, token1Info, sender, receiver, amount)
      const originHash = computeOriginHash(origin);
      const proof = await requestSpvProof(token1Info.chain, origin);
      await redeemCrossChain(token1, token1Info, receiver, amount, proof)
      await expect(redeemCrossChain(token1, token1Info, receiver, amount, proof))
        .to.be.revertedWithCustomError(token1, "AlreadyCompleted")
        .withArgs(originHash);
    });

    it("Should revert when redeeming on the wrong chain", async function () {
      const sender = signers.deployer;
      const receiver = signers.deployer;
      const amount = ethers.parseEther("10");

      const origin = await initCrossChain(token0, token0Info, token1Info, sender, receiver, amount)
      const proof = await requestSpvProof(token1Info.chain, origin);
      await expect(redeemCrossChain(token0, token0Info, receiver, amount, proof))
        .to.be.revertedWithCustomError(token1, "IncorrectTargetChainId")
        .withArgs(token1Info.chain, token0Info.chain);
    });

    it("Should revert when redeeming the wrong amount", async function () {
      const sender = signers.deployer;
      const receiver = signers.deployer;
      const amount = ethers.parseEther("10");

      const wrongAmount = amount + BigInt(1); // Add 1 wei
      const origin = await initCrossChain(token0, token0Info, token1Info, sender, receiver, amount)
      const proof = await requestSpvProof(token1Info.chain, origin);
      await expect(redeemCrossChain(token1, token1Info, receiver, wrongAmount, proof))
        .to.be.revertedWithCustomError(token1, "IncorrectAmount")
        .withArgs(amount, wrongAmount);
    });

    it("Should revert when wrong redeeming for wrong receiver", async function () {
      const sender = signers.deployer;
      const receiver = signers.deployer;
      const amount = ethers.parseEther("10");

      const origin = await initCrossChain(token0, token0Info, token1Info, sender, receiver, amount);
      const proof = await requestSpvProof(token1Info.chain, origin);
      await expect(redeemCrossChain(token1, token1Info, signers.alice, amount, proof))
        .to.be.revertedWithCustomError(token1, "IncorrectReceiver")
        .withArgs(receiver, signers.alice.address);
    });

    it("Should revert when redeeming with proof that has been tampered with", async function () {
      const sender = signers.deployer;
      const receiver = signers.deployer;
      const amount = ethers.parseEther("10");

      const origin = await initCrossChain(token0, token0Info, token1Info, sender, receiver, amount);
      const tamperedProof = await createTamperedProof(token1Info.chain, origin);
      await expect(redeemCrossChain(token1, token1Info, receiver, amount, tamperedProof))
        .to.be.revertedWithCustomError(token1, "SPVVerificationFailed");
    });
  });
});








