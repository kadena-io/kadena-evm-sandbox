import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-verify';
import '@kadena/hardhat-chainweb';
import { readFileSync } from 'fs';

const devnetAccounts: {
  accounts: Array<{ privateKey: string; address: string }>;
} = JSON.parse(readFileSync('./devnet-account.json', 'utf-8'));

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  defaultChainweb: 'devnet',
  chainweb: {
    hardhat: {
      chains: 2,
      chainwebChainIdOffset: 20,
      networkOptions: {
        allowUnlimitedContractSize: true,
      },
    },
    devnet: {
      chains: 5,
      type: 'external',
      chainwebChainIdOffset: 20,
      chainIdOffset: 1789,
      accounts: devnetAccounts.accounts.map((account) => account.privateKey),
      externalHostUrl: 'http://localhost:1848/chainweb/0.0/evm-development/',
    },
  },
};

export default config;
