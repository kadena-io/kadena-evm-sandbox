import {
  HardhatNetworkAccountsConfig,
  HardhatNetworkConfig,
  KadenaNetworkConfig,
} from "hardhat/types";

interface INetworkOptions {
  hardhatNetwork: HardhatNetworkConfig;
  networkStem?: string | undefined;
  chainIdOffset?: number | undefined;
  numberOfChains?: number | undefined;
  accounts?: HardhatNetworkAccountsConfig | undefined;
  loggingEnabled?: boolean | undefined;
}

export const getKadenaNetworks = ({
  hardhatNetwork,
  networkStem = "kadena_devnet_",
  chainIdOffset = 0,
  numberOfChains = 2,
  accounts,
  loggingEnabled = false,
}: INetworkOptions): Record<string, KadenaNetworkConfig> => {
  const chainIds = new Array(numberOfChains)
    .fill(0)
    .map((_, i) => i + chainIdOffset);
  const networks = chainIds.reduce(
    (acc, chainId, index) => {
      const networkConfig: KadenaNetworkConfig = {
        ...hardhatNetwork,
        chainId: 676000 + chainId,
        chainwebChainId: chainId,
        accounts: accounts ?? hardhatNetwork.accounts,
        loggingEnabled,
      } as KadenaNetworkConfig;
      acc[`${networkStem}${index}`] = networkConfig;
      return acc;
    },
    {} as Record<string, KadenaNetworkConfig>
  );

  return networks;
};
