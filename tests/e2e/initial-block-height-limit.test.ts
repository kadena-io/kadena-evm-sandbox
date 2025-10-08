import { describe, test, expect, afterAll, beforeAll } from 'bun:test';
import {
  $devnet,
  CONFIG,
  createDockerFileName,
  generateDockerComposeAndStartNetwork,
  getDevnetStatus,
  stopAndRemoveNetwork,
  waitFor,
} from './devnet-utils';
import { createLogger } from './utils';
import { $ } from 'zx';
import { stopContainer } from './node-utils';

$.verbose = CONFIG.VERBOSE;

const DOCKER_COMPOSE_FILE = createDockerFileName('default');
const log = createLogger({ context: 'initial-block-height-limit-test.ts' });

describe('e2e: initial block height limit', () => {
  beforeAll(() => {
    // return startNetwork('default');
    if (CONFIG.CLEAN_BEFORE) {
      return stopAndRemoveNetwork('default');
    }
  });
  afterAll(() => {
    if (CONFIG.CLEAN_AFTER) {
      // return stopAndRemoveNetwork('kadena-dev');
    }
  });

  test(`e2e: start mining, set initial block height limit arg, restart and continue`, async () => {
    const WAIT_FOR_HEIGHT = 3;
    const INITIAL_BLOCK_HEIGHT_LIMIT_ARG = 2; // is also set in docker-compose.override-initial-height.yaml
    await generateDockerComposeAndStartNetwork('default');
    /**
     * 1. docker compose -f docker-compose.yaml up -d (this starts everything )
     * 2. wait for heights to reach WAIT_FOR_HEIGHT
     * 3. stop miner, trigger and consensus
     * 4. docker compose -f docker-compose.yaml -f docker-compose.override-initial-height.yaml up (this starts without mining, with initial height set to 2)
     * 5. validate heights is reset to INITIAL_BLOCK_HEIGHT_LIMIT_ARG
     * 6. docker compose -f docker-compose.yaml up -d (this starts everything )
     */

    log(`waiting for ${WAIT_FOR_HEIGHT}`);
    await waitFor(
      ({ chains, cutHeight }) => {
        log(`cut-height: ${cutHeight}, current heights: ${chains.map((c) => c.height).join(', ')}`);
        return chains.every((chain) => chain.height >= WAIT_FOR_HEIGHT);
      },
      { timeoutSeconds: 180 }
    );

    log(`height ${WAIT_FOR_HEIGHT} reached, stopping containers...`);
    const containersToStop = [
      'bootnode-mining-trigger',
      'bootnode-consensus',
      'bootnode-mining-client',
    ];
    await Promise.all(containersToStop.map((c) => stopContainer(c)));

    log(
      `restarting with initial height limit of ${INITIAL_BLOCK_HEIGHT_LIMIT_ARG}... (not mining)`
    );
    await $devnet`CONTINUOUS_INTERVAL=5000 docker compose -f ${DOCKER_COMPOSE_FILE} -f docker-compose.override-initial-height.yaml up -d`;

    log(`waiting for heights to reset to ${INITIAL_BLOCK_HEIGHT_LIMIT_ARG}...`);
    await waitFor(
      ({ chains, cutHeight }) => {
        log(`cut-height: ${cutHeight}, current heights: ${chains.map((c) => c.height).join(', ')}`);
        return chains.every((chain) => chain.height === INITIAL_BLOCK_HEIGHT_LIMIT_ARG);
      },
      { timeoutSeconds: 10 }
    );
    log(`heights reset to ${INITIAL_BLOCK_HEIGHT_LIMIT_ARG}, restarting mining containers...`);

    await $devnet`docker compose -f ${DOCKER_COMPOSE_FILE} -f docker-compose.override-initial-height.yaml down`;

    await $devnet`CONTINUOUS_INTERVAL=5 docker compose -f ${DOCKER_COMPOSE_FILE} up -d --force-recreate`;

    log(`waiting for heights to reach ${WAIT_FOR_HEIGHT + 1} again...`);
    await waitFor(
      ({ chains, cutHeight }) => {
        log(`cut-height: ${cutHeight}, current heights: ${chains.map((c) => c.height).join(', ')}`);
        return chains.every((chain) => chain.height >= WAIT_FOR_HEIGHT + 1);
      },
      { timeoutSeconds: 90 }
    );
    log(`heights reached ${WAIT_FOR_HEIGHT + 1} again, test complete`);

    const devnetStatus = await getDevnetStatus();

    expect(
      devnetStatus.chains.every((chain) => chain.height >= WAIT_FOR_HEIGHT + 1),
      `chains have not reached height of ${WAIT_FOR_HEIGHT + 1}`
    ).toBe(true);
  });
});
