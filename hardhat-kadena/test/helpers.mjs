import { resetHardhatContext } from "hardhat/plugins-testing.js";
import path from "path";
const __dirname = path.resolve();

export function useEnvironment(fixtureProjectName) {

  before("Loading hardhat environment", async function () {
    console.log("Setting up hardhat")
    process.chdir(path.join(__dirname, 'test', fixtureProjectName));
    console.log("Setting up hardhat environment in ", process.cwd())

    this.hre = (await import("hardhat")).default;
    console.log(this.hre);
    this.hre.run('test');

    // const { startHardhatNetwork, stopHardhatNetwork } = import('../src/index.mjs');
    console.log("Starting network")

    // await startHardhatNetwork()
  });

  after("Resetting hardhat", async function () {
    // await stopHardhatNetwork()
    resetHardhatContext();
  });
}

