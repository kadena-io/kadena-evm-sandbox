import pkg from 'hardhat';
const { ethers } = pkg;

import { styleText } from 'node:util';
import AsyncLock from 'async-lock';
import { spawn } from 'child_process';

/* *************************************************************************** */
/* TODO */

// * support graphs that include non-evm chains (by just skipping over them)
// * Consider deploying the spv precompile at an hash address that won't colide
//   with future Ethereum extensions.
// * Use mocha root hooks to manage hardhat network
// * move all of this into a hardhat-plugin
// * Make logging verbosity configurable
// * Manage hardhat ports internally

/* *************************************************************************** */
/* Network Constants */

export const CHAIN_ID_BYTE_CODE = "0x5f545f526004601cf3"
export const CHAIN_ID_ADDRESS = ethers.dataSlice(ethers.id("/Chainweb/Chain/Id/"), 12);
export const CHAIN_ID_ABI = ['function chainwebChainId() view returns (uint32)'];

// FIXME this address is at risk of conflicting with future Ethereum upgrades
// Instead uses something like address(keccak256("/Chainweb/KIP-34/VERIFY/SVP/"))
export const VERIFY_ADDRESS = "0x0000000000000000000000000000000000000421";
export const VERIFY_BYTE_CODE = "0x60203610601f5736601f1901806020608037806080205f3503601f576080f35b5f80fd"
export const VERIFY_ABI = ['function verify(bytes memory proof) public pure returns (bytes memory data)']

/* *************************************************************************** */
/* Logging */

// TODO: should we use a logging library like winston or pino or would that make
// this code to opinionated?

function logInfo(color, label, msg) {
  console.log(styleText(color, `[hardhat ${label}]`), msg);
}

function logError(color, label, msg) {
  console.error(styleText(color, `[hardhat ${label}]`), msg);
}

/* *************************************************************************** */
/* Utils */

function sleep(ms, logFun = console.log) {
  return new Promise((resolve) => {
    logFun(`Sleeping for ${ms} milliseconds`);
    setTimeout(resolve, ms);
  });
}

function wordToAddress(hexbytes) {
  return ethers.getAddress(ethers.dataSlice(hexbytes,12))
}

/* *************************************************************************** */
/* Ethers Provider */

function getProvider(rpcUrl) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  provider.pollingInterval = 100;
  return provider;

  // would be nice to use this to subscribe to pending txs. But that seems to be
  // not reliable.
  // return new ethers.providers.WebSocketProvider(rpcUrl);
}

/* *************************************************************************** */
/* Run Hardhat Network */

function streamLogger(stream, logFun) {
  let buffer = "";
  stream.on('data', (data) => {
    const parts = (buffer + data).split(/\r?\n/);
    for (const line of parts.slice(0,-1)) {
        logFun(line);
    }
    buffer = parts.slice(-1).join()
  });
  return buffer;
}

async function runHardhatNetwork(port, logger) {
    const child = spawn('npx', ['hardhat', 'node', '--port', port],{
      detached: false, // FIXME not sure why this does not work as it should ...
    });

    const stdoutBuffer = streamLogger(child.stdout, logger.info);
    const stderrBuffer = streamLogger(child.stderr, logger.error);

    child.on('close', (exitCode) => {
      if (stdoutBuffer.length > 0) {
        logger.info(stdoutBuffer);
      }
      if (stderrBuffer.length > 0) {
        logger.error(stderrBuffer);
      }
      if (exitCode === null) {
        logger.info(`terminated with code ${exitCode}`);
      } else if (exitCode != 0) {
        logger.error(`failed with code ${exitCode}`);
        throw new Error(`hardhat ${port} failed with code ${exitCode}`);
      }
    });

    await new Promise((resolve, reject) => {
      child.on('spawn', resolve);
    });

    // FIXME wait for proper messages and return an event if this triggered
    // actually, we may just block runHardHatNetwork until it's ready...
    await sleep(2000, logger.info);
    return child;
}

/* *************************************************************************** */
/* Chain */

const CHAIN_COLORS = ['cyan', 'yellow', 'magenta', 'blue', 'green', 'red'];

const lock = new AsyncLock();

class Chain {

  constructor(config) {
    const cid = config.chainwebChainId;
    this.config = config;

    this.logger = {
      info: (msg) => logInfo(CHAIN_COLORS[cid], cid, msg),
      error: (msg) => logError(CHAIN_COLORS[cid], cid, msg),
    };

    // set when the chain is added to the chainweb
    this.adjacents = null;

    // set when the hardhat network process is started
    this.process = null;

    // set when the ethers provider is created
    this.provider = null;

    // set when automining is enabled
    this.autominer = null;
  }

  get cid() {
    return this.config.chainwebChainId;
  }

  get url() {
    return this.config.url;
  }

  get port() {
    const url = new URL(this.url);
    return url.port ? parseInt(url.port, 10) : 8454;
  }

  async getBlockNumber() {
    // this.provider.getBlockNumber() is lagging. Maybe it caches internally or
    // there's a race in the implementation?
    // return await this.provider.getBlockNumber()
    return parseInt(await this.provider.send("eth_blockNumber", []), 16);
  }

  async makeBlock() {
    return await this.provider.send("evm_mine", []);
  }

  async mine () {
    await lock.acquire('mine', async () => {
        this.logger.info(`mining requested`);
        await this.#mine();
    });
  }

  async #mine () {
    const cn = await this.getBlockNumber();
    this.logger.info(`current height is ${cn}`);
    for (const a of this.adjacents) {
      const an = await a.getBlockNumber();
      if (an < cn) {
          await a.#mine();
      }
    }
    this.logger.info(`make new block`);
    const resp = await this.makeBlock();
  }

  async hasPending () {
    const ps = await this.provider.send(
      "eth_getBlockTransactionCountByNumber",
      ["pending"]
    );
    return ps > 0;
  }

  async runPending () {
    const pending = await this.hasPending()
    if (pending) {
        await this.mine();
    }
  }

  async initializeCidContract () {
    await this.provider.send(
      "hardhat_setCode",
      [CHAIN_ID_ADDRESS, CHAIN_ID_BYTE_CODE]
    );
    const hex = "0x" + this.cid.toString(16).padStart(64, '0');
    await this.provider.send(
      "hardhat_setStorageAt",
      [CHAIN_ID_ADDRESS, "0x0", hex]
    );
  }

  async initializeVerificationPrecompile() {
    await this.provider.send(
      "hardhat_setCode",
      [VERIFY_ADDRESS, VERIFY_BYTE_CODE]
    );
  }

  async enableAutomine () {
    if (!this.autominer) {
      this.autominer = setInterval(() => this.runPending(), 100);
      this.logger.info(`Automine enabled`);
    }
  }

  async disableAutomine() {
    if (this.autominer) {
      clearInterval(this.autominer);
      this.autominer = null;
      this.logger.info(`Automine disabled`);
    }
  }

  async startHardhatNetwork() {
    if (this.process) {
      this.logger.error("Hardhat network is already running");
    } else {
      this.logger.info(`starting chain network at port ${this.port}`);
      this.process = await runHardhatNetwork(this.port, this.logger)
      this.logger.info(`started network at port ${this.port}`);
    }
  }

  async stopHardhatNetwork () {
    this.logger.info("stopping hardhat network");
    if (this.process) {
      await this.process.kill();
      this.logger.info("stopped hardhat network");
      this.process = null;
    } else {
      this.logger.error("no hardhat network process found");
    }
  }

  async start () {
    // start hardhat network
    await this.startHardhatNetwork();

    // create provider
    this.provider = await getProvider(this.url);

    // initialize system contracts
    await this.initializeCidContract();
    await this.initializeVerificationPrecompile();

    // setup automining
    await this.provider.send("evm_setAutomine", [false]);
    await this.enableAutomine()
  }

  async stop () {
    this.disableAutomine();
    this.provider = null;
    this.stopHardhatNetwork();
  }
}

/* *************************************************************************** */
/* Compute Chain Distances */

// Compute shortest path via breadth first search. For small, connected,
// degree-diameter graphs this has acceptable performance. (well, it's bad, but
// not terribly bad)
//
function distance(srcChain, trgChain) {
  if (srcChain.cid == trgChain.cid) {
    return 0;
  }
  const visited = [srcChain.cid];
  const queue = [[srcChain, 0]];

  while (queue.length > 0) {
    const [cur,d] = queue.shift();
    for (const adj of srcChain.adjacents) {
      if (adj.cid == trgChain.cid) {
        return d + 1;
      }
      if (! visited.includes(i.cid)) {
        visited.push(i.cid);
        queue.push([i, d+1]);
      }
    }
  }
}

/* *************************************************************************** */
/* Chainweb Network */

function makeChainweb(logger) {

  const graph = hre.config.chainweb.graph;
  const networks = hre.config.networks;

  // Create Indiviual Chains
  logger.info("creating chains");
  const chains = {};
  for (const k in networks) {
    if (k.includes('kadena_hardhat')) {
      const config = networks[k];
      chains[config.chainwebChainId] = new Chain(config);
    }
  }

  // Put Chains into the Chainweb Graph
  logger.info("integrating chains into Chainweb");
  for (const c in chains) {
    chains[c].adjacents = graph[c].map(x => {
      const a = chains[x];
      if (a === undefined) {
        throw new Error(`Missing configuration for chain ${x}`);
      }
      return chains[x]
    });
  }
  return chains;
}

class Network {
  constructor() {
    this.logger = {
      info: (msg) => logInfo('reset', '-', msg),
      error: (msg) => logError('reset', '-', msg),
    };
    this.chains = makeChainweb(this.logger);
  }

  getProvider(cid) {
    const chain = this.chains[cid];
    if (chain === undefined) {
      throw new Error("Chain not found in Chainweb", cid);
    }
    const provider = chain.provider;
    if (provider === null) {
      throw new Error("Chain network is not running", cid);
    }
    return provider;
  }

  async start () {
    try {
      this.logger.info("Starting chain networks");
      await Promise.all(
        Object.values(this.chains).map((chain) => {
            return chain.start()
        })
      );
      this.logger.info("Chainweb chains initialized");
    } catch (e) {
      this.logger.error(`Failure while starting networks: ${e}, ${e.stack}`);
      await this.stop ();
    }
  }

  async stop () {
    this.logger.info("Stopping chain networks");
    await Promise.all(
      Object.values(this.chains).map((chain) => chain.stop())
    );
    this.logger.info("Stopped chain networks");
  }
}

/* *************************************************************************** */
/* Network Interface */

const network = new Network();
let userCount = 0;

export async function startHardhatNetwork () {
  userCount += 1;
  if (userCount == 1) {
    await network.start();
  }
}

export async function stopHardhatNetwork () {
  userCount -= 1;
  if (userCount == 0) {
    const r = await network.stop();
    return r;
  }
}

/* *************************************************************************** */
/* SPV */

// Mock getProof:
//
// Call our chainweb SPV api with the necesasry proof parameters.
//
// This mocks the call of the follwing API:
//
// http://localhost:1848/chainweb/0.0/evm-development/chain/${trgChain}/spv/chain/${origin.chain}/height/${origin.height}/transaction/${origin.txIdx}/event/${origin.eventIdx}
//
export async function getSpvProof(trgChain, origin) {

  // get origin chain
  const provider = network.getProvider(origin.chain);

  // Query Event information from origin chain
  const blockLogs = await provider.getLogs({
    fromBlock: origin.height,
    toBlock: origin.height,
  });

  const txLogs = blockLogs.filter((l) => l.transactionIndex == origin.txIdx);
  const log = txLogs[origin.eventIdx];
  if (log === undefined || log.removed) {
    throw new Error("No log entry found at origin", origin);
  }

  const topics = log.topics;

  if (topics.length != 4) {
    throw new Error(`Expected exactly four topics at origin, but got ${topcis.length}`, origin);
  }

  // for target chain to advance enough blocks such that the origin information
  // is available.
  //
  // TODO should fail at least once so that the caller has to wait?
  //
  const src = network.chains[origin.chain];
  const trg = network.chains[trgChain];
  const dist = BigInt(distance(src, trg));
  let trgHeight = BigInt(await trg.getBlockNumber())
  while (trgHeight < origin.height + dist) {
    console.log(`waiting for SPV proof to become available on chain ${trgChain}; current height ${trgHeight}; required height ${origin.height + dist}`);
    await trg.mine();
    sleep(100);
    trgHeight = BigInt(await trg.getBlockNumber());
    }

  const coder = ethers.AbiCoder.defaultAbiCoder();

  // FIXME: double check the event signature

  // (uint32,address,uint64,uint64,uint64)
  const xorigin = Object.values({
    chainId: origin.chain,
    address: log.address,
    height: origin.height,
    txIdx: origin.txIdx,
    eventIdx: origin.eventIdx,
  });

  // (uint32,address,uint64,(uint32,address,uint64,uint64,uint64))
  const xmsg = Object.values ({
    trgChainId: ethers.toNumber(topics[1]),
    trgAddress: wordToAddress(topics[2]),
    opType: ethers.toNumber(topics[3]),
    data: coder.decode(['bytes'], log.data)[0],
    origin: xorigin,
  });

  const params = 'tuple(uint32,address,uint64,bytes,tuple(uint32,address,uint64,uint64,uint64))'
  const payload = coder.encode([params], [xmsg]);
  const hash = ethers.keccak256(payload)
  return ethers.concat([hash, payload])
}

