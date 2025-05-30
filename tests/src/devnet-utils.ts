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

interface DevnetChainStatus {
  chainId: number;
  height: number;
  hash: string;
  type: string;
}

interface DevnetStatus {
  chains: DevnetChainStatus[];
  cutHeight: number;
}

export function parseDevnetStatusOutput(output: string): DevnetStatus {
  const lines = output.trim().split('\n');
  const chains: DevnetChainStatus[] = [];
  let cutHeight = 0;

  for (const line of lines) {
    if (/^\d+\s+\d+\s+\S+\s+\S+/.test(line)) {
      const [chainId, height, hash, type] = line.trim().split(/\s+/) as [
        string,
        string,
        string,
        string
      ];
      chains.push({
        chainId: parseInt(chainId, 10),
        height: parseInt(height, 10),
        hash,
        type,
      });
    } else if (line.startsWith('cut-height')) {
      cutHeight = parseInt((line.split(':') as [string, string])[1].trim(), 10);
    }
  }

  return { chains, cutHeight };
}

export async function getDevnetStatus() {
  const devnetStatusOut = (await $root`./network devnet status`).stdall;

  return parseDevnetStatusOutput(devnetStatusOut);
}

export async function waitFor(
  checkFn: (devnetStatus: DevnetStatus) => boolean | Promise<boolean>,
  options: { intervalSeconds?: number; timeoutSeconds?: number } = {}
): Promise<void> {
  const { intervalSeconds = 4, timeoutSeconds = 120 } = options;
  const start = Date.now();
  let iteration = 0;

  while (true) {
    const devnetStatus = await getDevnetStatus();
    if (await checkFn(devnetStatus)) {
      return;
    }
    if ((Date.now() - start) / 1000 > timeoutSeconds) {
      throw new Error('waitFor: timeout exceeded');
    }
    await waitSeconds(intervalSeconds);
    iteration++;
  }
}

export async function waitForCutHeight(
  cutHeight: number,
  options?: { intervalSeconds?: number; timeoutSeconds?: number }
): Promise<void> {
  await waitFor((devnetStatus) => {
    const currentHeight = devnetStatus.cutHeight;
    console.log(`cut-height: ${currentHeight}, waiting for ${cutHeight}`);
    return currentHeight >= cutHeight;
  }, options);
}
