import { Contract } from "ethers";
import "./type.js";
import { CHAIN_ID_ABI, CHAIN_ID_ADDRESS } from "./utils/network-contracts.js";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { BaseContract } from "ethers";
import { ContractTransactionResponse } from "ethers";

interface Origin {
  chain: bigint;
  originContractAddress: string;
  height: bigint;
  txIdx: bigint;
  eventIdx: bigint;
}

export const getUtils = (hre: HardhatRuntimeEnvironment) => {
  const { ethers, network } = hre;
  const NETWORK_STEM = hre.config.chainweb.networkStem || "kadena_hardhat_";

  function getNetworks() {
    return Object.keys(hre.config.networks).filter((net) =>
      net.includes(NETWORK_STEM)
    );
  }

  function usesHardhatNetwork() {
    return NETWORK_STEM == "kadena_hardhat";
  }

  // export function withChainweb() {
  //   if (usesHardhatNetwork()) {
  //     before(async function () {
  //       await hre.chainweb.startHardhatNetwork();
  //     });

  //     after(async function () {
  //       await hre.chainweb.stopHardhatNetwork();
  //     });
  //   }
  // }

  function getChainIdContract() {
    return new ethers.Contract(CHAIN_ID_ADDRESS, CHAIN_ID_ABI, ethers.provider);
  }

  async function callChainIdContract() {
    const hex = await ethers.provider.send("eth_call", [
      { to: CHAIN_ID_ADDRESS },
      "latest",
      {},
    ]);
    return parseInt(hex, 16);
  }

  async function deployContractOnChains(name: string) {
    const chains = hre.chainweb.getChainIds();
    console.log(
      `Found ${chains.length} Kadena devnet networks: ${chains.join(", ")}`
    );

    // const deployments = {};
    const tokens = []; // Array for individual token access

    for (const chainId of chains) {
      try {
        await hre.chainweb.switchChain(chainId);
        const cid = network.config.chainwebChainId;
        const [deployer] = await ethers.getSigners();
        console.log(
          `Deploying with signer: ${deployer.address} on network ${chainId}`
        );

        /* Deploy the contract */
        const factory = await ethers.getContractFactory(name);
        const contract = await factory.deploy(ethers.parseEther("1000000"));
        const deploymentTx = contract.deploymentTransaction();
        if (!deploymentTx) {
          throw new Error("Deployment transaction failed");
        }
        await deploymentTx.wait();
        const tokenAddress = await contract.getAddress();

        // Store deployment info in both formats
        const deploymentInfo = {
          contract,
          address: tokenAddress,
          chain: cid,
          network: {
            chainId,
            name: `${hre.config.chainweb.networkStem}${chainId}`,
          },
        };

        tokens.push(deploymentInfo);
      } catch (error) {
        console.error(`Failed to deploy to network ${chainId}:`, error);
      }
    }

    // Return both formats
    return {
      tokens, // Access like: deployments.tokens[0]
    };
  }

  async function deployMocks() {
    const chains = hre.chainweb.getChainIds();
    console.log(
      `Found ${chains.length} Kadena devnet networks while deploying mocks: ${chains.join(", ")}`
    );
    // const deployments = {};
    const tokens = [];
    // const signers = await getSigners();

    for (const chainId of chains) {
      try {
        await hre.chainweb.switchChain(chainId);
        const cid = network.config.chainwebChainId;
        const [deployer] = await ethers.getSigners();
        console.log(
          `Deploying with signer: ${deployer.address} on network ${chainId}`
        );

        /* Deploy the mock token contract */
        const factory = await ethers.getContractFactory(
          "WrongOperationTypeToken"
        );
        const contract = await factory.deploy(ethers.parseEther("1000000"));
        const deploymentTx = contract.deploymentTransaction();
        if (!deploymentTx) {
          throw new Error("Deployment transaction failed");
        }
        await deploymentTx.wait();
        const tokenAddress = await contract.getAddress();

        // Store deployment info in both formats
        const deploymentInfo = {
          contract,
          address: tokenAddress,
          chain: cid,
          network: {
            chainId,
            name: `${hre.config.chainweb.networkStem}${chainId}`,
          },
        };

        tokens.push(deploymentInfo);
      } catch (error) {
        console.error(`Failed to deploy to network ${chainId}:`, error);
      }
    }

    return {
      tokens,
    };
  }

  function computeOriginHash(origin: Origin) {
    // Create a proper ABI encoding matching Solidity struct layout
    const abiEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(uint32,address,uint64,uint64,uint64)"],
      [
        [
          origin.chain, // uint32 originChainId
          origin.originContractAddress, // address originContractAddress
          origin.height, // uint64 originBlockHeight
          origin.txIdx, // uint64 originTransactionIndex
          origin.eventIdx, // uint64 originEventIndex
        ],
      ]
    );

    // Hash it using keccak256
    return ethers.keccak256(abiEncoded);
  }

  /* *************************************************************************** */
  /* Off-Chain: SPV Proof Creation */

  // Call our chainweb SPV api with the necesasry proof parameters
  async function getProof(trgChain: number, origin: Origin) {
    return fetch(
      `http://localhost:1848/chainweb/0.0/evm-development/chain/${trgChain}/spv/chain/${origin.chain}/height/${origin.height}/transaction/${origin.txIdx}/event/${origin.eventIdx}`
    );
  }

  // Request cross-chain transfer SPV proof
  async function requestSpvProof(targetChain: number, origin: Origin) {
    if (usesHardhatNetwork()) {
      const hexProof = await hre.chainweb.network.getSpvProof(
        targetChain,
        origin
      );
      console.log(`Hex proof: ${hexProof}`);
      return hexProof;
    } else {
      const spvCall = await getProof(targetChain, origin);
      const proof = await spvCall.json();
      const proofStr = JSON.stringify(proof);
      const hexProof = "0x" + Buffer.from(proofStr, "utf8").toString("hex");
      return hexProof;
    }
  }

  async function createTamperedProof(targetChain: number, origin: Origin) {
    const spvCall = await getProof(targetChain, origin);
    const proofBytes = await spvCall.arrayBuffer();
    const bytes = new Uint8Array(proofBytes);

    // Corrupt middle of proof
    const midPoint = Math.floor(bytes.length / 2);
    bytes[midPoint] = 0xff; // Change single byte to invalid value

    return "0x" + Buffer.from(bytes).toString("hex");
  }
  return {
    getNetworks,
    getChainIdContract,
    callChainIdContract,
    deployContractOnChains,
    deployMocks,
    computeOriginHash,
    requestSpvProof,
    createTamperedProof,
  };
};
export type DeployContractOnChains = (name: string) => Promise<{
  tokens: {
    contract: BaseContract & {
      deploymentTransaction(): ContractTransactionResponse;
    } & Omit<Contract, keyof BaseContract>;
    address: string;
    chain: number | undefined;
    network: {
      name: string;
    };
  }[];
}>;
