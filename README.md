---
title: Chainweb EVM preview
description: "Become a Chainweb node operator to support the Kadena network infrastructure."
id: howto-evm
sidebar_position: 2
tags: [pact, chainweb, network, node operator]
---

# Kadena Chainweb EVM Sandbox

This repository presents a preview of the support for the Ethereum Virtual Machine (EVM) execution environment running on [Chainweb nodes](<(https://kadena.io/chainweb)>) in the
[Kadena](https://kadena.io) blockchain.
This preview demonstrates how to set up EVM-compatible nodes and execute cross-chain transactions to transfer assets from one chain to another.
In the preview, there are two EVM-compatible chains and a Solidity contract that demonstrates transferring tokens between the two EVM chains.
The preview is the first step toward an integrated and feature-rich multi-chain proof-of-work consensus network for Solidity and Pact developers to deploy smart contracts.

## What's included in the preview

With the preview, you can set up a local Kadena **development network** that runs a single **Chainweb node** and a single **mining client**.
The development network consists of twenty (20) chains with two chains that use EVM as the payload provider for processing transactions.
Because the development network is intended for demonstration purposes, proof-of-work consensus is disabled and blocks are produced at a constant rate of two seconds per chain, or ten blocks per second across the whole network.

The repository for the preview includes the following directories and components:

| Name            | What it provides                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| allocations     | Files to set up an ethers project that describes a set of BIP-44 wallets and allocations to be created in the genesis block for the development network.                                                                          |
| apps | Files to set up the contract, server, and front-end application that demonstrates cross-chain transactions.|
| blockscout      | Files to set up an optional block explorer for the EVM chains in the development network. [Blockscout](https://www.blockscout.com/) instances provide an explorer interface and API similar to [Etherscan](https://etherscan.io). |
| devnet          | A Docker compose project and files to set up the Chainweb node for the development network.                                                                                                                                       |
| docs | Technical documentation about the functions and events proposed for the Kadena Chainweb EVM cross-chain bridging protocol in draft form.|
| docker-bake.hcl | A script to build multi-platform images for the development network Docker compose project.                                                                                                                                       |
| network         | An optional command-line program for managing and monitoring the development network in the Kadena Chainweb EVM sandbox.                                                                                                          |
| solidity        | A Hardhat project that demonstrates the implementation of a simple ERC-20 token with support for burn and mint style transfers between the two EVM chains in the network.                                                         |

## Prerequisites and system requirements

Before you set up the preview development environment, verify that your local computer has the required tools installed and meets the following basic requirements:

- You must have [Docker](https://www.docker.com) and [Docker Compose](https://docs.docker.com/compose/) or an Open Container Initiative (OCI) compliant alternative.
- You must have at least 4 CPU cores and 8 GB of memory available for Docker.
  You can configure CPU and memory for Docker using command-line options or Resource settings.
- You must have a network connection to download the container images for the development network.
- You must have a POSIX-compliant terminal shell for running command-line programs and scripts.
- You should have `bash` and [jq](https://jqlang.org) programs installed.
- You must have JavaScript tooling installed, including [Node.js](https://nodejs.org) version `v22`, the [npm](https://www.npmjs.com) or [yarn](https://yarnpkg.com/) package manager, and [npx](https://docs.npmjs.com/cli/v8/commands/npx) to deploy Solidity contracts with Hardhat.
- You must have at least 6 CPU cores and 12 GB of memory available for Docker to run the Blockscout block explorer:.

## Quick start

To download and install the Chainweb EVM preview:

1. Open a terminal shell on your computer.

1. Clone the [kadena-evm-sandbox](https://github.com/kadena-io/kadena-evm-sandbox) repository by running the following command:

   ```sh
   git clone https://github.com/kadena-io/kadena-evm-sandbox
   ```

1. Change to the `kadena-evm-sandbox` directory by running the following command:

   ```sh
   cd kadena-evm-sandbox
   ```

   The kadena-evm-sandbox directory includes the `network` command-line program that you can use to perform common tasks to manage and monitor the development network.
   The `network` program supports many commands that are similar to Docker commands.
   You can explore all of the commands available by running the following command:

   ```sh
   ./network help
   ```

1. Pull the latest container images using the `network` command-line program by running the following command:

   ```sh
   ./network devnet pull
   ```

   You can execute `network` commands for convenience or use `docker` commands directly.
   Pulling the latest container images isn't strictly required, but it's recommended before you start the development network for the first time.

1. Start the network by running the following command:

   ```sh
   ./network devnet start
   ```

   This command starts the development blockchain and allocates the test account addresses. You should see output similar to the following excerpt:

   ```sh
   [+] Building 0.0s (0/0)                                    docker:desktop-linux
   WARN[0000] config `uid`, `gid` and `mode` are not supported, they will be ignored
   WARN[0000] config `uid`, `gid` and `mode` are not supported, they will be ignored
   [+] Running 7/0
    ✔ Network evm-devnet_default                    Created                   0.0s
   [+] Running 10/10vnet_chainweb-evm-chain1_data"  Created                   0.0s
    ✔ Network evm-devnet_default                    Created                   0.0s
    ✔ Volume "evm-devnet_chainweb-evm-chain1_data"  Created                   0.0s
    ✔ Volume "evm-devnet_chainweb-node_data"        Created                   0.0s
    ✔ Volume "evm-devnet_chainweb-evm-chain0_data"  Created                   0.0s
    ✔ Volume "evm-devnet_logs"                      Created                   0.0s
    ✔ Container chainweb-evm-chain0                 Started                   0.0s
    ✔ Container chainweb-evm-chain1                 Started                   0.0s
    ✔ Container evm-devnet-allocations-1            Started                   0.0s  ✔ Container chainweb-node                       Healthy                   0.0s
    ✔ Container chainweb-miner                      Started                   0.0s
   [+] Building 0.0s (0/0)                                    docker:desktop-linux
   [+] Creating 1/0
    ✔ Container chainweb-evm-chain0  Runni...                                 0.0s
   [+] Building 0.0s (0/0)                                    docker:desktop-linux
   wallets created: {
     alloc0: {
       address: '0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6',
       privateKey: '0xe711c50150f500fdebec57e5c299518c2f7b36271c138c55759e5b4515dc7161'
     },
     alloc1: {
       address: '0xFB8Fb7f9bdc8951040a6D195764905138F7462Ed',
       privateKey: '0xb332ddc4e0801582e154d10cad8b672665656cbf0097f2b47483c0cfe3261299'
     },
   ...
   ```

1. Check that blocks are being produced by running the following command:

   ```sh
   ./network devnet status
   ```

   This command displays the current block height and cut height for the development network with output similar to the following excerpt:

   ```sh
   chain        height  hash                                         type     provider_uri
   0            419     M2dz1VGo57pBmz3uu6_UfSQzPKV-hNCof67DisKMP4U  evm      http://chainweb-evm-chain-0:8551
   1            419     H90LOcK87or835VrvA117ASvVpCqPcbgKrazmdyK39I  evm      http://chainweb-evm-chain-1:8551
   2            419     8NoDoY3XsxbmuB7f_gLPrAe6vx4oO3wqoLL3myFIUxA  default  --
   3            419     gK8sEC-u5jhDcvZGoVXkvF4MYYm7FHNjI2znVxjIh5Y  default  --
   ...
   16           419     u_tlyaHhLMVUyKgMLT6pLxR6AEuXpdGSur45VEI7yRo  default  --
   17           419     vj-YslrAQ6iEaMpDg-P_5CuFl8I6h14n5rtzhLGVEQc  default  --
   18           418     B7AeeaCdNUpJPmsLV2KuSQU4nBeys598b4vJQKP_PX0  default  --
   19           419     381L-CZK2CEaLrGLmaDjP3q8c2Q4eIue4kzuZTZghdE  default  --
   cut-height:  8382
   ```

   You can call the `./network devnet status` command repeatedly to verify that the block height and cut height values are increasing.
   This can also be viewed at http://localhost:1848/chainweb/0.0/evm-development/cut

   The network takes about 10 minutes to mine the first block for each chain 
   after genesis

2. You can now go to http://localhost:1848 to view the Chainweb service API for the development network.

### Test the simple token contract

To test the simple token contract:

1. Install Hardhat and related dependencies in the development network by running the following command:

   ```sh
   ./network solidity setup
   ```

   If the `npm` package manager reports any issues, address them before continuing to the next step.
   For example, you might be prompted to `run npm audit fix` to address issues.

1. Test the simple token contract by running the following command:

   ```sh
   ./network solidity test
   ```

   This command executes a set of tests that deploy the ERC-20 token contract and check that token transfer operations succeed or revert as expected when tokens are transferred between addresses on the two Chainweb EVM chains.
   For example, you should see output similar to the following excerpt:

   ```sh
   ...
   Found 2 Kadena devnet networks while deploying mocks: kadena_devnet0, kadena_devnet1
   Deploying with signer: 0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6 on network kadena_devnet0
   Deploying with signer: 0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6 on network kadena_devnet1
   Authorizing 0:0xf094D31A7E0DeE4907f995551325296D511C7Eb6 for 0:0xf094D31A7E0DeE4907f995551325296D511C7Eb6
   Authorizing 1:0x57D6A7144FD613BE8Cf2012f196B70ae00D39076 for 0:0xf094D31A7E0DeE4907f995551325296D511C7Eb6
   Authorizing 0:0xf094D31A7E0DeE4907f995551325296D511C7Eb6 for 1:0x57D6A7144FD613BE8Cf2012f196B70ae00D39076
   Authorizing 1:0x57D6A7144FD613BE8Cf2012f196B70ae00D39076 for 1:0x57D6A7144FD613BE8Cf2012f196B70ae00D39076
           ✔ Should revert if redeeming for wrong operation type (2110ms)
       getChainwebChainId
         Success Test Cases
   Found 2 Kadena devnet networks: kadena_devnet0, kadena_devnet1
   Deploying with signer: 0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6 on network kadena_devnet0
   Deploying with signer: 0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6 on network kadena_devnet1
           ✔ Should return the correct chainweb chain id
       getCrossChainAddress
         Success Test Cases
   Found 2 Kadena devnet networks: kadena_devnet0, kadena_devnet1
   Deploying with signer: 0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6 on network kadena_devnet0
   Deploying with signer: 0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6 on network kadena_devnet1
           ✔ Should return the correct cross chain address (5634ms)
   ...
   ```

### Restarting the development network

If the development network stops producing blocks or seems stuck, you can restart the chainweb-node service without stopping or restarting other network components.

To restart the development network:

```sh
./network devnet restart
```

### Stopping the development network

When you're finished testing, you can shut down the development network, remove all containers, and reset the database to a clean state.

To shut down the network and remove containers:

```sh
./network devnet stop
```

## The example solidity project

## Using the local development network

The `solidity` directory provides an example of a simple Hardhat project with a Hardhat configuration file, Solidity smart contract, and test files. This project als has the `@kadena/hardhat-chainweb` and `@kadena/hardhat-kadena-create2` Harhat V2 plugins configured. The `@kadena/hardhat-chainweb` plugin simulates Kadena Chainweb EVM's multi-chain enivornment so that you can develop in Hardhat V2 and later deploy to testnet and mainnet, as you would with any other EVM chain. The plugin also supports configuration for smart contract verification and for deploying to chains that would normally be configured as external networks in Hardhat. This local development network (sandbox) is configured to represent those external Chainweb EVM chains but with pre-allocated developer accounts. The `@kadena/hardhat-kadena-create2` provides functionality for deterministic deployment. This makes it easy to deploy a smart contract to all chains with the same address.

The `solidity` project includes the following files to configure the Chainweb EVM development network:

- The `solidity/devnet-accounts.json` file contains all of the account information generated from a test BIP-44 wallet using a seed entropy value of `0x0000 0000 0000 0000 0000 0000 0000 0000` (16 zero bytes).
- The `solidity/hardhat.config.js` file reads the account information from the `solidity/devnet-accounts.json` file for the sandbox (local development network) configuration.
- The `solidity/hardhat.config.js` file is configured to use the `@kadena/hardhat-chainweb` and `@kadena/hardhat-kadena-create2` Harhat V2 plugins.


You can run the example deployment scripts against the local development network using the following npm scripts to deploy the SimpleToken contract

```sh
npm run deploy sandbox

```

To deploy detemrinistcially using CREATE2, run

```sh
npm run deploy-create2 sandbox

```

### Using Hardhat V2
You can also simply develop, test, and run deploy scripts against Hardhat V2 the way soldidity development normally happens. The `@kadena/hardhat-chainweb` and `@kadena/hardhat-kadena-create2` Harhat V2 plugins enable this. The `@kadena/hardhat-chainweb` simulates the Kadena Chainweb EVM multi-chain environment in Hardhat.

To run the unit tests included in the example project, simply run the standard

```sh
npx hardhat test
```
or the npm script

``` sh
npm run test

```

You can deploy the SimpleToken contract to the internal Hardhat network by running 

```sh
npm run deploy:hardhat

```

or for deterministic deployment

```sh
npm run deploy-create2:hardhat
```

You can also start up a separate Hardhat node using the standard command

```sh
npx hardhat node

```

and then in another terminal run

```sh
npm run deploy localhost

```

or for deterministic deployment

``` sh
npm run deploy-create2 localhost

```
### Deploying to testnet
Hardhat and the local development network (sadbox) have pre-allocated developer accounts to make it easy for developers to develop, unit test, and test deployment scripts. 
To deploy to testnet, you should use your own deployer account. You can get testnet KDA from the EVM Faucet in the [Kadena Developer Tools](https://tools.kadena.io/) website.

Next, copy the `.env.example` file:

```sh
cp .env.example .env

```

Then change the default `DEPLOYER_PRIVATE_KEY` to your own deployer account private key.

After that, run either

```sh
npm run deploy testnet

```

or 

```sh
npm run deploy-create2 testnet

```
to deploy deterministically using the CREATE2 opcode. The Kadena Hardhat Create2 [plugin](https://www.npmjs.com/package/@kadena/hardhat-kadena-create2) handles this by deploying a CREATE2 factory for you.

Note about deterministic deployment: If you run it multiple times against a persistent blockchain like the local development network or testnet (as opposed to the internal Hardhat node), you will need to change the salt in `solidity/scripts/deploy-using-create2.js`. Otherwise, you will get a message saying the contract has already been 
deployed.

### Modifying your Hardhat project
If you want to experiment with using the Kadena Chainweb EVM development network and plugins with your own Hardhat project, you must configure the Hardhat project to connect to the Chainweb EVM development network.
You must also configure the Hardhat project to include account information — addresses and balances - for all available accounts.
The example project in the `solidity` directory provides an example of a simple Hardhat project with a Hardhat configuration file, Solidity smart contract, and test files. This project also has the `@kadena/hardhat-chainweb` and `@kadena/hardhat-kadena-create2` Harhat V2 plugins configured. The `@kadena/hardhat-chainweb` plugin simulates Kadena Chainweb EVM's multi-chain enivornment so that you can develop in Hardhat V2 and later deploy to testnet and mainnet, as you would with any other EVM chain. You will need to install the plugins into your own project using `npm`, `yarn` or whichever package manager you normally use.


To integrate your project with the Kadena Chainweb EVM development network and plugins:

1. Copy the `solidity/devnet-accounts.json` file into the root directory of your Hardhat project.
2. Open the `hardhat.config.js` file for your Hardhat project in your code editor.
3. Copy and paste the code to read account information from the `solidity/hardhat.config.js` file into the `hardhat.config.js` file for your project. Make sure that all of these packages are installed.

   For example:

   ```javascript
    require("@nomicfoundation/hardhat-toolbox");
    require('@kadena/hardhat-chainweb');
    require('@kadena/hardhat-kadena-create2');
    require("hardhat-switch-network");
    require("@nomicfoundation/hardhat-verify");

    const { readFileSync } = require("fs");

    const devnetAccounts = JSON.parse(
      readFileSync("./devnet-accounts.json", "utf-8")
    );

   ```
   and include 

  ```javascript
    accounts: devnetAccounts.accounts.map((account) => account.privateKey),

  ```
  in your Chainweb configuration.

4. Copy and paste the code to configure Chainweb information from the `solidity/hardhat.config.js` file into the `hardhat.config.js` file for your project.

   For example:

```javascript
  chainweb: {
    hardhat: {
      chains: 5,
      chainwebChainIdOffset: 20,
    },
    sandbox: {
      type: 'external',
      chains: 5,
      accounts: devnetAccounts.accounts.map((account) => account.privateKey),
      chainIdOffset: 1789,
      chainwebChainIdOffset: 20,
      externalHostUrl: "http://localhost:1848/chainweb/0.0/evm-development",
    },
    testnet: {
      type: 'external',
      chains: 5,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainIdOffset: 5920,
      chainwebChainIdOffset: 20,
      externalHostUrl:
        "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet",
    },
  },

```
  

5. (Optional) Copy and paste the code to configure etherscan settings from the `solidity/hardhat.config.js` file into the Chainweb configuration in your `hardhat.config.js` file for your project.

   For example:

  
```javascript
etherscan: {
  apiKey: 'abc', // Any non-empty string works for Blockscout
  apiURLTemplate: 'http://chain-{cid}.evm.kadena.internal:8000/api/',
  browserURLTemplate: 'http://chain-{cid}.evm.kadena.internal:8000/',
},

``` 

The full config looks like this for the local development network

```javascript
 sandbox: {
      type: 'external',
      chains: 5,
      accounts: devnetAccounts.accounts.map((account) => account.privateKey),
      chainIdOffset: 1789,
      chainwebChainIdOffset: 20,
      externalHostUrl: "http://localhost:1848/chainweb/0.0/evm-development",
      etherscan: {
        apiKey: 'abc', // Any non-empty string works for Blockscout
        apiURLTemplate: 'http://chain-{cid}.evm.kadena.internal:8000/api/',
        browserURLTemplate: 'http://chain-{cid}.evm.kadena.internal:8000/',
      },
    },

```
or this for just Hardhat

```javascript 
 chainweb: {
    hardhat: {
      chains: 5,
      chainwebChainIdOffset: 20,
    },
 }

```
6. Save your changes and close the `hardhat.config.js` file.

### Compiling and testing integration

After configuring your Hardhat project to use the Chainweb EVM development environment, you can compile, test, and deploy the project using standard `hardhat` commands.
For example, compile the project by running the following command:

```sh
npx hardhat compile
```

Run unit tests using the standard `hardhat test` command:

```sh
npx hardhat test
```

Similarly, if you have a `deploy.js` deployment script in a `scripts` directory, you can deploy the project using the standard `hardhat` command to run scripts:

```sh
npx hardhat run scripts/deploy.js
```
can also be used.

The commands above will all run against Hardhat.
You can create npm scripts similar to the ones in `solidity/package.json` for deploying to other networks like the sandbox or testnet.


## Plugins
For more information and more examples of using this plugin, which was created to allow interaction with multiple Chainweb chains, see the Kadena Hardhat Chainweb [plugin](https://www.npmjs.com/package/@kadena/hardhat-chainweb).

To do deterministic deployment to Kadena Chainweb EVM chains, use the Kadena Hardhat Create2 [plugin](https://www.npmjs.com/package/@kadena/hardhat-kadena-create2).

## Signing transactions and switching chains

By default, when you call a Solidity smart contract from a test file or a script using `ethers`, the transaction is executed by the first signer address and private key for the local development environment.
This is the true whether the local development environment is the default Hardhat network or the Kadena development network.
For example, the following `transferCrossChain` transaction is signed by the account that corresponds to the first address in the list of addresses for the current network context:

```javascript
const tx = await token0.transferCrossChain(
  receiver.address,
  amount,
  token1Info.chain
);
```

This address is the `msg.sender` for the transaction.

In the test files in the `solidity/test` directory, this address is to the **deploying signer** you see displayed when you execute the tests:

This deploying signer is simply the first signer retrieved by the `getSigners` function in the `solidity/test/utils/utils.js` file.

Typically, if you wanted to call a smart contract function using a different signer—for example, `alice`—you could call the function like this:

```javascript
const tx = await token0
  .connect(alice)
  .transferCrossChain(receiver.address, amount, token1Info.chain);
```

Normally when using Hardhat ethers in tests, the call creates a new contract instance using the new signer `alice` in the background. A signer always has a network context associated with it. If you want to call a contract running in Chainweb EVM, you must be aware of the Chainweb chain you are on in order to get the correct signing address.

` await chainweb.switchChain(chainId);`

must be called in order to switch to the correct chain and get the signers with the correct network context for that chain. 

If you use the `@kadena/hardhat-chainweb` `runOverChains` function, the chain switching will be done for you.

You can find examples of switching chains in the `solidity/test/SimpleToken.test.js` and  `solidity/test/SimpleToken.integration.test.js` test files.

## Blockscout

You can explore the Chainweb EVM development network chains using the optional [Blockscout](https://blockscout.com). Blockscout is a blockchain monitor that provides a user experience that is similar to [Etherscan](https://etherscan.io).
For additional information, see the [Blockscout README](https://github.com/blockscout/blockscout).

To use Blockscout:

1. Open a terminal shell and change to the `kadena-evm-sandbox` directory, if needed:

1. Pull the latest images by running the following command:

   ```sh
   ./network blockscout pull
   ```

2. Add blockscout domains to the host file:

   ```sh
   ./network blockscout add-domains
   ```

   This will add the following records to /etc/host 

   - 127.0.0.1       chain-20.evm.kadena.local
   - 127.0.0.1       chain-21.evm.kadena.local
   - 127.0.0.1       chain-22.evm.kadena.local
   - 127.0.0.1       chain-23.evm.kadena.local
   - 127.0.0.1       chain-24.evm.kadena.local

3. Start a Blockscout instance by running the following command:

   ```sh
   ./network blockscout start
   ```

   After running this command, it can take several minutes before you can open Blockscout in a browser.

4. Open the appropriate URL for the chain you want to explore:

   ```sh
   chain 20: http://chain-20.evm.kadena.local:8000
   chain 21: http://chain-21.evm.kadena.local:8000
   chain 22: http://chain-22.evm.kadena.local:8000
   chain 23: http://chain-23.evm.kadena.local:8000
   chain 24: http://chain-24.evm.kadena.local:8000
   ```

   The Blockscout UIs for the EVM chains are available at the following URLs.

   - [Chainweb EVM chain 20](http://chain-20.evm.kadena.local:8000)
   - [Chainweb EVM chain 21](http://chain-21.evm.kadena.local:8000)
   - [Chainweb EVM chain 22](http://chain-22.evm.kadena.local:8000)
   - [Chainweb EVM chain 23](http://chain-23.evm.kadena.local:8000)
   - [Chainweb EVM chain 24](http://chain-24.evm.kadena.local:8000)

## Network components and chain specifications

- `chainweb-node`
  - software: [chainweb-node](https://github.com/kadena-io/chainweb-node/tree/lars/pp/evm)
  - exported ports: 1848 (Chainweb service API)
- `chainweb-miner`
  - software: [chainweb-mining-client]https://github.com/kadena-io/chainweb-mining-client)
  - worker: constant-delay with a 2s rate per chain
- `chainweb-evm-chain0`
  - software: [kadena-reth](https://github.com/kadena-io/kadena-reth)
  - exported ports: 8545 (HTTP ETH RPC), 8546 (Websocket ETH RPC)
  - Chainweb chain-id: 0
  - Ethereum chain-id: 1789
  - chain specification: `./devnet/config/chainweb-chain0-spec.json`
- `chainweb-evm-chain1`
  - software: [kadena-reth](https://github.com/kadena-io/kadena-reth)
  - exported ports: 8555 (HTTP ETH RPC), 8556 (Websocket ETH RPC)
  - Chainweb chain-id: 1
  - Ethereum chain-id: 1790
  - chain specification: `./devnet/config/chainweb-chain1-spec.json`

## Account allocations in the development network

The chain specifications include the initial account allocations for the genesis block.
All of the initial accounts are generated from a BIP-44 wallet using a seed entropy value of `0x0000 0000 0000 0000 0000 0000 0000 0000` (16 zero bytes).
You can view details about how the wallet is generated in the `allocations/wallet.mjs` file.

You can view the addresses, private keys, and starting balances by running the following command:

```sh
./network devnet allocations
```

The allocations in the genesis block use the following path values:

- `m/44'/1'/0'/0/0` (address: 0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6)
- `m/44'/1'/0'/0/1` (address: 0xFB8Fb7f9bdc8951040a6D195764905138F7462Ed)
- `m/44'/1'/0'/0/2` (address: 0x28f2d8ef4e0fe6B2E945cF5C33a0118a30a62354)
- `m/44'/1'/0'/0/3` (address: 0xa24a79678c9fffEF3E9A1f3cb7e51f88F173B3D5)
- `m/44'/1'/0'/0/4` (address: 0x47fAE86F6416e6115a80635238AFd2F18D69926B)
- `m/44'/1'/0'/0/5` (address: 0x87466A8266b9DFB3Dc9180a9c43946c4AB2c2cb2)
- `m/44'/1'/0'/0/6` (address: 0xA310Df9740eb6CC2F5E41C59C87e339142834eA4)
- `m/44'/1'/0'/0/7` (address: 0xD4EECE51cf451b60F59b271c5a748A8a9F16bC01)
- `m/44'/1'/0'/0/8` (address: 0xE08643a1C4786b573d739625FD268732dBB3d033)
- `m/44'/1'/0'/0/9` (address: 0x33018A42499f10B54d9dBCeBB71831C805D64cE3)
- `m/44'/1'/0'/0/10` (address: 0xa3659D39C901d5985450eE18a63B5b0811fDa521)
- `m/44'/1'/0'/0/11` (address: 0x7e99c2f1731D3750b74A2a0623C1F1DcB8cCa45e)
- `m/44'/1'/0'/0/12` (address: 0xFd70Bef78778Ce8554e79D97521b69183960C574)
- `m/44'/1'/0'/0/13` (address: 0xEE2722c39db6014Eacc5FBe43601136825b00977)
- `m/44'/1'/0'/0/14` (address: 0xeDD5a9185F9F1C04a011117ad61564415057bf8F)
- `m/44'/1'/0'/0/15` (address: 0x99b832eb3F76ac3277b00beADC1e487C594ffb4c)
- `m/44'/1'/0'/0/16` (address: 0xda1380825f827C6Ea92DFB547EF0a341Cbe21d77)
- `m/44'/1'/0'/0/17` (address: 0xc201d4A5E6De676938533A0997802634E859e78b)
- `m/44'/1'/0'/0/18` (address: 0x03e95Af0fC4971EdCa12E6d2d1540c28314d15d5)
- `m/44'/1'/0'/0/19` (address: 0x3492DA004098d728201fD82657f1207a6E5426bd)

The mining accounts are:

- `m/44'/1'/1'/0/0` (address: 0xd42d71cdc2A0a78fE7fBE7236c19925f62C442bA)
- `m/44'/1'/1'/0/1` (address: 0x38a6BD13CC381c68751BE2cef97BD79EBcb2Bb31)

## Related resources

For additional information about Kadena Chainweb EVM, see the following resources:

- [Proposal: Cross-Chain Bridging Protocol (Draft)](https://github.com/kadena-io/kadena-evm-sandbox/docs/bridging-protocol.md)
- [Get started with Kadena Chainweb EVM](https://docs.kadena.io/guides/nodes/howto-evm)
