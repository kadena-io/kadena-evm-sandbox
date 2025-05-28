require("@nomicfoundation/hardhat-toolbox");
require("hardhat-switch-network");
require("@nomicfoundation/hardhat-verify");
const path = require("path");
const fs = require("fs");

// Read and parse the accounts file
const devnetAccountsPath = path.join(__dirname, 'devnet-accounts.json');
const devnetAccountsFile = fs.readFileSync(devnetAccountsPath, 'utf8');
const devnetAccounts = JSON.parse(devnetAccountsFile);

// Validate account configuration
const requiredAccounts = 20;
if (devnetAccounts.accounts.length !== requiredAccounts) {
  throw new Error(`Expected ${requiredAccounts} accounts in devnet-accounts.json, found ${devnetAccounts.accounts.length}`);
};

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },

    ]
  },
  defaultNetwork: "kadena_devnet0",
  networks: {
    kadena_devnet0: {
      url: 'http://localhost:1848/chainweb/0.0/evm-development/chain/20/evm/rpc',
      chainId: 1789,
      accounts: devnetAccounts.accounts.map(account => account.privateKey),
      chainwebChainId: 20,
    },
    kadena_devnet1: {
      url: 'http://localhost:1848/chainweb/0.0/evm-development/chain/21/evm/rpc',
      chainId: 1790,
      accounts: devnetAccounts.accounts.map(account => account.privateKey),
      chainwebChainId: 21,
    },
  },
  sourcify: {
    enabled: false,
  },
  etherscan: {
    apiKey: {
      'kadena_devnet0': 'empty',
      'kadena_devnet1': 'empty',
    },
    customChains: [
      {
        network: "kadena_devnet0",
        chainId: 1789,
        urls: {
          apiURL: "http://localhost:8000/api",
          browserURL: "http://localhost:8000"
        }
      },
      {
        network: "kadena_devnet1",
        chainId: 1790,
        urls: {
          apiURL: "http://localhost:8001/api",
          browserURL: "http://localhost:8001"
        }
      },
    ]
  },
  mocha: {
    timeout: 300000
  }
};

