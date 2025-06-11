require("@nomicfoundation/hardhat-toolbox");
require('@kadena/hardhat-chainweb');
require("hardhat-switch-network");
require("@nomicfoundation/hardhat-verify");

const { readFileSync } = require("fs");

const devnetAccounts = JSON.parse(
  readFileSync("./devnet-accounts.json", "utf-8")
);



/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      evmVersion: "prague",
    },
  },
  chainweb: {
    hardhat: {
      chains: 5,
    },
    sandbox: {
      type: 'external',
      chains: 5,
      accounts: devnetAccounts.accounts.map((account) => account.privateKey),
      chainIdOffset: 1789,
      chainwebChainIdOffset: 20,
      externalHostUrl: "http://localhost:1848/chainweb/0.0/evm-development/"

    },
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
