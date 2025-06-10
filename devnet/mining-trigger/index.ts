const config = {
  MINING_CONFIRMATION_PERIOD: parseFloat(
    process.env.MINING_CONFIRMATION_PERIOD ?? '12'
  ),
  MINER_HOSTNAME: process.env.MINER_HOSTNAME ?? 'localhost',
  MINER_PORT: parseInt(process.env.MINER_PORT ?? '1917', 10),
  CONSENSUS_CUT_ENDPOINT:
    process.env.CONSENSUS_CUT_ENDPOINT ??
    'http://localhost:1848/chainweb/0.0/evm-development/cut',
  CHAINS: process.env.CHAINS
    ? process.env.CHAINS.split(',').map((c) => c.trim())
    : // default to chains 0-97 if not provided
      Array.from({ length: 98 }, (_, i) => i.toString()),
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
    let maxRetryCount = Infinity;

    intervalRef = setInterval(async () => {
      const newCutHeight = await getCutHeight();
      last10intervalHeights.push(newCutHeight - lastHeight);
      if (last10intervalHeights.length > 10) {
        last10intervalHeights.shift(); // keep only the last 10 heights
      }
      const avgHeightsPerTrigger =
        Math.round(
          // use only oldest 5 heights to calculate the average
          (last10intervalHeights.slice(0, 5).reduce((a, b) => a + b, 0) / 5) *
            100
        ) / 100;
      maxRetryCount = Math.floor(98 / avgHeightsPerTrigger);

      lastHeight = newCutHeight;
      if (
        lastHeight === newCutHeight &&
        lastHeight < expectedCutHeight &&
        maxRetryCount !== Infinity
      ) {
        retryCount++;
        console.log(
          `    ${lastHeight} < ${expectedCutHeight} (try: ${retryCount}/${maxRetryCount}, avg: ${avgHeightsPerTrigger}, dynamic retry: ${
            Math.floor((98 / avgHeightsPerTrigger) * 10) / 10
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
  const response = await fetch(config.CONSENSUS_CUT_ENDPOINT);
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
