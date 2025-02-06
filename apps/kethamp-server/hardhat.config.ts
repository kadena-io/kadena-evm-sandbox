import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-watcher";
import "hardhat-switch-network";
import { accounts } from "./accounts.json";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  watcher: {
    test: {
      tasks: [{ command: "test", params: ["test/*.specs.ts"] }],
      files: ["./contracts/**/*", "./test/**/*.specs.ts"],
      verbose: true,
      clearOnStart: true,
    },
    int: {
      tasks: [
        { command: "test", params: { testFiles: ["test/KDA.integration.ts"] } },
      ],
      files: ["./contracts/**/*", "./test/**/*.integration.ts"],
      verbose: true,
      clearOnStart: true,
    },
  },
  networks: {
    kadena_devnet1: {
      url: "http://localhost:8545",
      chainId: 1789,
      accounts: accounts.map(({ privateKey }) => privateKey),
    },
    kadena_devnet2: {
      url: "http://localhost:8555",
      chainId: 1790,
      accounts: accounts.map(({ privateKey }) => privateKey),
    },
  },
};

export default config;
