const { chainweb, ethers } = require('hardhat');

const { requestSpvProof, switchChain, deployContractOnChains } = chainweb;

// hash of CrossChainInitialized(uint32,address,uint64,bytes)
const EVENT_SIG_HASH =
  '0x9d2528c24edd576da7816ca2bdaa28765177c54b32fb18e2ca18567fbc2a9550';

// Authorize contracts for cross-chain transfers to and from the token
async function authorizeContracts(token, tokenInfo, authorizedTokenInfos) {
  await switchChain(tokenInfo.chain);
  for (const tok of authorizedTokenInfos) {
    console.log(
      `Authorizing ${tok.chain}:${tok.address} for ${tokenInfo.chain}:${tokenInfo.address}`,
    );
    const tx = await token.setCrossChainAddress(tok.chain, tok.address);
    await tx.wait();
  }
}

function deployMocks() {
  console.log(`Found Kadena devnet networks while deploying mocks`);
  return deployContractOnChains({
    name: 'WrongOperationTypeToken',
    constructorArgs: [ethers.parseUnits('1000000')],
  });
}

/* *************************************************************************** */
/* Initiate Cross-Chain Transfer */

async function initCrossChain(
  sourceToken,
  sourceTokenInfo,
  targetTokenInfo,
  sender,
  receiver,
  amount,
) {
  console.log(
    `Initiating cross-chain transfer from ${sourceTokenInfo.network.name} to ${targetTokenInfo.network.name}`,
  );

  await switchChain(sourceTokenInfo.chain);
  let response1 = await sourceToken
    .connect(sender)
    .transferCrossChain(receiver.address, amount, targetTokenInfo.chain);
  let receipt1 = await response1.wait();
  console.log(
    `transfer-crosschain status: ${receipt1.status}, at block number ${receipt1.blockNumber} with hash ${receipt1.hash}`,
  );

  // Compute origin
  let logIndex = receipt1.logs.findIndex(
    (log) => log.topics[0] == EVENT_SIG_HASH,
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

/*
// Call our chainweb SPV api with the necesasry proof parameters
async function getProof(trgChain, origin) {
  console.log("Inside getProof in utils.js");
  console.log("trgChain:", trgChain);
  console.log("origin:", origin);

  return fetch(
    `http://localhost:1848/chainweb/0.0/evm-development/chain/${trgChain}/spv/chain/${origin.chain}/height/${origin.height}/transaction/${origin.txIdx}/event/${origin.eventIdx}`
   
  );
}

// Request cross-chain transfer SPV proof
async function requestSpvProof(targetChain, origin) {
  console.log("Inside requestSpvProof in utils.js");
  console.log("targetChain:", targetChain);
  console.log("origin:", origin);
  const spvCall = await getProof(targetChain, origin);
  console.log("spvCall:", spvCall);
  const proof = await spvCall.json();
  const proofStr = JSON.stringify(proof);
  const hexProof = "0x" + Buffer.from(proofStr, "utf8").toString("hex");
  return hexProof;
}
  */

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
  proof,
) {

  await switchChain(targetTokenInfo.chain);
  console.log(`Redeeming tokens on chain ${targetTokenInfo.network.name}`);
  let response2 = await targetToken.redeemCrossChain(
    receiver.address,
    amount,
    proof,
  );
  let receipt2 = await response2.wait();
  console.log(
    `result at block height ${receipt2.blockNumber} received with status ${response2.status}`,
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
  amount,
) {
  console.log(
    `Transfering ${amount} tokens from ${sourceTokenInfo.chain}:${sourceTokenInfo.address}:${sender.address} to ${targetTokenInfo.chain}:${targetTokenInfo.address}:${receiver.address}`
  );
  const origin = await initCrossChain(
    sourceToken,
    sourceTokenInfo,
    targetTokenInfo,
    sender,
    receiver,
    amount,
  );
  const proof = await requestSpvProof(targetTokenInfo.chain, origin);
  await redeemCrossChain(targetToken, targetTokenInfo, receiver, amount, proof);
}

const CrossChainOperation = {
  None: 0,
  Erc20Transfer: 1,
  Erc20TransferFrom: 2,
};

async function getSigners(chainId) {
  await chainweb.switchChain(chainId);

  const [deployer, alice, bob, carol] = await ethers.getSigners();
  return {
    deployer,
    alice,
    bob,
    carol,
  };
}

module.exports = {
  authorizeContracts,
  crossChainTransfer,
  initCrossChain,
  redeemCrossChain,
  CrossChainOperation,
  getSigners,
  deployMocks,
  requestSpvProof
};