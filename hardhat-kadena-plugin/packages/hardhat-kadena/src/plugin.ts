import { extendEnvironment, extendConfig } from "hardhat/config";
import { ChainwebNetwork } from "./utils/chainweb.js";
import { ChainwebConfig, ChainwebPluginApi } from "./type.js";
import { getKadenaNetworks } from "./utils/configure.js";
import { createGraph } from "./utils/chainweb-graph.js";
import { getUtils } from "./utils.js";

extendConfig((config, userConfig) => {
  if (userConfig.chainweb.graph) {
    if (
      userConfig.chainweb.chains &&
      Object.keys(userConfig.chainweb.graph).length !=
        userConfig.chainweb.chains
    ) {
      throw new Error(
        "Number of chains in graph does not match the graph configuration"
      );
    }
    userConfig.chainweb.chains = Object.keys(userConfig.chainweb.graph).length;
  }

  const chainwebConfig: Required<ChainwebConfig> = {
    networkStem: "kadena_hardhat_",
    accounts: [],
    chains: 2,
    graph: userConfig.chainweb.graph ?? createGraph(userConfig.chainweb.chains),
    ...userConfig.chainweb,
  };
  config.chainweb = chainwebConfig;

  // add networks to hardhat
  config.networks = {
    ...config.networks,
    ...getKadenaNetworks({
      networkStem: chainwebConfig.networkStem,
      numberOfChains: chainwebConfig.chains,
      accounts: chainwebConfig.accounts,
    }),
  };
});

extendEnvironment((hre) => {
  const chainwebNetwork = new ChainwebNetwork({
    chainweb: hre.config.chainweb,
    networks: hre.config.networks,
  });

  let userCount = 0;

  async function startHardhatNetwork() {
    userCount += 1;
    if (userCount == 1) {
      await chainwebNetwork.start();
    }
  }

  let stopped = false;
  async function stopHardhatNetwork(force = false) {
    if (stopped) return;
    userCount -= 1;
    if (userCount == 0 || force) {
      const r = await chainwebNetwork.stop();
      stopped = true;
      return r;
    }
  }

  process.on("exit", () => stopHardhatNetwork(true));
  process.on("SIGINT", () => stopHardhatNetwork(true));
  process.on("SIGTERM", () => stopHardhatNetwork(true));
  process.on("uncaughtException", () => stopHardhatNetwork(true));

  console.log("Kadena plugin initialized chains", hre.config.chainweb.chains);
  const startNetwork = startHardhatNetwork()
    .then(() => true)
    .catch(() => {
      process.exit(1);
    });

  const utils = getUtils(hre);

  const api: ChainwebPluginApi = {
    isReady: () => startNetwork,
    withChainweb: () => {
      before(startHardhatNetwork);
      after(stopHardhatNetwork);
    },
    network: chainwebNetwork,
    deployContractOnChains: utils.deployContractOnChains,
    getProvider: (cid: number) => chainwebNetwork.getProvider(cid),
    requestSpvProof: utils.requestSpvProof,
    switchChain: async (cid: number) => {
      await startNetwork;
      await hre.switchNetwork(`${hre.config.chainweb.networkStem}${cid}`);
    },
    getChainIds: () =>
      new Array(hre.config.chainweb.chains).fill(0).map((_, i) => i),
    callChainIdContract: utils.callChainIdContract,
    createTamperedProof: utils.createTamperedProof,
    computeOriginHash: utils.computeOriginHash,
    deployMocks: utils.deployMocks,
  };

  hre.chainweb = api;
});
