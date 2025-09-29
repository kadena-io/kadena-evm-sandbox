import { createPublicClient, defineChain, http } from 'viem';

export type EVMChainId = '20' | '21' | '22' | '23' | '24';
export const EVMCHAINS: EVMChainId[] = ['20', '21', '22', '23', '24'];
const STARTBLOCKCHAINWEB = '5920';
const STARTCHAIN_ID = '20';

const createBlockChainId = (chainId: EVMChainId): number => {
  return parseInt(STARTBLOCKCHAINWEB, 10) + parseInt(chainId, 10) - parseInt(STARTCHAIN_ID, 10);
};

export const createServerUrl = (chainId: EVMChainId) => {
  return `http://localhost:1848/chainweb/0.0/evm-development/chain/${chainId}/evm/rpc`;
};

export const getChainwebEVMChain = (chainId: EVMChainId) => {
  return defineChain({
    id: createBlockChainId(chainId),

    name: 'Kadena Chainweb EVM',
    network: `kadena_${createBlockChainId(chainId)}`,
    nativeCurrency: {
      decimals: 18,
      name: 'KDA',
      symbol: 'KDA',
    },
    rpcUrls: {
      default: {
        http: [createServerUrl(chainId)],
      },
      public: {
        http: [createServerUrl(chainId)],
      },
    },
  });
};

export const getPublicClient = (chainId: EVMChainId) => {
  return createPublicClient({
    chain: getChainwebEVMChain(chainId),
    transport: http(createServerUrl(chainId)),
  });
};
