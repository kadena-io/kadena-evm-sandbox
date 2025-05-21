import { describe, test, expect, afterAll, beforeAll, it } from 'bun:test';
import {
  $devnet,
  CONFIG,
  createDockerComposeFile,
  generateDockerComposeAndStartNetwork,
  getDevnetStatus,
  stopAndRemoveNetwork,
  waitForCutHeight,
} from './devnet-utils';
import { DOCKER_COMPOSE_FILE } from './devnet-utils';

import { fs, $ } from 'zx';
$.verbose = CONFIG.VERBOSE;

describe(`verify ${DOCKER_COMPOSE_FILE} generation`, () => {
  it(`generate ${DOCKER_COMPOSE_FILE}`, async () => {
    await createDockerComposeFile();
    const fileExists = fs.existsSync(DOCKER_COMPOSE_FILE);
    expect(fileExists).toBe(true);
    expect(async () => {
      console.log('checking docker compose config...');
      return await $devnet`docker compose -f ${DOCKER_COMPOSE_FILE} config`;
    }).not.toThrow();
  });
});

describe('start network, stop node, restart node', () => {
  beforeAll(() => {
    if (CONFIG.CLEAN_BEFORE) {
      return stopAndRemoveNetwork();
    }
  });
  afterAll(() => {
    if (CONFIG.CLEAN_AFTER) {
      return stopAndRemoveNetwork();
    }
  });

  test(`generate ${DOCKER_COMPOSE_FILE}`, async () => {
    await generateDockerComposeAndStartNetwork();

    await waitForCutHeight(98);

    console.log('stopping bootnode-evm-20...');
    await $devnet`docker compose -f ${DOCKER_COMPOSE_FILE} stop bootnode-evm-20`;
    console.log('bootnode-evm-20 stopped');

    console.log('verifying lowest chain-height is evm-20...');
    const devnetStatus = await getDevnetStatus();

    const evm20 = devnetStatus.find((chain) => chain.chainId === 20);
    if (!evm20) {
      throw new Error('evm-20 not found in devnet status');
    }
    const lowestHeight = devnetStatus.sort((a, b) => a.height - b.height)[0];

    console.log(`expecting lowest height to be evm-20: ${evm20.height}`);
    expect(lowestHeight).toEqual(evm20);

    console.log('restarting bootnode-evm-20...');
    await $devnet`docker compose -f ${DOCKER_COMPOSE_FILE} start bootnode-evm-20`;
    console.log('bootnode-evm-20 started');

    console.log('waiting for cut-height to catch up...');
    try {
      await waitForCutHeight(
        devnetStatus.reduce((acc, chain) => acc + chain.height, 0) + 10
      );
    } catch (e) {
      console.log('cut-height not increasing');
      const newEvm20 = (await getDevnetStatus()).find(
        (chain) => chain.chainId === 20
      )!;
      if (newEvm20.height === evm20.height) {
        expect(
          newEvm20.height,
          `cut-height not increasing. chainId: ${evm20.chainId}, old height: ${evm20.height}, new height: ${newEvm20.height}`
        ).not.toEqual(evm20.height);
      }
    }
  });
});
