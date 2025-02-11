import { extendEnvironment } from "hardhat/config";
import { ChainwebNetwork } from "./utils/chainweb.js";

/* *************************************************************************** */
/* Network Interface */

extendEnvironment(async (hre) => {
  const utils = await import("./utils.js");
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

  async function stopHardhatNetwork() {
    userCount -= 1;
    if (userCount == 0) {
      const r = await chainwebNetwork.stop();
      return r;
    }
  }
  hre.chainweb = {
    startHardhatNetwork,
    stopHardhatNetwork,
    chainwebNetwork,
    utils,
  } as unknown as typeof hre.chainweb;
});
