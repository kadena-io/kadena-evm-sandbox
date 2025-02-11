import "hardhat/types";
import { ChainwebNetwork } from "./utils/chainweb";

export interface ChainwebConfig {
  graph: { [key: number]: number[] };
}

declare module "hardhat/types" {
  interface HardhatConfig {
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
    chainweb: {
      startHardhatNetwork: () => Promise<void>;
      stopHardhatNetwork: () => Promise<void>;
      chainwebNetwork: ChainwebNetwork;
    };
  }
}
