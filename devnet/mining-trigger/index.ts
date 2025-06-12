const config = {
  MINING_CONFIRMATION_PERIOD: parseFloat(
    process.env.MINING_CONFIRMATION_PERIOD ?? '12'
  ),
  MINER_HOSTNAME: process.env.MINER_HOSTNAME ?? 'localhost',
  MINER_PORT: parseInt(process.env.MINER_PORT ?? '1917', 10),
  TRIGGERED_MINING: process.env.TRIGGERED_MINING
    ? process.env.TRIGGERED_MINING.toLowerCase() === 'true'
    : true, // default to true
  CONTINUOUS_MINING: process.env.CONTINUOUS_MINING
    ? process.env.CONTINUOUS_MINING.toLowerCase() === 'true'
    : true, // default to true
  CONSENSUS_ENDPOINT:
    process.env.CONSENSUS_ENDPOINT ??
    'http://localhost:1848/chainweb/0.0/evm-development',
  CHAINS: process.env.CHAINS
    ? process.env.CHAINS.split(',').map((c) => c.trim())
    : // default to chains 0-97 if not provided
      Array.from({ length: 98 }, (_, i) => i.toString()),
};

const getChainsFromEnv = (chains: string[]): Record<string, number> => {
  if (!chains) {
    return {};
  }
  return chains.reduce((acc, chain) => {
    // 1 block per chain
    acc[chain.toString()] = 1;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Creates blocks on multiple chains based on the provided map.
 * Default to 1 block for each chain
 * @param chainMap - map where keys are chain IDs an values are the number of blocks to create
 */
export async function makeBlocks(chainMap?: {
  [key: string]: number;
}): Promise<Response> {
  // default value is a map of 0-97 with 1 block each
  if (!chainMap) {
    chainMap = {};
    for (let i = 0; i < 98; i++) {
      chainMap[i.toString()] = 1;
    }
  }
  const sameCount = Object.entries(chainMap).reduce((acc, [_, count]) => {
    if (acc === false) return false;
    if (acc === undefined) return count;
    if (acc !== count) {
      return false; // not all counts are the same
    }
    return acc; // all counts are the same
  }, undefined as undefined | number | false);

  if (sameCount) {
    console.log(
      `[${new Date()
        .toTimeString()
        .split(' ')[0]!
        .trim()}] Requesting ${sameCount} block(s) on chains:`,
      Object.keys(chainMap)
    );
  } else {
    console.log('Chains: ', Object.keys(chainMap));
    console.log('Counts: ', Object.values(chainMap));
  }

  const url = `http://${config.MINER_HOSTNAME}:${config.MINER_PORT}/make-blocks`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(chainMap),
  });

  if (!response.ok) {
    if (response.statusText.includes('Unable to connect')) {
      console.error('Unable to connect to the miner.');
      console.error('Check if the docker `networks` are configured correctly.');
      console.error('Check if the miner is set to `--worker=on-demand`.');
    }
    throw new Error(`Error making blocks: ${response.statusText}`);
  }

  return response;
}

async function main() {
  console.log(`${process.argv.join(' ')}`);
  console.log('Current config (can be passed as ENV vars):', config);

  if (config.TRIGGERED_MINING === false) {
    console.log('Triggered mining is disabled');
  } else {
    await startMiningTriggerListener().catch((error) => {
      console.error('Error starting mining trigger listener:', error);
      throw error;
    });
  }

  if (config.CONTINUOUS_MINING === false) {
    console.log('Continuous mining is disabled');
  } else {
    continuousMining().catch((error) => {
      console.error('Error in continuous mining:', error);
      throw error;
    });
  }
}

const errorCount = 0;

main().catch((error) => {
  console.error('Error in main function:', error);
  if (errorCount < 5) {
    console.error(`Retrying in 2 seconds... (Attempt ${errorCount + 1}/5)`);
    setTimeout(main, 2000);
  } else {
    console.error('Max error count reached. Exiting...');
    throw error;
  }
});

async function getCutHeight() {
  const response = await fetch(config.CONSENSUS_ENDPOINT + '/cut');
  if (!response.ok) {
    throw new Error(`Error fetching cut height: ${response.statusText}`);
  }
  const data = (await response.json()) as { instance: string; height: number };
  return data.height;
}

function retry(
  fn: () => Promise<number>,
  { count, delay }: { count: number; delay: number }
) {
  return new Promise<number>((resolve, reject) => {
    const attempt = async (n: number) => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        if (n === 1) {
          reject(error);
        } else {
          console.log(`Retrying... (${count - n + 1}/${count})`);
          console.error('Error:', error);
          setTimeout(() => attempt(n - 1), delay);
        }
      }
    };
    attempt(count);
  });
}

import net from 'net';

async function startMiningTriggerListener() {
  console.log('Starting mining trigger listener...');
  console.log('Continuous mining for every 10 seconds is enabled.');
  let miningTriggered = false;

  const server = net.createServer((client) => {
    client.on('data', (data) => {
      const chainId = data
        .toString()
        .split('\r\n')
        .find((line) => line.startsWith('X-Original-URI: '))
        ?.match(/\/chain\/(\d+)\/evm\/rpc/)![1] as string;
      const body = JSON.parse(data.toString().split('\r\n\r\n')[1] || '') as {
        jsonrpc: string;
        method: string;
        params: any[];
      };

      const methods = ['eth_sendRawTransaction', 'eth_sendTransaction'];
      if (methods.includes(body.method)) {
        console.log(`Waiting 3 seconds...`);
        miningTriggered = true;
        setTimeout(() => {
          miningTriggered = false;
        }, 10000);
        setTimeout(() => {
          console.log(`Triggering mining for chain ${chainId}`);
          makeBlocks({ [chainId]: 3 });
        }, 3000);
      } else {
        console.log(
          `   Received request for chain: ${chainId} (method: ${
            body.method
          }, params: ${JSON.stringify(body.params)})`
        );
      }
      return client.end(
        'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nMining triggered'
      );
    });
  });

  makeBlocks(getChainsFromEnv(config.CHAINS)).catch((error) => {
    console.error('Error creating blocks:', error);
  });
  setInterval(() => {
    if (!miningTriggered) {
      console.log(
        'No mining trigger received in the last 10 seconds, triggering mining...'
      );
      makeBlocks(getChainsFromEnv(config.CHAINS)).catch((error) => {
        console.error('Error creating blocks:', error);
      });
    }
  }, 10000);

  server.listen(11848, '0.0.0.0', () => {
    console.log('Mining trigger listener started on port 11848');
  });
}

async function continuousMining() {
  let intervalRef = null as NodeJS.Timeout | null;
  process.on('SIGINT', () => {
    console.log('SIGINT received, exiting...');
    try {
      if (intervalRef) {
        clearInterval(intervalRef);
        console.log('Cleared interval.');
      }
    } catch (error) {}
    process.exit(0);
  });

  try {
    let lastHeight = await retry(
      async () => {
        let last = await getCutHeight();
        return last;
      },
      { count: 5, delay: 2000 }
    );
    const last10intervalHeights: number[] = [];

    await makeBlocks(getChainsFromEnv(config.CHAINS));
    let expectedCutHeight = lastHeight + 98; // 98 chains, 1 block each
    let retryCount = 0;
    let maxRetryCount = 20;

    intervalRef = setInterval(async () => {
      const newCutHeight = await getCutHeight();
      last10intervalHeights.push(newCutHeight - lastHeight);
      if (last10intervalHeights.length > 10) {
        last10intervalHeights.shift(); // keep only the last 10 heights
      }
      const avgHeightsPerTrigger =
        Math.ceil(
          // use only oldest 5 heights to calculate the average
          (Array.from(last10intervalHeights)
            .sort((a, b) => b - a)
            .slice(0, 5)
            .reduce((a, b) => a + b, 0) /
            5) *
            100
        ) / 100;
      maxRetryCount = Math.ceil(98 / avgHeightsPerTrigger);

      lastHeight = newCutHeight;
      if (
        lastHeight === newCutHeight &&
        lastHeight < expectedCutHeight &&
        maxRetryCount !== Infinity
      ) {
        retryCount++;
        console.log(
          `    ${lastHeight} < ${expectedCutHeight} (try: ${retryCount}/${maxRetryCount}, avg: ${avgHeightsPerTrigger}, dynamic retry: ${
            Math.ceil((98 / avgHeightsPerTrigger) * 10) / 10
          })`
        );
        if (retryCount <= maxRetryCount) return;
      }
      if (retryCount > maxRetryCount) {
        console.log(`Retry count exceeded: ${retryCount} > ${maxRetryCount}`);
        console.log('Forcing block request...');
      }
      retryCount = 0;

      expectedCutHeight = lastHeight + 98; // 98 chains, 1 block each
      console.log(`Requesting new blocks.`);
      console.log(
        `Current: ${lastHeight}, waiting for cut height: ${expectedCutHeight}`
      );

      await makeBlocks(getChainsFromEnv(config.CHAINS)).catch((error) => {
        console.error('Error creating blocks:', error);
        throw error;
      });
    }, 1000);
  } catch (error) {
    console.error('Error creating blocks:', error);
    throw error;
  }
}
