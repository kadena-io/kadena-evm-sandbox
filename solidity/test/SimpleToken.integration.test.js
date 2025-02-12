const { expect } = require("chai");
const { ethers, network, switchNetwork } = require("hardhat");
const { ZeroAddress } = require("ethers");
const { getSigners, deployContracts, authorizeContracts, crossChainTransfer, initCrossChain, requestSpvProof, redeemCrossChain } = require("./utils/utils");


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

    // The owner/deployer transfers tokens to other accounts so that they can transfer tokens cross-chain. This is a setup step.
    await token0.transfer(signers.alice.address, ethers.parseEther("1000000")); // Alice has 1M tokens on chain 0
    await token1.transfer(signers.bob.address, ethers.parseEther("1000000")); // Bob has 1M tokens on chain 1


    await authorizeContracts(token0, token0Info, [token0Info, token1Info]);
    await authorizeContracts(token1, token1Info, [token0Info, token1Info]);

    await switchNetwork(token0Info.network.name);
  });

  context("Success Test Cases", async function () {
    it("Should transfer tokens to same address from chain 0 to chain 1", async function () {
      const sender = signers.alice;
      const receiver = signers.alice;
      const amount = ethers.parseEther("500");

      const senderBalanceBefore = await token0.balanceOf(sender.address);
      const receiverBalanceBefore = await token1.balanceOf(receiver.address);
      await crossChainTransfer(token0, token0Info, token1, token1Info, sender, receiver, amount)
      const senderBalanceAfter = await token0.balanceOf(sender.address);
      const receiverBalanceAfter = await token1.balanceOf(receiver.address);
      expect(senderBalanceBefore - amount).to.equal(senderBalanceAfter);
      expect(receiverBalanceBefore + amount).to.equal(receiverBalanceAfter);
    });

    it("Should transfer tokens to different address from chain 0 to chain 1", async function () {
      const sender = signers.alice;
      const receiver = signers.bob;
      const amount = ethers.parseEther("250000");

      const senderBalanceBefore = await token0.balanceOf(sender.address);
      const receiverBalanceBefore = await token1.balanceOf(receiver.address);
      await crossChainTransfer(token0, token0Info, token1, token1Info, sender, receiver, amount)
      const senderBalanceAfter = await token0.balanceOf(sender.address);
      const receiverBalanceAfter = await token1.balanceOf(receiver.address);
      expect(senderBalanceBefore - amount).to.equal(senderBalanceAfter);
      expect(receiverBalanceBefore + amount).to.equal(receiverBalanceAfter);
    });

    // This test case is skipped because it does not work. The CrossChainInitialized is sometimes not emitted on chain 1. In that case the event index is -1
    //  When it is emitted, the proof request failes with a 500
    it.skip("Should transfer tokens to different address from chain 1 to chain 0", async function () {
      const sender = signers.alice;
      const receiver = signers.bob;
      const amount = ethers.parseEther("10");

      const senderBalanceBefore = await token1.balanceOf(sender.address);
      const receiverBalanceBefore = await token0.balanceOf(receiver.address);

      //await switchNetwork(token1Info.network.name);

      await crossChainTransfer(token1, token1Info, token0, token0Info, sender, receiver, amount)


      console.log("token1", token1);
      /*
            // Set up event listener before transfer
            const tx = await token1.connect(sender).transferCrossChain(
              receiver.address,
              amount,
              token0Info.chain
            );
            const receipt = await tx.wait();
      
            console.log("TransferCrossChain receipt:", receipt);
      
            // Parse events from receipt
            const events = receipt.logs.map(log => {
              try {
                return token1.interface.parseLog({
                  topics: log.topics,
                  data: log.data
                });
              } catch (e) {
                return null;
              }
            }).filter(Boolean);
      
            // Find and log CrossChainInitialized event
            const crossChainEvent = events.find(e => e.name === "CrossChainInitialized");
            if (crossChainEvent) {
              console.log("CrossChainInitialized event found:");
              console.log("- targetChainId:", crossChainEvent.args[0]);
              console.log("- targetContractAddress:", crossChainEvent.args[1]);
              console.log("- crossChainOperationType:", crossChainEvent.args[2]);
              console.log("- crossChainData:", crossChainEvent.args[3]);
            } else {
              console.log("CrossChainInitialized event not found in receipt");
            }
        */

      const senderBalanceAfter = await token1.balanceOf(sender.address);
      const receiverBalanceAfter = await token0.balanceOf(receiver.address);
      expect(senderBalanceBefore - amount).to.equal(senderBalanceAfter);
      expect(receiverBalanceBefore + amount).to.equal(receiverBalanceAfter);
    });

    it("Should transfer sender's full balance", async function () {
      const sender = signers.alice;
      const receiver = signers.bob;

      const senderBalanceBefore = await token0.balanceOf(sender.address);
      const receiverBalanceBefore = await token1.balanceOf(receiver.address);
      const amount = senderBalanceBefore;
      await crossChainTransfer(token0, token0Info, token1, token1Info, sender, receiver, amount)
      const senderBalanceAfter = await token0.balanceOf(sender.address);
      const receiverBalanceAfter = await token1.balanceOf(receiver.address);
      expect(senderBalanceAfter).to.equal(0n);
      expect(receiverBalanceBefore + amount).to.equal(receiverBalanceAfter);
    });

    it("Should complete multiple consecutive transfers from sender to different receivers correctly", async function () {
      const sender = signers.alice;
      const receiver1 = signers.bob;
      const receiver2 = signers.carol;
      const amount1 = ethers.parseEther("100");
      const amount2 = ethers.parseEther("200");

      // Transfer 1
      const senderBalanceBeforeTransfer1 = await token0.balanceOf(sender.address);
      const receiver1BalanceBeforeTransfer1 = await token1.balanceOf(receiver1.address);

      const origin1 = await initCrossChain(token0, token0Info, token1Info, sender, receiver1, amount1);

      // Transfer 2
      const receiver2BalanceBeforeTransfer2 = await token1.balanceOf(receiver2.address);
      const origin2 = await initCrossChain(token0, token0Info, token1Info, sender, receiver2, amount2);

      const proof1 = await requestSpvProof(token1Info.chain, origin1);


      // Redeem Transfer 1
      await redeemCrossChain(token1, token1Info, receiver1, amount1, proof1);


      const proof2 = await requestSpvProof(token1Info.chain, origin2);

      // Redeem Transfer 2
      await redeemCrossChain(token1, token1Info, receiver2, amount2, proof2);

      const senderBalanceAfter = await token0.balanceOf(sender.address);
      const receiver1BalanceAfter = await token1.balanceOf(receiver1.address);
      const receiver2BalanceAfter = await token1.balanceOf(receiver2.address);
      expect(senderBalanceAfter).to.equals(senderBalanceBeforeTransfer1 - amount1 - amount2);
      expect(receiver1BalanceAfter).to.equal(receiver1BalanceBeforeTransfer1 + amount1);
      expect(receiver2BalanceAfter).to.equal(receiver2BalanceBeforeTransfer2 + amount2);
    });

    it("Should allow third party to redeem on behalf of receiver", async function () {
      // Switch to chain 1 and get signer carol on chain 1.
      // Not needed in other test cases because the contract is by default called by the first signer on the chain where the contract is deployed.
      await switchNetwork(token1Info.network.name);
      const [, , , carol] = await ethers.getSigners();
      const sender = signers.alice;
      const receiver = signers.bob;
      const redeemer = carol;
      const amount = ethers.parseEther("100");

      const senderBalanceBefore = await token0.balanceOf(sender.address);
      const receiverBalanceBefore = await token1.balanceOf(receiver.address);
      const redeemerBalanceBefore = await token1.balanceOf(redeemer.address);

      // Start transfer 
      const origin = await initCrossChain(token0, token0Info, token1Info, sender, receiver, amount);
      const proof = await requestSpvProof(token1Info.chain, origin);

      // Redeem transfer
      const tx = await token1.connect(redeemer).redeemCrossChain(receiver, amount, proof);
      await tx.wait();
     
      const senderBalanceAfter = await token0.balanceOf(sender.address);
      const receiverBalanceAfter = await token1.balanceOf(receiver.address);
      const recdeemerBalanceAfter = await token1.balanceOf(redeemer.address);

      expect(senderBalanceAfter).to.equals(senderBalanceBefore - amount);
      expect(receiverBalanceAfter).to.equal(receiverBalanceBefore + amount);
      expect(recdeemerBalanceAfter).to.equal(redeemerBalanceBefore);
    });
  });

  context("Error Test Cases", async function () {
    it("Should fail when attempting multiple transfers that exceed balance", async function () {
      const sender = signers.alice;
      const receiver = signers.bob;
      const balance = await token0.balanceOf(sender.address);
      const amount = balance / 2n + ethers.parseEther("1");

      // First transfer should succeed
      await crossChainTransfer(token0, token0Info, token1, token1Info, sender, receiver, amount);

      // Second transfer should fail
      await expect(
        crossChainTransfer(token0, token0Info, token1, token1Info, sender, receiver, amount)
      ).to.be.revertedWithCustomError(token0, "ERC20InsufficientBalance");
    });

    // This test case is skipped because the VALIDATE_PROOF_PRECOMPILE is not yet fully implemented
    it.skip("Should fail when trying to redeem before transfer is initiated", async function () {
      const receiver = signers.bob;
      const amount = ethers.parseEther("100");

      // Create fake origin
      const fakeOrigin = {
        chain: BigInt(token0Info.chain),
        originContractAddress: token0Info.address,
        height: 999999n,
        txIdx: 0n,
        eventIdx: 0n
      };

      // Create fake proof bytes matching precompile input format
      const fakeProof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "uint32", "uint32"],
        [
          fakeOrigin.height,
          fakeOrigin.txIdx,
          fakeOrigin.eventIdx,
          token1Info.chain,  // target chain
          token0Info.chain   // origin chain
        ]
      );

      await expect(
        token1.connect(receiver).redeemCrossChain(
          receiver.address,
          amount,
          fakeProof
        )
      ).to.be.revertedWithCustomError(token1, "SPVVerificationFailed");

    });

  }); // End of Error Test Cases
});








