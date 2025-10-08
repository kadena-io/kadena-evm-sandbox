import { describe, test, expect, afterAll, beforeAll } from 'bun:test';
import {
  CONFIG,
  docker,
  generateDockerComposeAndStartNetwork,
  getDevnetStatus,
  stopAndRemoveNetwork,
  waitForMinCutHeight,
} from './devnet-utils';
import type { ContainerLogsOptions } from 'dockerode';

describe('e2e: check container logs during for errors, warnings, crashes etc', () => {
  beforeAll(async () => {
    await stopAndRemoveNetwork('kadena-dev');
    await generateDockerComposeAndStartNetwork('kadena-dev');
  });
  afterAll(() => {
    if (CONFIG.CLEAN_AFTER) {
      // return stopAndRemoveNetwork('kadena-dev');
    }
  });

  const containerArray = [
    'miner-1-mining-client',
    'miner-1-consensus',
    'miner-1-evm-init-20',
    'miner-1-evm-init-21',
    'miner-1-evm-init-22',
    'miner-1-evm-init-23',
    'miner-1-evm-init-24',
    'miner-1-evm-20',
    'miner-1-evm-21',
    'miner-1-evm-22',
    'miner-1-evm-23',
    'miner-1-evm-24',
    'miner-2-mining-client',
    'miner-2-consensus',
    'miner-2-evm-init-20',
    'miner-2-evm-init-21',
    'miner-2-evm-init-22',
    'miner-2-evm-init-23',
    'miner-2-evm-init-24',
    'miner-2-evm-20',
    'miner-2-evm-21',
    'miner-2-evm-22',
    'miner-2-evm-23',
    'miner-2-evm-24',
    'bootnode-allocations',
    'bootnode-consensus',
    'bootnode-evm-init-20',
    'bootnode-evm-init-21',
    'bootnode-evm-init-22',
    'bootnode-evm-init-23',
    'bootnode-evm-init-24',
    'bootnode-evm-20',
    'bootnode-evm-21',
    'bootnode-evm-22',
    'bootnode-evm-23',
    'bootnode-evm-24',
    'appdev-frontend',
    'appdev-evm-init-20',
    'appdev-evm-init-24',
    'appdev-evm-20',
    'appdev-evm-24',
    'appdev-consensus',
  ];

  const filterErrorLines =
    (cleanFunction?: (container: string, lines: string[]) => string[]) =>
    async (container: string): Promise<string[]> => {
      console.log('starting log check for', container);
      const c = await docker.getContainer(container.trim());

      // Fetch logs
      const logBuffer = await c.logs({
        follow: false,
        stdout: true,
        stderr: true,
        timestamps: true,
      });

      // Convert buffer to string and split into lines
      const logText = logBuffer.toString('utf8');
      const logLines = logText.split('\n');
      const affectedLines: string[] = [];

      // Filter and display lines containing errors, warnings, or crashes
      logLines.forEach((line) => {
        if (/error|warning|crash|exception|failed/i.test(line)) {
          affectedLines.push(line);
          console.log(container, 'Issue detected:', line);
        }
      });

      if (cleanFunction) {
        return cleanFunction(container, affectedLines);
      }

      return affectedLines;
    };

  // the appdev-consensus container and the bootnode-consensus container have a some expected warnings
  // because no miners were started in those containers. so we can ignore those lines
  const cleanLines = (container: string, lines: string[]): string[] => {
    return lines.filter(
      (line) =>
        !/EVM miner address is not set for ChainId/.test(line) &&
        container !== 'appdev-consensus' &&
        container !== 'bootnode-consensus'
    );
  };

  test('should show no errors on startup', async () => {
    const promises = containerArray.map(filterErrorLines(cleanLines));
    const results = await Promise.all(promises);

    results.forEach((logsArray) => {
      expect(logsArray.length).toBe(0);
    });
  });
  test('should show no errors during block production', async () => {
    const devnetStatus = await getDevnetStatus();
    await waitForMinCutHeight(devnetStatus.cutHeight + 98 * 1, { timeoutSeconds: 150 });

    const promises = containerArray.map(filterErrorLines(cleanLines));
    const results = await Promise.all(promises);

    results.forEach((logsArray) => {
      expect(logsArray.length).toBe(0);
    });
  });
});
