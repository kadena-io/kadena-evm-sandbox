/* *************************************************************************** */
/* Chain */

import AsyncLock from "async-lock";
import { getProvider, isValidProvider } from "./ethers-helpers.js";
import {
  CHAIN_ID_ADDRESS,
  CHAIN_ID_BYTE_CODE,
  VERIFY_ADDRESS,
  VERIFY_BYTE_CODE,
} from "./network-contracts.js";
import { KadenaNetworkConfig } from "hardhat/types";
import {
  COLOR_PALETTE,
  logError,
  Logger,
  logInfo,
  streamLogger,
} from "./logger.js";
import { JsonRpcProvider } from "ethers";
import { sleep } from "./sleep.js";
import { spawn } from "child_process";

const lock = new AsyncLock();

export class Chain {
  private config: KadenaNetworkConfig;
  private logger: Logger;
  private _adjacents: null | Chain[];
  private process: null | { kill: () => void };
  private _provider: null | JsonRpcProvider;
  private autominer: null | NodeJS.Timeout;

  public get provider(): JsonRpcProvider {
    if (!isValidProvider(this._provider)) {
      throw new Error("Provider is not initialized");
    }
    return this._provider;
  }

  public set adjacents(adjacents: Chain[]) {
    this._adjacents = adjacents;
  }

  public get adjacents(): Chain[] {
    if (this._adjacents === null) {
      throw new Error("Chain is not part of a network");
    }
    return this._adjacents;
  }

  constructor(config: KadenaNetworkConfig) {
    const cid = config.chainwebChainId;
    this.config = config;

    this.logger = {
      info: (msg) => logInfo(COLOR_PALETTE[cid % 6], cid, msg),
      error: (msg) => logError(COLOR_PALETTE[cid % 6], cid, msg),
    };

    // set when the chain is added to the chainweb
    this._adjacents = null;

    // set when the hardhat network process is started
    this.process = null;

    // set when the ethers provider is created
    this._provider = null;

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
    if (this.provider === null) {
      throw new Error("Provider is not initialized");
    }
    return await this.provider.send("evm_mine", []);
  }

  async mineRequest() {
    await lock.acquire("mine", async () => {
      this.logger.info(`mining requested`);
      await this.mine();
    });
  }

  async mine() {
    if (this.adjacents === null) {
      throw new Error("Chain is not part of a network");
    }
    const cn = await this.getBlockNumber();
    this.logger.info(`current height is ${cn}`);
    for (const a of this.adjacents) {
      const an = await a.getBlockNumber();
      if (an < cn) {
        await a.mine();
      }
    }
    this.logger.info(`make new block`);
    await this.makeBlock();
  }

  async hasPending() {
    const ps = await this.provider.send(
      "eth_getBlockTransactionCountByNumber",
      ["pending"]
    );
    return ps > 0;
  }

  async runPending() {
    const pending = await this.hasPending();
    if (pending) {
      await this.mineRequest();
    }
  }

  async initializeCidContract() {
    await this.provider.send("hardhat_setCode", [
      CHAIN_ID_ADDRESS,
      CHAIN_ID_BYTE_CODE,
    ]);
    const hex = "0x" + this.cid.toString(16).padStart(64, "0");
    await this.provider.send("hardhat_setStorageAt", [
      CHAIN_ID_ADDRESS,
      "0x0",
      hex,
    ]);
  }

  async initializeVerificationPrecompile() {
    await this.provider.send("hardhat_setCode", [
      VERIFY_ADDRESS,
      VERIFY_BYTE_CODE,
    ]);
  }

  async enableAutomine() {
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
      this.process = await runHardhatNetwork(this.port, this.logger);
      this.logger.info(`started network at port ${this.port}`);
    }
  }

  async stopHardhatNetwork() {
    this.logger.info("stopping hardhat network");
    if (this.process) {
      await this.process.kill();
      this.logger.info("stopped hardhat network");
      this.process = null;
    } else {
      this.logger.error("no hardhat network process found");
    }
  }

  async start() {
    // start hardhat network
    await this.startHardhatNetwork();

    // create provider
    this._provider = await getProvider(this.url);

    // initialize system contracts
    await this.initializeCidContract();
    await this.initializeVerificationPrecompile();

    // setup automining
    await this.provider.send("evm_setAutomine", [false]);
    await this.enableAutomine();
  }

  async stop() {
    this.disableAutomine();
    this._provider = null;
    this.stopHardhatNetwork();
  }
}

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
/* Run Hardhat Network */

async function runHardhatNetwork(port: number, logger: Logger) {
  const child = spawn("npx", ["hardhat", "node", "--port", port.toString()], {
    detached: false, // FIXME not sure why this does not work as it should ...
  });

  let isClosed = false;
  const kill = (signal?: NodeJS.Signals | number) => {
    if (!isClosed) {
      isClosed = child.kill(signal);
    }
  };

  const stdoutBuffer = streamLogger(child.stdout, logger.info);
  const stderrBuffer = streamLogger(child.stderr, logger.error);

  child.on("close", (exitCode) => {
    isClosed = true;
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

  await new Promise((resolve) => {
    child.on("spawn", resolve);
  });

  // kill child on exit
  process.on("exit", () => kill(0));
  process.on("SIGINT", () => kill("SIGINT"));
  process.on("uncaughtException", () => kill("SIGABRT"));

  // FIXME wait for proper messages and return an event if this triggered
  // actually, we may just block runHardHatNetwork until it's ready...
  logger.info(`wait 2 second for hardhat network to start`);
  await sleep(2000);
  return { kill, pid: child.pid };
}
