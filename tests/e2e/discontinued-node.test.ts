import { describe, test, expect, afterAll, beforeAll } from 'bun:test';
import {
  $devnet,
  CONFIG,
  createDockerComposeFile,
  createDockerFileName,
  generateDockerComposeAndStartNetwork,
  getDevnetStatus,
  stopAndRemoveNetwork,
  waitFor,
  waitForMinCutHeight,
} from './devnet-utils';
import { createLogger, waitSeconds } from './utils';
import { fs, $ } from 'zx';
import { restartContainer, stopContainer } from './node-utils';

$.verbose = CONFIG.VERBOSE;

const DOCKER_COMPOSE_FILE = createDockerFileName('default');
const log = createLogger({ context: 'discontinued-node.test.ts' });

describe(`e2e: verify ${DOCKER_COMPOSE_FILE} generation`, () => {
  test(`e2e: generate ${DOCKER_COMPOSE_FILE}`, async () => {
    await createDockerComposeFile('default');
    const fileExists = fs.existsSync(DOCKER_COMPOSE_FILE);
    expect(fileExists).toBe(true);
    expect(async () => {
      console.log('checking docker compose config...');
      return await $devnet`docker compose -f ${DOCKER_COMPOSE_FILE} config`;
    }).not.toThrow();
  });
});

describe('e2e: start network, stop node, restart node', () => {
  beforeAll(() => {
    if (CONFIG.CLEAN_BEFORE) {
      return stopAndRemoveNetwork('default');
    }
  });
  afterAll(() => {
    if (CONFIG.CLEAN_AFTER) {
      //return stopAndRemoveNetwork('kadena-dev');
    }
  });

  test(`e2e: generate ${DOCKER_COMPOSE_FILE}`, async () => {
    await generateDockerComposeAndStartNetwork('default');

    await waitFor(
      ({ chains, cutHeight }) => {
        const evm20 = chains.find((chain) => chain.chainId === 20)!;
        log(`evm-20 height: ${evm20.height}, cut-height: ${cutHeight}`);

        return evm20.height > 0;
      },
      { timeoutSeconds: 300 }
    );

    console.log('stopping bootnode-evm-20...');
    await stopContainer('bootnode-evm-20');
    log('bootnode-evm-20 stopped');

    await waitFor(
      ({ chains, cutHeight }) => {
        const evm20 = chains.find((chain) => chain.chainId === 20)!;

        return chains
          .filter((chain) => chain.chainId !== 20)
          .every((chain) => chain.height > evm20.height);
      },
      { timeoutSeconds: 300 }
    );

    console.log('verifying lowest chain-height is evm-20...');
    const devnetStatus = await getDevnetStatus();

    const evm20 = devnetStatus.chains.find((chain) => chain.chainId === 20);
    if (!evm20) {
      throw new Error('evm-20 not found in devnet status');
    }

    console.log(`expecting lowest height to be evm-20: ${evm20.height}`);
    expect(evm20.height).toBe(1);

    console.log('restarting bootnode-evm-20...');
    await restartContainer('bootnode-evm-20');
    console.log('bootnode-evm-20 started');

    console.log('waiting for cut-height to catch up...');

    expect(
      waitFor(
        ({ chains }) => {
          const evm20 = chains.find((chain) => chain.chainId === 20)!;
          return evm20.height > 1;
        },
        { timeoutSeconds: 60 }
      )
    ).rejects.toThrow();
  });
});
