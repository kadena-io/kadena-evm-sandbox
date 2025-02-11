// require("@nomicfoundation/hardhat-toolbox");
// require("../../src/index.mjs");

const path = require("path");
const fs = require("fs");

// Read and parse the accounts file
const devnetAccountsPath = path.join(__dirname, 'devnet-accounts.json');
const devnetAccountsFile = fs.readFileSync(devnetAccountsPath, 'utf8');
const devnetAccounts = JSON.parse(devnetAccountsFile);

// Validate account configuration
const requiredAccounts = 20;
if (devnetAccounts.accounts.length !== requiredAccounts) {
  throw new Error(`Expected ${requiredAccounts} accounts in devnet-accounts.json, found ${devnetAccounts.accounts.length}`);
};

console.log("Adding Extension");

extendEnvironment((hre) => {
  if (hre.config.chainweb === undefined) {
    console.log("extend hre");
  }
});

task('test')
  .addFlag("chainweb", "Run the hardhat chainweb network")
  .setAction(async function (args, hre, runSuper) {
    console.log(args);
    if (args.chainweb) {
      console.log("TODO: start chainweb");
    }
    try {
      if  (runSuper.isDefined) {
        console.log("calling test super");
        return await runSuper()
      }
    } finally {
      if (args.chainweb) {
        console.log("TODO: stop chainweb");
      }
    }
  });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
    ]
  },
  networks: {
    // this will be used by the external hardhat processes. Note that the
    // chainId is the same for all those networks.
    hardhat: {
      chainId: 1789,
      accounts: devnetAccounts.accounts.map(account => {
        return { privateKey: account.privateKey, balance: "1000000000000000000000" }
      }),
    },
    kovan: {
      url:
    }
  },

  // providing --chainweb=... will enable the respective chainweb
  // network names are automatically qualified and picked from the respective
  // chainweb. Hardhat will also run the respective hardhat chainweb network in the
  // background.
  //
  // Other networks are still available and can be enabled via the switchNetwork
  // command with a single parameter. Chainweb chains are selected by using two
  // parameters.
  //
  // switchChain({network: 'evm_devnet', chain : '0'})
  // switchChain({network :'kovan'})
  //
  kadena: {
    // Kadena hardhat chainweb
    // For non-evm chains use null
    kadena: {
      chainweb: {
        0: {
          adjacents: [1],
          // port: '9545',
        },
        1: {
          adjacents: [0],
          // port: '9555',
        }
      },
    },
    // Kadena evm devnet
    // For non-evm chains use null
    evm_devnet: {
      type: 'external',
      chainweb: {
        0: {
          adjacents: [1],
          url: 'http://localhost:8545',
          chainId: 1789,
          accounts: devnetAccounts.accounts.map(account => account.privateKey),
          chainwebChainId: 0,
        },
        1: {
          adjacents: [0],
          port: '9555',
          url: 'http://localhost:8555',
          chainId: 1790,
          accounts: devnetAccounts.accounts.map(account => account.privateKey),
          chainwebChainId: 1,
        }
      },
    },
  },
  mocha: {
    timeout: 300000
  }
};

