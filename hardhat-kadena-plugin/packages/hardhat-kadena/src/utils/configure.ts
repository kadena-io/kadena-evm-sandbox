import { KadenaNetworkConfig } from "hardhat/types";

export const getKadenaNetworks = ({
  networkStem = "kadena_devnet_",
  chainIdOffset = 0,
  numberOfChains = 2,
  host = "http://localhost",
  portOffset = 8545,
  accounts = [] as string[],
}) => {
  const chainIds = new Array(numberOfChains)
    .fill(0)
    .map((_, i) => i + chainIdOffset);
  const networks = chainIds.reduce(
    (acc, chainId, index) => {
      acc[`${networkStem}${index}`] = {
        url: `${host}:${portOffset + index * 10}`,
        accounts,
        chainwebChainId: chainId,
        gas: "auto",
        gasPrice: "auto",
        gasMultiplier: 1,
        httpHeaders: {},
        timeout: 20000,
      };
      return acc;
    },
    {} as { [key: string]: KadenaNetworkConfig }
  );

  return networks;
};
