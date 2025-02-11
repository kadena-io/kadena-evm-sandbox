const { ethers, network, switchNetwork } = require("hardhat");

// hash of CrossChainInitialized(uint32,address,uint64,bytes)
const EVENT_SIG_HASH =
  "0x9d2528c24edd576da7816ca2bdaa28765177c54b32fb18e2ca18567fbc2a9550";

async function getSigners() {
  await switchNetwork("kadena_devnet0");
  const [deployer, alice, bob, carol] = await ethers.getSigners();
  return {
    deployer,
    alice,
    bob,
    carol,
  };
}

async function deployContracts() {
  const networks = Object.keys(hre.config.networks).filter((net) =>
    net.includes("kadena_devnet")
  );
  console.log(
    `Found ${networks.length} Kadena devnet networks: ${networks.join(", ")}`
  );

  const deployments = {};
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
      let deploymentTx = contract.deploymentTransaction();
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

async function deployMocks() {
  const networks = Object.keys(hre.config.networks).filter((net) =>
    net.includes("kadena_devnet")
  );
  console.log(
    `Found ${
      networks.length
    } Kadena devnet networks while deploying mocks: ${networks.join(", ")}`
  );
  const deployments = {};
  const tokens = [];
  const signers = await getSigners();

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
      let deploymentTx = contract.deploymentTransaction();
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

function computeOriginHash(origin) {
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

// Authorize contracts for cross-chain transfers to and from the token
async function authorizeContracts(token, tokenInfo, authorizedTokenInfos) {
  await switchNetwork(tokenInfo.network.name);
  for (const tok of authorizedTokenInfos) {
    console.log(
      `Authorizing ${tok.chain}:${tok.address} for ${tokenInfo.chain}:${tokenInfo.address}`
    );
    const tx = await token.setCrossChainAddress(tok.chain, tok.address);
    await tx.wait();
  }
}

/* *************************************************************************** */
/* Initiate Cross-Chain Transfer */

async function initCrossChain(
  sourceToken,
  sourceTokenInfo,
  targetTokenInfo,
  sender,
  receiver,
  amount
) {
  console.log(
    `Initiating cross-chain transfer from ${sourceTokenInfo.network.name} to ${targetTokenInfo.network.name} : ${targetTokenInfo.chain}`
  );
  await switchNetwork(sourceTokenInfo.network.name);
  let response1 = await sourceToken
    .connect(sender)
    .transferCrossChain(receiver.address, amount, targetTokenInfo.chain);
  let receipt1 = await response1.wait();
  console.log(
    `transfer-crosschain status: ${receipt1.status}, at block number ${receipt1.blockNumber} with hash ${receipt1.hash}`
  );

  // Compute origin
  let logIndex = receipt1.logs.findIndex(
    (log) => log.topics[0] == EVENT_SIG_HASH
  );
  console.log(`found log at tx ${receipt1.index} and event ${logIndex}`);
  return {
    chain: BigInt(sourceTokenInfo.chain),
    originContractAddress: sourceTokenInfo.address,
    height: BigInt(receipt1.blockNumber),
    txIdx: BigInt(receipt1.index),
    eventIdx: BigInt(logIndex),
  };
}

/* *************************************************************************** */
/* Off-Chain: SPV Proof Creation */

// Call our chainweb SPV api with the necesasry proof parameters
async function getProof(trgChain, origin) {
  const response = await fetch(
    `http://localhost:1848/chainweb/0.0/evm-development/chain/${trgChain}/spv/chain/${origin.chain}/height/${origin.height}/transaction/${origin.txIdx}/event/${origin.eventIdx}`
  );
  if (!response.ok) {
    throw new Error(`Failed to get SPV proof for ${trgChain} from origin`, origin);
  }
  return response;
}

// Request cross-chain transfer SPV proof
async function requestSpvProof(targetChain, origin) {
  const spvCall = await getProof(targetChain, origin);
  const proof = await spvCall.json();
  const proofStr = JSON.stringify(proof);
  const hexProof = "0x" + Buffer.from(proofStr, "utf8").toString("hex");
  return hexProof;
}

async function createTamperedProof(targetChain, origin) {
  const spvCall = await getProof(targetChain, origin);
  const proofBytes = await spvCall.arrayBuffer();
  let bytes = new Uint8Array(proofBytes);

  // Corrupt middle of proof
  const midPoint = Math.floor(bytes.length / 2);
  bytes[midPoint] = 0xff; // Change single byte to invalid value

  return "0x" + Buffer.from(bytes).toString("hex");
}

// Redeem cross-chain transfer tokens
async function redeemCrossChain(
  targetToken,
  targetTokenInfo,
  receiver,
  amount,
  proof
) {
  await switchNetwork(targetTokenInfo.network.name);
  console.log(`Redeeming tokens on chain ${targetTokenInfo.network.name}`);
  let response2 = await targetToken.redeemCrossChain(
    receiver.address,
    amount,
    proof
  );
  let receipt2 = await response2.wait();
  console.log(
    `result at block height ${receipt2.blockNumber} received with status ${response2.status}`
  );
}

// Make a cross-chain transfer
async function crossChainTransfer(
  sourceToken,
  sourceTokenInfo,
  targetToken,
  targetTokenInfo,
  sender,
  receiver,
  amount
) {
  console.log(
    `Transfering ${amount} tokens from ${sourceTokenInfo.chain}:${sourceTokenInfo.address}:${sender.addresss} to ${targetTokenInfo.chain}:${targetTokenInfo.address}:${receiver.address}`
  );
  const origin = await initCrossChain(
    sourceToken,
    sourceTokenInfo,
    targetTokenInfo,
    sender,
    receiver,
    amount
  );
  const proof = await requestSpvProof(targetTokenInfo.chain, origin);
  await redeemCrossChain(targetToken, targetTokenInfo, receiver, amount, proof);
}

const CrossChainOperation = {
  None: 0,
  Erc20Transfer: 1,
  Erc20TransferFrom: 2,
};

module.exports = {
  getSigners,
  deployContracts,
  authorizeContracts,
  crossChainTransfer,
  initCrossChain,
  requestSpvProof,
  redeemCrossChain,
  computeOriginHash,
  createTamperedProof,
  CrossChainOperation,
  deployMocks,
};

