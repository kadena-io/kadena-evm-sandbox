// generate-accounts.mjs
import { HDNodeWallet } from 'ethers';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ESM equivalent of __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Configuration for account generation
 * These values should match the devnet configuration
 */
const CONFIG = {
  numAccounts: 20,
  // Using fixed seed for reproducibility
  seed: new Uint8Array(16),
  // Standard path for ethereum accounts
  basePath: "m/44'/1'/0'/0",
  outputFile: 'devnet-accounts.json'
};

/**
 * Generates deterministic accounts matching devnet configuration
 * Uses the same HD wallet derivation as the devnet
 */
async function generateAccounts() {
  // Create master HD wallet from seed
  const masterWallet = HDNodeWallet.fromSeed(CONFIG.seed);

  const accounts = Array.from({ length: CONFIG.numAccounts }, (_, i) => {
    const path = `${CONFIG.basePath}/${i}`;
    const wallet = masterWallet.derivePath(path);
    return {
      privateKey: wallet.privateKey,
      address: wallet.address,
      path: path
    };
  });

  return accounts;
}

/**
 * Saves account information to JSON file with usage instructions
 * @param {Array} accounts Array of generated accounts
 */
async function saveAccounts(accounts) {
  const accountsJson = {
    metadata: {
      generated: new Date().toISOString(),
      numAccounts: CONFIG.numAccounts,
      basePath: CONFIG.basePath,
      usage: "Copy this file to your Hardhat project's root directory"
    },
    accounts: accounts
  };

  const outputPath = join(__dirname, CONFIG.outputFile);
  await writeFile(
    outputPath,
    JSON.stringify(accountsJson, null, 2)
  );

  console.log(`Generated ${accounts.length} accounts in ${outputPath}`);
  console.log('First account address:', accounts[0].address);
  console.log('Last account address:', accounts[accounts.length - 1].address);
  console.log('\nInstructions:');
  console.log('1. Copy devnet-accounts.json to your Hardhat project root');
  console.log('2. Add the following to your hardhat.config.js/ts:');
  console.log(`
  // Read devnet accounts
  const devnetAccountsPath = path.join(__dirname, 'devnet-accounts.json');
  const devnetAccountsFile = fs.readFileSync(devnetAccountsPath, 'utf8');
  const devnetAccounts = JSON.parse(devnetAccountsFile);

  // In your network config:
  networks: {
    kadena_devnet: {
      url: 'http://localhost:8545',
      chainId: 1789,
      accounts: devnetAccounts.accounts.map(account => account.privateKey)
    }
  }
  `);
}

// Main execution
try {
  const accounts = await generateAccounts();
  await saveAccounts(accounts);
} catch (error) {
  console.error('Error generating accounts:', error);
  process.exit(1);
}