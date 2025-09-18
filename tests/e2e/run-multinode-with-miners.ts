import { describe, test, expect, afterAll, beforeAll } from 'bun:test';
import {
  CONFIG,
  generateDockerComposeAndStartNetwork,
  getDevnetStatus,
  stopAndRemoveNetwork,
  waitForMinCutHeight,
} from './devnet-utils';

describe(`e2e: multinode config with miners`, () => {
  beforeAll(() => {});
  afterAll(() => {
    if (CONFIG.CLEAN_AFTER) {
      return stopAndRemoveNetwork();
    }
  });

  test('should see an update in blockheight on every chain', async () => {
    await generateDockerComposeAndStartNetwork();
    const devnetStatus = await getDevnetStatus();

    const evmChains = devnetStatus.chains.filter((c) => c.type === 'evm');
    expect(evmChains.length).toBeGreaterThan(1);
    const currentHeight = devnetStatus.cutHeight;

    // wait for a 2 height (just to be sure that  all are upadted)
    await waitForMinCutHeight(currentHeight + 98 * 2, { timeoutSeconds: 100 });
    const newDevnetStatus = await getDevnetStatus();
    const newEvmChains = newDevnetStatus.chains.filter((c) => c.type === 'evm');

    expect(!!evmChains.find((chain, idx) => chain.height >= newEvmChains[idx]!.height)).toBe(false);
  });
});
