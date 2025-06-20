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
import { fs, $, sleep } from 'zx';
import { getNodesCut } from './getNodesCut';

$.verbose = CONFIG.VERBOSE;

const log = createLogger({ context: 'multi-node.test.ts' });

describe('e2e: multi-node network', () => {
  beforeAll(async () => {
    if (CONFIG.CLEAN_BEFORE) {
      await stopAndRemoveNetwork();
    }
    log('starting network...');
    await generateDockerComposeAndStartNetwork('appdev');
  });
  afterAll(() => {
    if (CONFIG.CLEAN_AFTER) {
      return stopAndRemoveNetwork();
    } else {
    }
  });

  test(
    'multi-node: generate and start network',
    async () => {
      const cutHeights: number[][] = [];
      for (let i = 0; i < 2; i++) {
        if (i > 0) {
          await sleep(20 * 1000);
        }
        log(`Checking ${i + 1}-th time for cut heights...`);
        const heights = await getNodesCut().then((cut) => {
          return cut.map((c) => c.height);
        });
        cutHeights.push(heights);
      }

      pivot(cutHeights).map((sequence, i) => {
        expect(
          unique(sequence),
          `Node ${i + 1} heights isn't increasing`
        ).toEqual(sequence);
        expect(
          isIncremental(sequence),
          `Node ${i + 1} heights aren't incremental`
        ).toBe(true);
      });

      // await sleep(30 * 60 * 1000); // Sleep for 30 minutes to allow the network to run
    },
    { timeout: 30 * 60 * 1000 }
  );

  test('no errors in docker compose logs for consensus services', async () => {
    const dockerComposePs =
      await $devnet`docker compose -f ${DOCKER_COMPOSE_FILE} ps --format json`;
    const services = dockerComposePs.lines().map((line) => JSON.parse(line));
    const consensusServices = services.filter((s) =>
      s.Names.includes('consensus')
    );

    for (const service of consensusServices) {
      // $.verbose = true;
      const logs =
        await $devnet`docker compose -f ${DOCKER_COMPOSE_FILE} logs ${service.Names} --since 5m`;
      $.verbose = CONFIG.VERBOSE;

      const logsWithError = logs.stdout
        .split('\n')
        .filter((n) => n.includes('[Error]'))
        .join('\n');
      expect(
        logsWithError,
        `Logs for ${service.Names} contain errors`
      ).not.toContain('[Error]');
    }
  });
});

function pivot(cutHeights: number[][]) {
  return cutHeights[0]!.map((_, colIndex) =>
    cutHeights.map((row) => row[colIndex])
  );
}

function unique(sequence: (number | undefined)[]): any {
  return [...new Set(sequence)];
}
function isIncremental(sequence: (number | undefined)[]): any {
  return sequence.every((value, index, arr) => {
    if (index === 0) return true; // First element is always considered incremental
    return (
      value !== undefined &&
      arr[index - 1] !== undefined &&
      value >= arr[index - 1]!
    );
  });
}
