import { describe, test, expect, afterAll, beforeAll } from 'bun:test';
import {
  CONFIG,
  generateDockerComposeAndStartNetwork,
  getDevnetStatus,
  restartContainer,
  stopAndRemoveNetwork,
  stopContainer,
  waitForMinCutHeight,
  type DevnetChainStatus,
  type DevnetStatus,
} from './devnet-utils';

const getChainStatus = (chainId: number, status: DevnetStatus): DevnetChainStatus => {
  return status.chains.find((c) => c.chainId === chainId)!;
};

describe.only(`e2e: sync nodes`, () => {
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

  test('should have node2 catchup with node1 after it went down', async () => {
    await generateDockerComposeAndStartNetwork();

    const devnetStatus = await getDevnetStatus();
    const currentHeight = devnetStatus.cutHeight;
    const chain21 = getChainStatus(21, devnetStatus);
    console.log(`evm-21 height: ${chain21.height}`);

    await stopContainer('bootnode-evm-21');
    console.log('stopped bootnode-evm-21');

    // wait for a 2 height (just to be sure that  all are upadted)
    await waitForMinCutHeight(currentHeight + 98 * 2, { timeoutSeconds: 100 });
    const newDevnetStatus = await getDevnetStatus();
    const newChain21 = getChainStatus(21, newDevnetStatus);
    const newCurrentHeight = newDevnetStatus.cutHeight;

    expect(newChain21.height).toBe(chain21.height);

    // wait for a 2 height (just to be sure that  all are upadted)
    await restartContainer('bootnode-evm-21');
    console.log('restarted bootnode-evm-21');
    await waitForMinCutHeight(newCurrentHeight + 98 * 3, { timeoutSeconds: 100 });
    const newDevnetStatus2 = await getDevnetStatus();
    const newChain21_2 = getChainStatus(21, newDevnetStatus2);

    console.log(`evm-21 height: ${newChain21_2.height}`);
    expect(newChain21_2.height).toBeGreaterThan(newChain21.height);
  });
});
