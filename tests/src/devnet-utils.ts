import { $, fs, path } from 'zx';
import { waitSeconds } from './utils';

export const CONFIG = {
  CLEAN_BEFORE: true,
  CLEAN_AFTER: false,
  VERBOSE: false,
};

export const DOCKER_COMPOSE_FILE = '../devnet/docker-compose.yml';

export const $devnet = $({ cwd: path.join(__dirname, '../../devnet') });
export const $root = $({ cwd: path.join(__dirname, '../../') });

$.verbose = CONFIG.VERBOSE;

export async function stopAndRemoveNetwork() {
  console.log('stopping network...');
  try {
    await $devnet`docker compose -f ${DOCKER_COMPOSE_FILE} down -v`;
    console.log('network stopped');
  } catch (e) {
    console.log('error stopping network:', e);
  }
  console.log(`removing ${DOCKER_COMPOSE_FILE}`);
  try {
    fs.rmSync(DOCKER_COMPOSE_FILE);
    console.log(`${DOCKER_COMPOSE_FILE} removed`);
  } catch (e) {
    console.log(`error removing ${DOCKER_COMPOSE_FILE}:`, e);
  }
}

export async function generateDockerComposeAndStartNetwork() {
  await createDockerComposeFile();
  await startNetwork();
}

export async function createDockerComposeFile() {
  console.log(`Generating ${DOCKER_COMPOSE_FILE}...`);
  await $devnet`uv run python ./compose.py > ${DOCKER_COMPOSE_FILE}`;
}

export async function startNetwork() {
  console.log('starting network...');
  await $devnet`docker compose -f ${DOCKER_COMPOSE_FILE} up -d`;
}
export async function getDevnetStatus() {
  const devnetStatusOut = (await $root`./network devnet status`).stdall;

  const res = devnetStatusOut
    .split('\n')
    .filter((line) => line.match(/^\d/))
    .map((line) => line.trim().split(/\s+/))
    .map(([chainId, height, hash, type]) => ({
      chainId: parseInt(chainId!),
      height: parseInt(height!),
      hash,
      type,
    }));

  console.log('devnet status:', res);

  return res;
}
export async function waitForCutHeight(
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
      if (currentHeight < cutHeight) await waitSeconds(4);
      iteration++;
    }
    console.log(`cut-height ${currentHeight} > ${cutHeight} reached`);
    resolve(currentHeight);
  });
}
