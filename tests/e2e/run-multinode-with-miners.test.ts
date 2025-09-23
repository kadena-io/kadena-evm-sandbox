import { describe, test, expect, afterAll, beforeEach } from 'bun:test';
import {
  CONFIG,
  docker,
  generateDockerComposeAndStartNetwork,
  getDevnetStatus,
  stopAndRemoveNetwork,
  waitForMinCutHeight,
} from './devnet-utils';
import { checkContainerIsRunning, restartMiner, stopContainer, stopMiner } from './node-utils';
import { waitSeconds } from './utils';

describe(`e2e: multinode config with miners`, () => {
  beforeEach(async () => {
    await stopAndRemoveNetwork('kadena-dev');
    await generateDockerComposeAndStartNetwork('kadena-dev');
  });
  afterAll(() => {
    if (CONFIG.CLEAN_AFTER) {
      return stopAndRemoveNetwork('kadena-dev');
    }
  });

  test('should have 2 chains and miners running', async () => {
    const container = docker.getContainer('miner-1-mining-client');
    const data = await container.inspect();

    expect(await checkContainerIsRunning('miner-1-consensus')).toBe(true);
    expect(await checkContainerIsRunning('miner-1-mining-client')).toBe(true);
    expect(await checkContainerIsRunning('miner-2-consensus')).toBe(true);
    expect(await checkContainerIsRunning('miner-2-mining-client')).toBe(true);
  });

  test('should not update the cutHeight, when both miners are down', async () => {
    await stopContainer('miner-1-mining-client');
    await stopContainer('miner-2-mining-client');

    const devnetStatus = await getDevnetStatus();
    const currentHeight = devnetStatus.cutHeight;

    await waitSeconds(30);

    const newDevnetStatus = await getDevnetStatus();

    expect(newDevnetStatus.cutHeight).toBe(currentHeight);
  });

  test('nodes should sync when 1 of the nodes is down', async () => {
    const MAX_CUTHEIGHT_DIFF = 50;
    // shutting only 1 miner down, the other stays up

    // get the current status
    const devnetStatus = await getDevnetStatus();
    const miner1Status = await getDevnetStatus('miner-1-consensus');

    const cutHeightDiff = Math.abs(devnetStatus.cutHeight - miner1Status.cutHeight);
    expect(cutHeightDiff).toBeLessThan(MAX_CUTHEIGHT_DIFF);

    //stop the miner. mine some blocks, see if the miner cutheight does not grow
    await stopMiner(1);
    await waitForMinCutHeight(devnetStatus.cutHeight + 98 * 1, { timeoutSeconds: 100 });

    const stoppedMinerDevnetStatus = await getDevnetStatus();
    const stoppedMiner1Status = await getDevnetStatus('miner-1-consensus');
    expect(stoppedMiner1Status.cutHeight).toBe(0);

    //restart the miner
    await restartMiner(1);
    await waitForMinCutHeight(stoppedMinerDevnetStatus.cutHeight + 98 * 1, { timeoutSeconds: 100 });

    const restartedMinerDevnetStatus = await getDevnetStatus();
    const restartedMiner1Status = await getDevnetStatus('miner-1-consensus');
    expect(restartedMiner1Status.cutHeight).toBeGreaterThan(0);

    await waitForMinCutHeight(restartedMinerDevnetStatus.cutHeight + 98 * 3, {
      timeoutSeconds: 500,
    });

    //see if the miner is catching up
    const catchingupDevnetStatus = await getDevnetStatus();
    const catchingupMiner1Status = await getDevnetStatus('miner-1-consensus');
    const catchingupCutHeightDiff = Math.abs(
      catchingupDevnetStatus.cutHeight - catchingupMiner1Status.cutHeight
    );
    expect(catchingupCutHeightDiff).toBeLessThan(MAX_CUTHEIGHT_DIFF);
  });
});
