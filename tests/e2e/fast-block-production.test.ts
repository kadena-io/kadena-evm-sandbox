import { describe, test, expect, afterAll, beforeAll, it } from 'bun:test';
import {
  $devnet,
  CONFIG,
  createDockerComposeFile,
  generateDockerComposeAndStartNetwork,
  getDevnetStatus,
  stopAndRemoveNetwork,
  waitFor,
  waitForMinCutHeight,
} from './devnet-utils';
import { DOCKER_COMPOSE_FILE } from './devnet-utils';
import { createLogger } from './utils';
import { fs, $ } from 'zx';

$.verbose = CONFIG.VERBOSE;

const log = createLogger({ context: 'fast-block-production.test.ts' });

describe(`e2e: verify fast block production for reth`, () => {
  beforeAll(() => {
    // if (CONFIG.CLEAN_BEFORE) {
    //   return stopAndRemoveNetwork();
    // }
  });
  afterAll(() => {
    if (CONFIG.CLEAN_AFTER) {
      return stopAndRemoveNetwork();
    }
  });

  test(`e2e: produces 1 block a second or faster`, async () => {
    await generateDockerComposeAndStartNetwork();

    console.log('waiting for cut-height to reach 98*4...');
    await waitForMinCutHeight(98 * 4, { timeoutSeconds: 150});

    const devnetStatus = await getDevnetStatus();
    expect(devnetStatus.cutHeight).toBeGreaterThan(98 * 4);
    const currentHeight = devnetStatus.cutHeight;
    const currentTime = Date.now();

    // wait for a single height = 98 blocks
    await waitForMinCutHeight(currentHeight + 98 * 1, { timeoutSeconds: 100 });

    const newDevnetStatus = await getDevnetStatus();
    expect(newDevnetStatus.cutHeight).toBeGreaterThan(currentHeight + 98 * 1);
    const newTime = Date.now();

    const timePerBlock = (newTime - currentTime) / 98;
    console.log(`produced 98 blocks in ${newTime - currentTime} ms`);
    expect(timePerBlock).toBeLessThanOrEqual(1000);
  });
});
