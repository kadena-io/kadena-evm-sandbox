import { describe, expect, it } from 'bun:test';
import hardhat from 'hardhat';

describe('Nginx', () => {
  it('forwards requests properly to the EVM', async () => {
    /** 
		 * curl http://localhost:1848/chainweb/0.0/evm-development/chain/20/evm/rpc/ \
						-X POST \
						-H "Content-Type: application/json" \
						--data '{"method":"eth_chainId","params":[],"id":1,"jsonrpc":"2.0"}'
		*/

    const hardhatConfig = await (await import('../hardhat.config')).default;
    const url = hardhatConfig.chainweb.devnet.externalHostUrl;
    console.log('Using URL:', url);
    const res = await fetch(url + 'chain/20/evm/rpc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'eth_chainId',
        params: [],
        id: 1,
        jsonrpc: '2.0',
      }),
    }).then((res) => res.json());

    expect(res).toBeDefined();
    expect(res.jsonrpc).toBe('2.0');
    expect(res.id).toBe(1);
    expect(res.result).toBeDefined();
    expect(res.result).toBe('0x6fd');
  });

  it('works with hardhat', async () => {
    // const account = '0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6';
    const [signer] = await hardhat.ethers.getSigners();
    const account = signer?.address!;
    console.log('checking balance for account:', account);
    const balance = await hardhat.ethers.provider.getBalance(account);
    console.log(`Balance for account ${account}:`, balance.toString());
  });
});
