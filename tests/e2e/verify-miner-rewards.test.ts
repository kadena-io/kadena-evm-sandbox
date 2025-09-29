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

describe(`e2e: verify miners get rewards`, () => {
  beforeEach(async () => {
    await stopAndRemoveNetwork('kadena-dev');
    await generateDockerComposeAndStartNetwork('kadena-dev');
  });
  afterAll(() => {
    if (CONFIG.CLEAN_AFTER) {
      // return stopAndRemoveNetwork('kadena-dev');
    }
  });

  test('should reward a miner for blocks', async () => {
    await stopMiner(1);
    await waitSeconds(15);
    console.log(
      'start',
      await getPublicClient('20').getBalance({
        address: '0xda1380825f827C6Ea92DFB547EF0a341Cbe21d77',
      })
    );

    //await stopMiner(2); //also tried with miner 2
    //console.log('miner stopped');
    const devnetStatus2 = await getDevnetStatus();
    await waitForMinCutHeight(devnetStatus2.cutHeight + 98 * 1, { timeoutSeconds: 150 });

    console.log(
      'test 1',
      devnetStatus2.cutHeight,
      await getPublicClient('20').getBalance({
        address: '0xda1380825f827C6Ea92DFB547EF0a341Cbe21d77',
      })
    );

    const devnetStatus = await getDevnetStatus();
    await waitForMinCutHeight(devnetStatus.cutHeight + 98 * 1, { timeoutSeconds: 150 });
    console.log(
      'finish',
      devnetStatus.cutHeight,
      await getPublicClient('20').getBalance({
        address: '0xda1380825f827C6Ea92DFB547EF0a341Cbe21d77',
      })
    );
  });
});
