import { $, fs, path } from 'zx';
import { waitSeconds } from './utils';
import Docker from 'dockerode';

export const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export const CONFIG = {
  CLEAN_BEFORE: true,
  CLEAN_AFTER: true,
  VERBOSE: false,
};

export const $devnet = $({ cwd: path.join(__dirname, '../../devnet') });
export const $root = $({ cwd: path.join(__dirname, '../../') });

$.verbose = CONFIG.VERBOSE;

const createDockerFileName = (project?: ProjectType) => {
  return `../devnet/docker-compose.yaml`;
  //return `../devnet/${project}-docker-compose.yaml`;
};

export async function stopAndRemoveNetwork(project: ProjectType) {
  console.log('stopping network...');
  try {
    await $devnet`docker compose -f ${createDockerFileName(project)} down -v`;
    console.log('network stopped');
  } catch (e) {
    console.log('error stopping network:', e);
  }
  console.log(`removing ${createDockerFileName(project)}`);
  try {
    fs.rmSync(createDockerFileName(project));
    console.log(`${createDockerFileName(project)} removed`);
  } catch (e) {
    console.log(`error removing ${createDockerFileName(project)}:`, e);
  }
}

export type ProjectType = 'minimal' | 'kadena-dev' | 'kadena-dev-singleton-evm' | 'appdev';

export async function generateDockerComposeAndStartNetwork(project: ProjectType) {
  await createDockerComposeFile(project);
  await startNetwork(project);
}

export async function createDockerComposeFile(project: ProjectType) {
  console.log(`Generating ${createDockerFileName(project)}...`);
  await $devnet`uv run python ./compose.py > ${createDockerFileName(project)} --project ${project}`;
}

export async function startNetwork(project: ProjectType) {
  console.log('starting network...');
  await $devnet`docker compose -f ${createDockerFileName(project)} up -d`;
}

export interface DevnetChainStatus {
  chainId: number;
  height: number;
  hash: string;
  type: string;
}

export interface DevnetStatus {
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

export async function getDevnetStatus(nodeName?: string) {
  const devnetStatusOut = (await $root`./network devnet status ${nodeName || ''}`).stdall;

  return parseDevnetStatusOutput(devnetStatusOut);
}

export async function waitFor(
  checkFn: (devnetStatus: DevnetStatus) => boolean | Promise<boolean>,
  options: { intervalSeconds?: number; timeoutSeconds?: number } = {}
): Promise<void> {
  const { intervalSeconds = 4, timeoutSeconds = 15 } = options;
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

export async function waitForMinCutHeight(
  cutHeight: number,
  options?: { intervalSeconds?: number; timeoutSeconds?: number }
): Promise<void> {
  await waitFor((devnetStatus) => {
    const currentHeight = devnetStatus.cutHeight;
    console.log(`cut-height: ${currentHeight}, waiting for ${cutHeight}`);
    return currentHeight >= cutHeight;
  }, options);
}
