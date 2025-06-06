const config = {
  MINING_CONFIRMATION_PERIOD: parseFloat(
    process.env.MINING_CONFIRMATION_PERIOD ?? '12'
  ),
  MINER_HOSTNAME: process.env.MINER_HOSTNAME ?? 'localhost',
  MINER_PORT: parseInt(process.env.MINER_PORT ?? '1917', 10),
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
        .split('(')[0]
        .trim()}] Requesting ${sameCount} blocks on chains:`,
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
    throw new Error(`Error making blocks: ${response.statusText}`);
  }

  return response;
}

async function main() {
  // show current config
  console.log('Current config:', {
    MINING_CONFIRMATION_PERIOD: config.MINING_CONFIRMATION_PERIOD,
    MINER_HOSTNAME: config.MINER_HOSTNAME,
    MINER_PORT: config.MINER_PORT,
  });
  try {
    await makeBlocks({ '20': 1 });
    // setInterval(() => {
    //   makeBlocks().catch((error) => {
    //     console.error('Error creating blocks:', error);
    //   });
    // }, config.MINING_CONFIRMATION_PERIOD * 1000);
  } catch (error) {
    console.error('Error creating blocks:', error);
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
    process.exit(1);
  }
});
