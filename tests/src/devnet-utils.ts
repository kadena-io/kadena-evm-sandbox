import { $, fs } from 'zx';

export const CONFIG = {
  CLEAN_BEFORE: true,
  CLEAN_AFTER: false,
  VERBOSE: false,
};

export const $devnet = $({ cwd: '../devnet' });
export const $root = $({ cwd: '../' });

$.verbose = CONFIG.VERBOSE;

export async function stopAndRemoveNetwork() {
  console.log('stopping network...');
  await $devnet`docker compose -f ../devnet/docker-compose.test.yml down -v`;
  console.log('network stopped');
  console.log('removing docker-compose.test.yml');
  fs.rmSync('../devnet/docker-compose.test.yml');
  console.log('docker-compose.test.yml removed');
}

export async function generateDockerComposeAndStartNetwork() {
  console.log('Generating docker-compose.test.yml...');
  await $devnet`uv run python ./compose.py > docker-compose.test.yml`;

  console.log('starting network...');
  await $devnet`docker compose -f ../devnet/docker-compose.test.yml up -d`;
}
