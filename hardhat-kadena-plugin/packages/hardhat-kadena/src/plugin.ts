import { extendEnvironment } from "hardhat/config";
import { ChainwebNetwork } from "./utils/chainweb.js";
import { ChainwebPluginApi } from "./type.js";
import { getKadenaNetworks } from "./utils/configure.js";
import { createGraph } from "./utils/chainweb-graph.js";
import { getUtils } from "./utils.js";

/* *************************************************************************** */
/* Network Interface */

extendEnvironment((hre) => {
  // TODO: create the graph based on the number of chains
  if (hre.config.chainweb.graph) {
    if (
      hre.config.chainweb.chains &&
      Object.keys(hre.config.chainweb.graph).length !=
        hre.config.chainweb.chains
    ) {
      throw new Error(
        "Number of chains in graph does not match the graph configuration"
      );
    }
    hre.config.chainweb.chains = Object.keys(hre.config.chainweb.graph).length;
  }
  const chainwebConfig = {
    networkStem: "kadena_hardhat_",
    accounts: [],
    chains: 2,
    graph: hre.config.chainweb.graph ?? createGraph(hre.config.chainweb.chains),
    ...hre.config.chainweb,
  };

  hre.config.chainweb = chainwebConfig;

  // add networks to hardhat
  hre.config.networks = {
    ...hre.config.networks,
    ...getKadenaNetworks({
      networkStem: chainwebConfig.networkStem,
      numberOfChains: chainwebConfig.chains,
      accounts: chainwebConfig.accounts,
    }),
  };

  const chainwebNetwork = new ChainwebNetwork({
    chainweb: chainwebConfig,
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
    network: chainwebNetwork,
    deployContractOnChains: utils.deployContractOnChains,
    getProvider: (cid: number) => chainwebNetwork.getProvider(cid),
    requestSpvProof: utils.requestSpvProof,
    switchChain: async (cid: number) => {
      await startNetwork;
      await hre.switchNetwork(`${chainwebConfig.networkStem}${cid}`);
    },
    getChainIds: () =>
      new Array(chainwebConfig.chains).fill(0).map((_, i) => i),
    callChainIdContract: utils.callChainIdContract,
    createTamperedProof: utils.createTamperedProof,
  };

  hre.chainweb = api;
});
