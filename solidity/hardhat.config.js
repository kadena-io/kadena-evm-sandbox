require("@nomicfoundation/hardhat-toolbox");
require("hardhat-switch-network");
require("@nomicfoundation/hardhat-verify");
require('@kadena/hardhat-chainweb');
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

    chainweb: {
    hardhat: {
      chains: 2,
      chainwebChainIdOffset: 20,
    },
    sandbox: {
      type: 'external',
      chains: 5,
      accounts: devnetAccounts.accounts.map((account) => account.privateKey),
      chainIdOffset: 1789,
      chainwebChainIdOffset: 20,
      externalHostUrl: "http://localhost:1848/chainweb/0.0/evm-development/"

    },
    testnet: {
      type: 'external',
      chains: 5,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.FAUCET_PRIVATE_KEY],
      chainIdOffset: 1789,
      chainwebChainIdOffset: 20,
      externalHostUrl:
        "http://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet", 
    },
  },

 
  sourcify: {
    enabled: false,
  },
  etherscan: {
    apiKey: {
      sandbox20: "abc", // Any non-empty string works for Blockscout
      sandbox21: "abc",
      sandbox22: "abc",
      sandbox23: "abc",
      sandbox24: "abc",
    },
    customChains: [
      {
        network: "sandbox20",
        chainId: 1789,
        urls: {
          apiURL: "http://chain-20.evm.kadena.local:8000/api/",
          browserURL: "http://chain-20.evm.kadena.local:8000/"
        }
      },
      {
        network: "sandbox21",
        chainId: 1790,
        urls: {
          apiURL: "http://chain-21.evm.kadena.local:8000/api/",
          browserURL: "http://chain-21.evm.kadena.local:8000/"
        }
      },
      {
        network: "sandbox22",
        chainId: 1791,
        urls: {
          apiURL: "http://chain-22.evm.kadena.local:8000/api/",
          browserURL: "http://chain-22.evm.kadena.local:8000/"
        }
      },
      {
        network: "sandbox23",
        chainId: 1792,
        urls: {
          apiURL: "http://chain-23.evm.kadena.local:8000/api/",
          browserURL: "http://chain-23.evm.kadena.local:8000/"
        }
      },
      {
        network: "sandbox24",
        chainId: 1793,
        urls: {
          apiURL: "http://chain-24.evm.kadena.local:8000/api/",
          browserURL: "http://chain-24.evm.kadena.local:8000/"
        }
      },
    ]
  },
  mocha: {
    timeout: 300000
  }
};

