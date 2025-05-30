import { createClient, Pact } from '@kadena/client';
import { describe, it, expect } from 'bun:test';

describe('Pact in evm-development', async () => {
  it('accepts a transaction', async () => {
    const kadena = createClient(
      ({ chainId, networkId }) =>
        `http://localhost:1848/chainweb/0.0/${networkId}/chain/${chainId}/pact`
    );

    const res = await kadena.dirtyRead(
      Pact.builder
        .execution(`(+ 1 2)`)
        .setNetworkId('evm-development')
        .setMeta({ chainId: '0' })
        .createTransaction()
    );

    expect(res).toBeDefined();

    if (res.result.status === 'success') {
      expect(res.result.data.int).toBe(3);
    }
  });
});
