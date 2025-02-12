import "hardhat/types";
import type { ChainwebNetwork, Origin } from "./utils/chainweb";
import type { JsonRpcProvider } from "ethers";
import type { DeployContractOnChains } from "./utils";

export interface ChainwebConfig {
  networkStem?: string;
  accounts?: string[];
  chains?: number;
  graph?: { [key: number]: number[] };
}

export interface ChainwebPluginApi {
  network: ChainwebNetwork;
  getProvider: (cid: number) => JsonRpcProvider;
  requestSpvProof: (targetChain: number, origin: Origin) => Promise<string>;
  switchChain: (cid: number) => Promise<void>;
  getChainIds: () => number[];
  callChainIdContract: () => Promise<number>;
  deployContractOnChains: DeployContractOnChains;
  createTamperedProof: (targetChain: number, origin: Origin) => Promise<string>;
  computeOriginHash: (origin: Origin) => string;
  deployMocks: () => ReturnType<DeployContractOnChains>;
}

declare module "hardhat/types" {
  interface HardhatConfig {
    chainweb: Required<ChainwebConfig>;
  }

  interface HardhatUserConfig {
    chainweb: ChainwebConfig;
  }
  interface HardhatNetworkConfig {
    chainwebChainId?: number;
  }

  interface HttpNetworkConfig {
    chainwebChainId?: number;
  }

  interface KadenaNetworkConfig extends HttpNetworkConfig {
    chainwebChainId: number;
  }
  interface HardhatRuntimeEnvironment {
    chainweb: ChainwebPluginApi;
  }
}
