---
title: Chainweb EVM preview
description: "Become a Chainweb node operator to support the Kadena network infrastructure."
id: howto-evm
sidebar_position: 2
tags: [pact, chainweb, network, node operator]
---

# Kadena Chainweb EVM Sandbox

This repository presents a preview of the support for the Ethereum Virtual Machine (EVM) execution environment running on [Chainweb nodes]((https://kadena.io/chainweb)) in the
[Kadena](https://kadena.io) blockchain.
This preview demonstrates how to set up EVM-compatible nodes and execute cross-chain transactions to transfer assets from one chain to another.
The preview is the first step toward an integrated and feature-rich multi-chain proof-of-work consensus network for Solidity and Pact developers to deploy smart contracts.

## What's included in the preview

With the preview, you can set up a local Kadena **development network** that runs a single **Chainweb node** and a single **mining client**.
The development network consists of twenty (20) chains with two chains that use EVM as the payload provider for processing transactions.
Because the development network is intended for demonstration purposes, proof-of-work consensus is disabled and blocks are produced at a constant rate of two seconds per per chain, or ten blocks per second across the whole network.

The repository for the preview includes the following directories and components:

| Name | What it provides
| ---- | ----------------
| allocations | Files to set up an ethers project that describes a set of BIP-44 wallets and allocations to be created in the genesis block for the development network.
| blockscout | Files to set up an optional block explorer for the EVM chains in the development network. [Blockscout](https://www.blockscout.com/) instances provide an explorer interface and API similar to [Etherscan](https://etherscan.io).
| devnet | A Docker compose project and files to set up the Chainweb node for the development network.  
| docker-bake.hcl | A script to build multi-platform images for the development network Docker compose project.
| network | An optional command-line program for managing and monitoring the development network in the Kadena Chainweb EVM sandbox.
| solidity | A Hardhat project that demonstrates the implementation of a simple ERC-20 token with support for burn and mint style transfers between the two EVM chains in the network.

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

2. Start the network by running the following command:

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

3. Check that blocks are being produced by running the following command:

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
   
   This command executes a set of tests that deploy the ERC-20 token contract and check that token transfer operations succeed or revert as  expected when tokens are transferred between addresses on the two Chainweb EVM chains.
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

## Integrating with other Hardhat projects

If you want to experiment with using the Chainweb EVM development network with other Hardhat projects, you must configure the Hardhat project to connect to the Chainweb EVM development network.
You must also configure the Hardhat project to include account information—addresses and balances—for all available accounts.
In the `kadena-evm-sandbox` directory, the `solidity` directory provides an example of a simple Hardhat project with a Hardhat configuration file, Solidity smart contract, and a test file.

The `solidity` project includes the following files to configure the Chainweb EVM development network:

- The `solidity/devnet-accounts.json` file contains all of the account information generated from a test BIP-44 wallet using a seed entropy value of `0x0000 0000 0000 0000 0000 0000 0000 0000` (16 zero bytes).
- The `solidity/hardhat.config.js` file reads the account information from the `solidity/devnet-accounts.json` file, sets the properties that describe the Chainweb EVM nodes, and configures the `kadena_devent` network as default Hardhat network for the `solidity` project. 

After a project is configured to use the Chainweb EVM development network settings and accounts, you can run unit tests for the project using the standard `hardhat test` command.
For example:

```sh
cd solidity 
npx hardhat test
```

### Modifying the Hardhat project

To integrate with the Chainweb EVM development network:

1. Copy the `solidity/devnet-accounts.json` file into the root directory of your Hardhat project. 
2. Open the `hardhat.config.js` file for your Hardhat project in your code editor. 
3. Copy and paste the code to read account information from the `solidity/hardhat.config.js` file into the `hardhat.config.js` file for your project.
   
   For example:

   ```javascript
   require("@nomicfoundation/hardhat-toolbox");
   require("@nomicfoundation/hardhat-verify");
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
   ```

4. Copy and paste the code to configure network information from the `solidity/hardhat.config.js` file into the `hardhat.config.js` file for your project. 

   For example:

   ```javascript
     // defaultNetwork: "kadena_devnet0",
     networks: {
       kadena_devnet0: {
         url: 'http://localhost:8545',
         chainId: 1789,
         accounts: devnetAccounts.accounts.map(account => account.privateKey),
         chainwebChainId: 0,
       },
       kadena_devnet1: {
         // url: 'http://localhost:8546',
         url: 'http://localhost:8555',   
         chainId: 1790,
         accounts: devnetAccounts.accounts.map(account => account.privateKey),
         chainwebChainId: 1,
       },
     },
     ```

1. (Optional) Copy and paste the code to configure etherscan settings from the `solidity/hardhat.config.js` file into the `hardhat.config.js` file for your project.
   
   For example:

   ```javascript
     // defaultNetwork: "kadena_devnet0",
     etherscan: {
       apiKey: {
         'kadena_devnet0': 'empty',
         'kadena_devnet1': 'empty',
       }, 
       customChains: [
         {
           network: "kadena_devnet0",
           chainId: 1789,
           urls: {
             apiURL: "http://localhost:8000/api",
             browserURL: "http://localhost:8000"
           }
         },
         {   
           network: "kadena_devnet1",
           chainId: 1790,
           urls: {
             apiURL: "http://localhost:8001/api",
             browserURL: "http://localhost:8001"
           }
         },
       ]
     },
     ```
1. Save your changes and close the `hardhat.config.js` file.

### Compiling and testing integration

After configuring your Hardhat project to use the Chainweb EVM development network, you can compile, test, and deploy the project using standard `hardhat` commands.
For example, compile the project by running the following command:

```sh
npx hardhat compile
```

Run unit tests using the standard `hardhat test` command:

```sh
cd solidity 
npx hardhat test
```

Similarly, if you have a `deploy.js` deployment script in a `scripts` directory, you can deploy the project using the standard `hardhat` command to run scripts:

```sh
npx hardhat run scripts/deploy.js
```

### Changing the default network

If you prefer to keep the `hardhat` network as the default network for your Hardhat project, you can configure `kadena_devnet` as a separate network.

To change the default network:

1. Open the `hardhat.config.js` file for your Hardhat project in your code editor. 

2. Remove or comment out the following line from the network settings:

   ```sh
   defaultNetwork: "kadena_devnet",
   ```

1. Run hardhat command using the --network kadena_devnet command-line option.
   
   For example, run unit tests on the Chainweb EVM development network like this:

   ```sh
   npx hardhat test --network kadena_devnet
   ```
   
   Similarly, you can run scripts on the Chainweb EVM development networklike this:

   ```sh
   npx hardhat run scripts/deploy.js --network kadena_devnet
   ```

   Running the same commands without the `--network` command-line option then run them against a Hardhat instance. 
   If your smart contract uses any Kadena-specific pre-compiles or other features, running against the Hardhat network might not work.

## Blockscout

You can explore the Chainweb EVM development network chains using the optional [Blockscout](https://blockscout.com). Blockscout is a blockchain monitor that provides a user experience that is similar to [Etherscan](https://etherscan.io). 
For additional information, see the [Blockscout README](https://github.com/blockscout/blockscout).

To use Blockscout:

1. Open a terminal shell and change to the `kadena-evm-sandbox` directory, if needed:

1. Pull the latest images by running the following command:

   ```sh
   ./network blockscout pull
   ```

1. Start a Blockscout instance by running the following command:

   ```sh
   ./network blockscout start
   ```
   
   After running this command, it can take several minutes before you can open Blockscout in a browser.

1. Open the appropriate URL for the chain you want to explore:
   
   ```sh
   chain 0: http://localhost:8000
   chain 1: http://localhost:8001
   ```
   The Blockscout UIs for the EVM chains are available at the following URLs.
   - [Chainweb EVM chain 0](http://localhost:8000)
   - [Chainweb EVM chain 1](http://localhost:8001)

## Network components and chain specifications

-   `chainweb-node`
    -   software: [chainweb-node](https://github.com/kadena-io/chainweb-node/tree/lars/pp/evm)
    -   exported ports: 1848 (Chainweb service API)
-   `chainweb-miner`
    -   software: [chainweb-mining-client][https://github.com/kadena-io/chainweb-mining-client)
    -   worker: constant-delay with a 2s rate per chain
-   `chainweb-evm-chain0`
    -   software: [kadena-reth](https://github.com/kadena-io/kadena-reth)
    -   exported ports: 8545 (HTTP ETH RPC), 8546 (Websocket ETH RPC)
    -   Chainweb chain-id: 0
    -   Ethereum chain-id: 1789
    -   chain specification: `./devnet/config/chainweb-chain0-spec.json`
-   `chainweb-evm-chain1`
    -   software: [kadena-reth](https://github.com/kadena-io/kadena-reth)
    -   exported ports: 8555 (HTTP ETH RPC), 8556 (Websocket ETH RPC)
    -   Chainweb chain-id: 1
    -   Ethereum chain-id: 1790
    -   chain specification: `./devnet/config/chainweb-chain1-spec.json`

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
