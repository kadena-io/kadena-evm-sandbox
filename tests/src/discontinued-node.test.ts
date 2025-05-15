import { describe, test, expect, afterAll, beforeAll } from 'bun:test';
import {
  CONFIG,
  $devnet,
  $root,
  stopAndRemoveNetwork,
  generateDockerComposeAndStartNetwork,
} from './devnet-utils';

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

  test('generate docker-compose.test.yml', async () => {
    await generateDockerComposeAndStartNetwork();

    await waitForCutHeight(98);

    console.log('stopping bootnode-evm-20...');
    await $devnet`docker compose -f ../devnet/docker-compose.test.yml stop bootnode-evm-20`;
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
    await $devnet`docker compose -f ../devnet/docker-compose.test.yml start bootnode-evm-20`;
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

async function getDevnetStatus() {
  const devnetStatusOut = (await $root`./network devnet status`).stdall;

  return devnetStatusOut
    .split('\n')
    .filter((line) => line.match(/^\d/))
    .map((line) => line.trim().split(/\s+/))
    .map(([chainId, height, hash, type]) => ({
      chainId: parseInt(chainId!),
      height: parseInt(height!),
      hash,
      type,
    }));
}

async function waitForCutHeight(
  cutHeight: number
): Promise<number | undefined> {
  console.log(`wait for cut-height of ${cutHeight}`);
  let firstCutHeight: number | undefined = undefined;
  let iteration = 0;
  return new Promise(async (resolve, reject) => {
    let currentHeight = 0;
    while (currentHeight < cutHeight) {
      const devnetStatus = (await $root`./network devnet status`).stdall;
      currentHeight = parseInt(
        devnetStatus
          .split('\n')
          .find((line) => line.startsWith('cut-height'))!
          .split(':')[1]!
          .trim()
      );
      if (firstCutHeight === undefined) firstCutHeight = currentHeight;
      if (currentHeight === firstCutHeight && iteration > 0) {
        reject('cut-height not increasing');
      }
      console.log(`cut-height: ${currentHeight}, waiting for ${cutHeight}`);
      if (currentHeight < cutHeight) await waitSeconds(5);
      iteration++;
    }
    console.log(`cut-height ${currentHeight} > ${cutHeight} reached`);
    resolve(currentHeight);
  });
}

function waitSeconds(seconds: number) {
  return new Promise((resolve) => {
    let count = 0;
    const intervalId = setInterval(() => {
      count++;
      process.stdout.write('.');
      if (count === seconds) {
        clearInterval(intervalId);
        resolve(true);
      }
    }, 1000);
  });
}
