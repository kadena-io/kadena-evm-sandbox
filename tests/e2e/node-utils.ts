import {
  $root,
  docker,
  parseDevnetStatusOutput,
  type DevnetChainStatus,
  type DevnetStatus,
} from './devnet-utils';

// utility to get chain status from devnet status
export const getChainFromStatus = (chainId: number, status: DevnetStatus): DevnetChainStatus => {
  return status.chains.find((c) => c.chainId === chainId)!;
};

export const checkContainerIsRunning = async (containerName: string): Promise<boolean> => {
  const container = docker.getContainer(containerName);
  const data = await container.inspect();
  return data.State.Status === 'running';
};

export const stopContainer = async (containerName: string) => {
  try {
    // Get the container by ID or name
    const container = docker.getContainer(containerName);

    // Stop the container
    await container.stop();
    console.log(`Container ${containerName} stopped successfully.`);
  } catch (error: any) {
    console.error('Error stopping container:', error.message);
  }
};

export const restartContainer = async (containerName: string) => {
  try {
    // Get the container by ID or name
    const container = docker.getContainer(containerName);

    // Stop the container
    await container.restart();
    console.log(`Container ${containerName} restarted successfully.`);
  } catch (error: any) {
    console.error('Error restarting container:', error.message);
  }
};

export const stopMiner = async (minerId: 1 | 2) => {
  await stopContainer(`miner-${minerId}-consensus`);
  await stopContainer(`miner-${minerId}-evm-20`);
  await stopContainer(`miner-${minerId}-evm-22`);
  await stopContainer(`miner-${minerId}-evm-23`);
  await stopContainer(`miner-${minerId}-evm-21`);
  await stopContainer(`miner-${minerId}-evm-24`);
  await stopContainer(`miner-${minerId}-mining-client`);
};

export const restartMiner = async (minerId: 1 | 2) => {
  await restartContainer(`miner-${minerId}-consensus`);
  await restartContainer(`miner-${minerId}-evm-20`);
  await restartContainer(`miner-${minerId}-evm-22`);
  await restartContainer(`miner-${minerId}-evm-23`);
  await restartContainer(`miner-${minerId}-evm-21`);
  await restartContainer(`miner-${minerId}-evm-24`);
  await restartContainer(`miner-${minerId}-mining-client`);
};

export async function getNodeStatus() {
  const devnetStatusOut = (await $root`./network devnet status`).stdall;

  return parseDevnetStatusOutput(devnetStatusOut);
}
