import hre from "hardhat";
import "./type";
import { ethers, network, switchNetwork } from "hardhat";
import { CHAIN_ID_ABI, CHAIN_ID_ADDRESS } from "./utils/network-contracts.js";

interface Origin {
  chain: bigint;
  originContractAddress: string;
  height: bigint;
  txIdx: bigint;
  eventIdx: bigint;
}

const NETWORK_STEM = process.env.NETWORK_STEM || "kadena_hardhat";

export function getNetworks() {
  return Object.keys(hre.config.networks).filter((net) =>
    net.includes(NETWORK_STEM)
  );
}

function usesHardhatNetwork() {
  return NETWORK_STEM == "kadena_hardhat";
}

export function withChainweb() {
  if (usesHardhatNetwork()) {
    before(async function () {
      await hre.chainweb.startHardhatNetwork();
    });

    after(async function () {
      await hre.chainweb.stopHardhatNetwork();
    });
  }
}

export function getChainIdContract() {
  return new ethers.Contract(CHAIN_ID_ADDRESS, CHAIN_ID_ABI, ethers.provider);
}

export async function callChainIdContract() {
  const hex = await ethers.provider.send("eth_call", [
    { to: CHAIN_ID_ADDRESS },
    "latest",
    {},
  ]);
  return parseInt(hex, 16);
}

export async function getSigners() {
  await switchNetwork(`${NETWORK_STEM}0`);
  const [deployer, alice, bob, carol] = await ethers.getSigners();
  return {
    deployer,
    alice,
    bob,
    carol,
  };
}

export async function deployContracts() {
  const networks = getNetworks();
  console.log(
    `Found ${networks.length} Kadena devnet networks: ${networks.join(", ")}`
  );

  // const deployments = {};
  const tokens = []; // Array for individual token access

  for (const netname of networks) {
    try {
      await switchNetwork(netname);
      const cid = network.config.chainwebChainId;
      const [deployer] = await ethers.getSigners();
      console.log(
        `Deploying with signer: ${deployer.address} on network ${netname}`
      );

      /* Deploy the SimpleToken contract */
      const factory = await ethers.getContractFactory("SimpleToken");
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
          name: netname,
        },
      };

      tokens.push(deploymentInfo);
    } catch (error) {
      console.error(`Failed to deploy to network ${netname}:`, error);
    }
  }

  // Return both formats
  return {
    tokens, // Access like: deployments.tokens[0]
  };
}

export async function deployMocks() {
  const networks = getNetworks();
  console.log(
    `Found ${networks.length} Kadena devnet networks while deploying mocks: ${networks.join(", ")}`
  );
  // const deployments = {};
  const tokens = [];
  // const signers = await getSigners();

  for (const netname of networks) {
    try {
      await switchNetwork(netname);
      const cid = network.config.chainwebChainId;
      const [deployer] = await ethers.getSigners();
      console.log(
        `Deploying with signer: ${deployer.address} on network ${netname}`
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
          name: netname,
        },
      };

      tokens.push(deploymentInfo);
    } catch (error) {
      console.error(`Failed to deploy to network ${netname}:`, error);
    }
  }

  return {
    tokens,
  };
}

export function computeOriginHash(origin: Origin) {
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
export async function requestSpvProof(targetChain: number, origin: Origin) {
  if (usesHardhatNetwork()) {
    const hexProof = await hre.chainweb.chainwebNetwork.getSpvProof(
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

export async function createTamperedProof(targetChain: number, origin: Origin) {
  const spvCall = await getProof(targetChain, origin);
  const proofBytes = await spvCall.arrayBuffer();
  const bytes = new Uint8Array(proofBytes);

  // Corrupt middle of proof
  const midPoint = Math.floor(bytes.length / 2);
  bytes[midPoint] = 0xff; // Change single byte to invalid value

  return "0x" + Buffer.from(bytes).toString("hex");
}
