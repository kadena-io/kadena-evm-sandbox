require("@nomicfoundation/hardhat-toolbox");
require('@kadena/hardhat-chainweb');
require('@kadena/hardhat-kadena-create2');
require("hardhat-switch-network");
require("@nomicfoundation/hardhat-verify");
require('dotenv').config();

const { readFileSync } = require("fs");

const devnetAccounts = JSON.parse(
  readFileSync("./devnet-accounts.json", "utf-8")
);


console.log("DEPLOYER_PRIVATE_KEY in hardhat config:", process.env.DEPLOYER_PRIVATE_KEY);
if (!process.env.DEPLOYER_PRIVATE_KEY) {
  throw new Error("DEPLOYER_PRIVATE_KEY is not set in .env");
}

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
      chainwebChainIdOffset: 20,
    },
    sandbox: {
      type: 'external',
      chains: 5,
      accounts: devnetAccounts.accounts.map((account) => account.privateKey),
      chainIdOffset: 1789,
      chainwebChainIdOffset: 20,
      externalHostUrl: "http://localhost:1848/chainweb/0.0/evm-development",
      etherscan: {
        apiKey: 'abc', // Any non-empty string works for Blockscout
        apiURLTemplate: 'http://chain-{cid}.evm.kadena.internal:8000/api/',
        browserURLTemplate: 'http://chain-{cid}.evm.kadena.internal:8000/',
      },
    },
    testnet: {
      type: 'external',
      chains: 5,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainIdOffset: 5920,
      chainwebChainIdOffset: 20,
      externalHostUrl:
        "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet",
      etherscan: {
        apiKey: 'abc', // Any non-empty string works for Blockscout
        apiURLTemplate: "http://chain-{cid}.evm-testnet-blockscout.chainweb.com/api/",
        browserURLTemplate: "http://chain-{cid}.evm-testnet-blockscout.chainweb.com"
      },
    },
  },
  networks: {
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    }
  },
  mocha: {
    timeout: 300000
  }

};
