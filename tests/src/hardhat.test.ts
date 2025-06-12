import { describe, expect, it } from 'bun:test';
import hardhat from 'hardhat';
import { $ } from 'zx';

describe('Nginx', () => {
  it('forwards requests properly to the EVM', async () => {
    /** 
		 * curl http://localhost:1848/chainweb/0.0/evm-development/chain/20/evm/rpc/ \
						-X POST \
						-H "Content-Type: application/json" \
						--data '{"method":"eth_chainId","params":[],"id":1,"jsonrpc":"2.0"}'
		*/

    const hardhatConfig = (await (
      await import('../hardhat.config.js')
    ).default) as any;
    const url = hardhatConfig.chainweb.devnet.externalHostUrl;
    console.log('Using URL:', url);
    const res = (await fetch(url + 'chain/20/evm/rpc', {
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
    }).then((res) => res.json())) as any;

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

  it('works using `hardhat run ./scripts/send-basic-tx.js`', async () => {
    try {
      $.verbose = true;
      await new Promise((resolve) => {
        const testTx = $`bun run test-tx`.stdio('inherit');
        const cutUrl = 'http://localhost:1848/chainweb/0.0/evm-development/cut';
        interval(
          { timeout: 20000, interval: 1000 },
          async (count: number, cancel: () => void) => {
            const res = (await fetch(cutUrl).then((res) => res.json())) as {
              height: number;
            };
            console.log(`Current cut (${count}): ${res.height}`);
            return testTx.then(() => {
              cancel();
              resolve(true);
            });
          }
        );
        return testTx;
      });
      console.log('Test transaction executed successfully.');
      expect(true).toBe(true); // Just to ensure the test passes
    } catch (error) {
      console.error('Error running test-tx:', error);
      expect(true).toBe(false); // Just to ensure the test passes
      throw error;
    } finally {
      $.verbose = false;
    }
  }, 30000);
});

function interval(
  options: { timeout: number; interval: number },
  fn: (count: number, cancel: () => void) => Promise<void>
) {
  const { timeout, interval: intervalTime } = options;
  let count = 0;
  const startTime = Date.now();

  return new Promise<void>((resolve, reject) => {
    const id = setInterval(async () => {
      if (Date.now() - startTime > timeout) {
        clearInterval(id);
        reject(new Error('Timeout exceeded'));
      } else {
        try {
          await fn(count++, () => {
            clearInterval(id);
            resolve();
          });
        } catch (error) {
          clearInterval(id);
          reject(error);
        }
      }
    }, intervalTime);
  });
}
