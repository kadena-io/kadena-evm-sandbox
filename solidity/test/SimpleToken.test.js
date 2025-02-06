const { expect } = require("chai");
const { ethers, network, switchNetwork } = require("hardhat");
const { ZeroAddress } = require("ethers");
const { getSigners, deployContracts, authorizeContracts, initCrossChain, computeOriginHash, requestSpvProof, CrossChainOperation, createTamperedProof, redeemCrossChain } = require("./utils/utils");

describe("SimpleToken Unit Tests", async function () {
  let signers;
  let token0;
  let token1;

  beforeEach(async function () {
    signers = await getSigners();
    const deployed = await deployContracts();

    // Store contract instances for direct calls
    token0 = deployed.tokens[0].contract;
    token1 = deployed.tokens[1].contract;

    // Keep deployment info accessible when needed
    token0Info = deployed.tokens[0];
    token1Info = deployed.tokens[1];
    await switchNetwork(token0Info.network.name);
  });

  context("Deployment and Initialization", async function () {
    context("Success Test Cases", async function () {
      it("Should have the correct configuration after deployment on both chains", async function () {
        expect(await token0.symbol()).to.equal("SIM");
        expect(await token0.totalSupply()).to.equal(ethers.parseEther("1000000"));
        expect(await token1.totalSupply()).to.equal(ethers.parseEther("1000000"));
        expect(await token1.name()).to.equal("SimpleToken");
        expect(await token1.symbol()).to.equal("SIM");
      });
    });// End of Success Test Cases
  }); // End of Deployment and Initialization

  describe("setCrossChainAddress", async function () {
    context("Success Test Cases", async function () {
      it("Should correctly set cross chain addresses", async function () {
        // Explicitly set cross-chain addresses for token0
        const tx1 = await token0.setCrossChainAddress(token1Info.chain, await token1.getAddress());
        await tx1.wait();
        expect(await token0.getCrossChainAddress(token1Info.chain)).to.equal(await token1.getAddress());

        await expect(tx1)
          .to.emit(token0, "CrossChainAddressSet")
          .withArgs(token1Info.chain, await token1.getAddress(), signers.deployer.address);


        // Explicitly set cross-chain addresses for token1
        await switchNetwork(token1Info.network.name);
        const tx2 = await token1.setCrossChainAddress(token0Info.chain, await token0.getAddress());
        await tx2.wait();
        expect(await token1.getCrossChainAddress(token0Info.chain)).to.equal(await token0.getAddress());

        await expect(tx2)
          .to.emit(token1, "CrossChainAddressSet")
          .withArgs(token0Info.chain, await token0.getAddress(), signers.deployer.address);

      });

      it("Should allow a cross chain address to be set to the zero address", async function () {
        // Explicitly set cross-chain addresses for token0
        const tx1 = await token0.setCrossChainAddress(token1Info.chain, ZeroAddress);
        await tx1.wait();
        expect(await token0.getCrossChainAddress(token1Info.chain)).to.equal(ZeroAddress);

        await expect(tx1)
          .to.emit(token0, "CrossChainAddressSet")
          .withArgs(token1Info.chain, ZeroAddress, signers.deployer.address);
      });
    }); // End of Success Test Cases

    context("Error Test Cases", async function () {
      it("Should fail to set cross chain addresses for non-owner", async function () {
        // Attempt to set cross-chain addresses for token0 from a non-owner
        await expect(token0.connect(signers.alice).setCrossChainAddress(token1Info.chain, await token1.getAddress()))
          .to.be.revertedWithCustomError(token0, "OwnableUnauthorizedAccount")
          .withArgs(signers.alice.address);
      });
    });
  }); // End of setCrossChainAddress

  describe("verifySPV", async function () {
    beforeEach(async function () {
      await authorizeContracts(token0, token0Info, [token0Info, token1Info]);
      await authorizeContracts(token1, token1Info, [token0Info, token1Info]);
    });

    context("Success Test Cases", async function () {
      it("Should verify a valid SPV proof and return correct values", async function () {
        const sender = signers.deployer;
        const receiver = signers.deployer;
        const amount = ethers.parseEther("10");

        const origin = await initCrossChain(token0, token0Info, token1Info, sender, receiver, amount);
        const proof = await requestSpvProof(token1Info.chain, origin);
        const [crossChainMessage, originHash] = await token1.verifySPV(proof);

        // Verify CrossChainMessage fields
        expect(crossChainMessage.targetChainId).to.equal(token1Info.chain);
        expect(crossChainMessage.targetContractAddress).to.equal(await token1.getAddress());
        expect(crossChainMessage.crossChainOperationType).to.equal(CrossChainOperation.Erc20Transfer);

        // Verify origin fields
        expect(crossChainMessage.origin.originChainId).to.equal(token0Info.chain);
        expect(crossChainMessage.origin.originContractAddress).to.equal(await token0.getAddress());
        expect(crossChainMessage.origin.originBlockHeight).to.equal(origin.height);
        expect(crossChainMessage.origin.originTransactionIndex).to.equal(origin.txIdx);
        expect(crossChainMessage.origin.originEventIndex).to.equal(origin.eventIdx);

        // Create array matching Solidity struct layout from CrossChainMessage.origin array
        const originData = [
          crossChainMessage.origin.originChainId,
          crossChainMessage.origin.originContractAddress,
          crossChainMessage.origin.originBlockHeight,
          crossChainMessage.origin.originTransactionIndex,
          crossChainMessage.origin.originEventIndex
        ];

        const expectedOriginHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
          ["tuple(uint32,address,uint64,uint64,uint64)"],
          [originData]
        ));

        expect(originHash).to.equal(expectedOriginHash);
      });

      it("Should not set originHash to true when verifying a valid SPV proof", async function () {
        const sender = signers.deployer;
        const receiver = signers.deployer;
        const amount = ethers.parseEther("10");

        const origin = await initCrossChain(token0, token0Info, token1Info, sender, receiver, amount);
        const proof = await requestSpvProof(token1Info.chain, origin);
        const [crossChainMessage, originHash] = await token1.verifySPV(proof);

        expect(await token1.completed(originHash)).to.be.false;
      });
    }); // End of Success Test Cases

    context("Error Test Cases", async function () {
      it("Should revert when verifying proof that has been tampered with", async function () {
        const sender = signers.deployer;
        const receiver = signers.deployer;
        const amount = ethers.parseEther("10");

        const origin = await initCrossChain(token0, token0Info, token1Info, sender, receiver, amount);
        const tamperedProof = await createTamperedProof(token1Info.chain, origin);
        await expect(token1.verifySPV(tamperedProof))
          .to.be.revertedWithCustomError(token1, "SPVVerificationFailed");
      });

      it("Should revert if already completed", async function () {
        const sender = signers.deployer;
        const receiver = signers.deployer;
        const amount = ethers.parseEther("10")
        const origin = await initCrossChain(token0, token0Info, token1Info, sender, receiver, amount)
        const originHash = computeOriginHash(origin);
        const proof = await requestSpvProof(token1Info.chain, origin);
        await redeemCrossChain(token1, token1Info, receiver, amount, proof)
        await expect(token1.verifySPV(proof))
          .to.be.revertedWithCustomError(token1, "AlreadyCompleted")
          .withArgs(originHash);
      });
    }); // End of Error Test Cases
  }); // End of verifySPV

  describe("transferCrossChain", async function () {
    beforeEach(async function () {
      await authorizeContracts(token0, token0Info, [token0Info, token1Info]);
      await authorizeContracts(token1, token1Info, [token0Info, token1Info]);
    });
    context("Success Test Cases", async function () {
      it("Should burn the correct amount of tokens for the caller", async function () {
        const sender = signers.deployer;
        const receiver = signers.deployer;
        const amount = ethers.parseEther("10");

        const senderBalanceBefore = await token0.balanceOf(sender.address);
        const tx = await token0.transferCrossChain(receiver.address, amount, token1Info.chain);
        await tx.wait();
        const senderBalanceAfter = await token0.balanceOf(sender.address);

        expect(senderBalanceAfter).to.equal(senderBalanceBefore - amount);
      });

      it("Should emit the correct events", async function () {
        const sender = signers.deployer;
        const receiver = signers.deployer;
        const amount = ethers.parseEther("10");

        // Create and encode CrossChainData
        const expectedCrossChainData = ethers.AbiCoder.defaultAbiCoder().encode(
          ["tuple(uint32,address,uint256)"],
          [[
            token1Info.chain,    // receiverChainId
            receiver.address,    // receiverAccount
            amount              // value
          ]]
        );

        const tx = await token0.transferCrossChain(receiver.address, amount, token1Info.chain);
        await tx.wait();

        await expect(tx)
          .to.emit(token0, "Transfer")
          .withArgs(sender.address, ZeroAddress, amount)
          .and.to.emit(token0, "CrossChainInitialized")
          .withArgs(token1Info.chain, await token1.getAddress(), CrossChainOperation.Erc20Transfer, expectedCrossChainData);
      });
    }); // End of Success Test Cases

    context("Error Test Cases", async function () {
      it("Should revert when transferring to the zero address", async function () {
        const amount = ethers.parseEther("10");
        await expect(token0.transferCrossChain(ZeroAddress, amount, token1Info.chain))
          .to.be.revertedWithCustomError(token0, "InvalidReceiver")
          .withArgs(ZeroAddress);
      });

      it("Should revert when transferring amount 0", async function () {
        const receiver = signers.deployer;
        const amount = 0n;
        await expect(token0.transferCrossChain(receiver, amount, token1Info.chain))
          .to.be.revertedWithCustomError(token0, "InvalidAmount")
          .withArgs(amount);
      });

      it("Should revert when sender has insufficient balance", async function () {
        const sender = signers.alice;
        const receiver = signers.deployer;
        const amount = ethers.parseEther("10");

        await expect(token0.connect(sender).transferCrossChain(receiver.address, amount, token1Info.chain))
          .to.be.revertedWithCustomError(token0, "ERC20InsufficientBalance")
          .withArgs(sender.address, 0n, amount);
      });

      it("Should revert when transferring to the same chain", async function () {
        const receiver = signers.deployer;
        const amount = ethers.parseEther("10");
        await expect(token0.transferCrossChain(receiver, amount, token0Info.chain))
          .to.be.revertedWithCustomError(token0, "TargetChainIsCurrentChain")
          .withArgs(token0Info.chain, token0Info.chain);
      });

      it("Should revert when transferring to a nonexistent chain", async function () {
        const receiver = signers.deployer;
        const amount = ethers.parseEther("10");
        await expect(token0.transferCrossChain(receiver, amount, 2n))
          .to.be.revertedWithCustomError(token0, "TargetContractAddressNotFound")
          .withArgs(2n);
      });

      it("Should revernt when no cross chain address is set for target chain", async function () {
        const receiver = signers.deployer;
        const amount = ethers.parseEther("10");

        const tx1 = await token0.setCrossChainAddress(token1Info.chain, ZeroAddress);
        await tx1.wait();

        await expect(token0.transferCrossChain(receiver, amount, token1Info.chain))
          .to.be.revertedWithCustomError(token0, "TargetContractAddressNotFound")
          .withArgs(token1Info.chain);
      });
    }); // End of Error Test Cases
  }); // End of transferCrossChain
}); // End of SimpleToken Unit Tests








