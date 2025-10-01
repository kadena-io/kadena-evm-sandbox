import { describe, test, expect, afterAll, beforeEach } from 'bun:test';
import {
  CONFIG,
  generateDockerComposeAndStartNetwork,
  getDevnetStatus,
  startNetwork,
  stopAndRemoveNetwork,
  waitFor,
  waitForMinCutHeight,
} from './devnet-utils';
import { stopMiner } from './node-utils';
import { getPublicClient } from './chainUtils';
import { waitSeconds } from './utils';

const miner1 = '0xd42d71cdc2A0a78fE7fBE7236c19925f62C442bA';
const miner2 = '0x38a6BD13CC381c68751BE2cef97BD79EBcb2Bb31';

describe(`e2e: verify miners get rewards`, () => {
  beforeEach(async () => {
    await stopAndRemoveNetwork('kadena-dev');
    await generateDockerComposeAndStartNetwork('kadena-dev');
  });
  afterAll(() => {
    if (CONFIG.CLEAN_AFTER) {
      return stopAndRemoveNetwork('kadena-dev');
    }
  });

  test('should reward a miner for blocks', async () => {
    await stopMiner(1);
    await waitSeconds(15);

    const miner1BalanceStart = await getPublicClient('20').getBalance({
      address: miner1,
    });
    const miner2BalanceStart = await getPublicClient('20').getBalance({
      address: miner2,
    });

    //waiting for some blocks to be mined
    const devnetStatus = await getDevnetStatus();
    await waitForMinCutHeight(devnetStatus.cutHeight + 98 * 1, { timeoutSeconds: 150 });

    const miner1BalanceAfterMining = await getPublicClient('20').getBalance({
      address: miner1,
    });
    const miner2BalanceAfterMining = await getPublicClient('20').getBalance({
      address: miner2,
    });

    expect(miner1BalanceAfterMining).toBe(miner1BalanceStart); //miner 1 should not have changed
    expect(miner2BalanceAfterMining).toBeGreaterThan(miner2BalanceStart); //miner 2 should have increased
  });
});
