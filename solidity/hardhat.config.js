require('@nomicfoundation/hardhat-toolbox');
require('hardhat-switch-network');
require('@nomicfoundation/hardhat-verify');
require('@kadena/hardhat-chainweb');
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
      chains: 2,
    },
    devnet: {
      type: 'external',
      chains: 2,
      accounts: devnetAccounts.accounts.map((account) => account.privateKey),
      chainIdOffset: 1789,
      chainwebChainIdOffset: 0, // needs to be changed for multi-chain devnet
      externalHostUrl:
        "https://evm-devnet.kadena.network/chainweb/0.0/evm-development",
    },
     sandbox: {
      type: 'external',
      chains: 1,
      accounts: devnetAccounts.accounts.map((account) => account.privateKey),
      chainIdOffset: 1789,
      chainwebChainIdOffset: 0, // needs to be changed for multi-chain sandbox
      externalHostUrl:
        "http://localhost:8545",
    },
  },
  mocha: {
    timeout: 300000
  }
};