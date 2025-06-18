---
title: Get started with Chainweb EVM
description: "Deploy a private Chainweb EVM node to set up a local development network for testing."
id: evm-devnet
sidebar_position: 2
tags: [pact, chainweb, network, node operator]
---

# Get started with Kadena Chainweb EVM

The Kadena network relies on nodes that run the Chainweb consensus protocol.
When Ethereum transitioned from a Proof-of-Work consensus model to a Proof-of-Stake consensus model, it effectively split the blockchain into separate consensus and execution layers.
This change to the architecture enabled the Ethereum Virtual Machine (EVM) to provide an execution environment that is agnostic about the underlying consensus.
Because the execution layer operates independently, Chainweb nodes can provide the same EVM execution environment running in parallel with Pact while maintaining the Chainweb Proof-of-Work consensus, security, and decentralization over a multi-chain network. 

## How it works

The Chainweb consensus protocol enables multiple independent chains to share a common view of state beyond a certain block depth. 
This common view of state enables any chain in the network to verify whether historical events beyond the required block depth occurred on any other chain. 
For example, if a transaction occurs on chain 3, chain 3 can produce a [simple payment verification (SPV) proof](https://wiki.bitcoinsv.io/index.php/Simplified_Payment_Verification) that chain 6 can verify by checking the shared history. 
The only requirement for verifying the transaction is that the proof must be conveyed from the original chain, in this example, chain 3—to the target chain, in this example, chain 6.

With this approach, security relies strictly on the shared consensus across the chains in the network.
There are no relayers, oracles, validators, archives, or third-party coordinators. 

The chains in the Kadena Chainweb EVM network run in parallel, but independently, allowing for concurrent transaction processing without the risk of collisions or delays.
Because Chainweb provides a single common view of state, global security, and concurrent payload processing, Kadena Chainweb EVM enables cross-chain transactions to be executed more efficiently and at a lower cost than traditional bridging techniques.

At a high level, Kadena Chainweb EVM supports cross-chain activity in three main steps:

- An event occurs on a source chain.

  For a cross-chain transfer, a user *initiates* a transaction to transfer tokens from a source chain using a smart contract.
  The smart contract emits a well-defined cross-chain event.

- An off-chain endpoint generates proof of a specific event.
  
  For a cross-chain transfer, a user *queries* an endpoint that generates a simple payment verification proof or another type of proof that can be validated.
  The proof must encode all of the information required to uniquely identify the event on the source chain and the contract on the target chain.

- The event is observed on the target chain.
  
  For a cross-chain transfer, a user *relays* the proof to the target chain, where it is verified against the history shared by the source and target chains. 
  By checking the shared history, the contract on the target chain validates that the transfer event claimed by the user occurred on the source chain.
  The smart contract on the target chain completes the transaction, for example, by minting the number of tokens transferred from the source chain.

## Chainweb EVM development environment

The [kadena-evm-sandbox](https://github.com/kadena-io/kadena-evm-sandbox) repository provides tools and configuration files for developers interested in setting up a private local development environment for testing the Ethereum Virtual Machine (EVM) execution environment running on [Chainweb nodes](https://kadena.io/chainweb) that provide the infrastructure for the [Kadena](https://kadena.io) blockchain network.

The repository includes a default configuration for a `docker compose` image that is optimized for basic frontend development with an EVM-compatible node as the backend.
The default configuration includes chains 0 through 19 for Pact smart contracts and chains 20 though 24 for Solidity contracts.

## What's included in the repository

The `kadena-evm-sandbox` repository provides everything you need to set up a local Kadena **development network** that runs a single **Chainweb node** with core backend services and a **mining client**.
The default configuration for the development network provides five chains that use EVM as the payload provider for processing transactions.

The repository includes the following directories and components:

| Name | What it provides
| ---- | ----------------
| allocations | Files to set up an ethers project that describes a set of BIP-44 wallets and allocations to be created in the genesis block for the development network.
| apps | Files to set up the contract, server, and frontend application that demonstrates cross-chain transactions.
| blockscout | Files to set up an optional block explorer for the EVM chains in the development network. [Blockscout](https://www.blockscout.com/) instances provide an explorer interface and API similar to [Etherscan](https://etherscan.io).
| devnet | A Docker compose project and files to set up the Chainweb node services for the development network.  
| docker&#8209;bake.hcl | A script to build multi-platform images for the development network Docker compose project.
| docs | Technical documentation about the functions and events proposed for the Kadena Chainweb EVM cross-chain bridging protocol in draft form.
| network | An optional command-line program for starting, stopping, and monitoring the Kadena Chainweb EVM development network.
| solidity | A Hardhat project that demonstrates the implementation of a simple ERC-20 token with support for burn and mint style transfers between the two EVM chains in the network.

## Prerequisites and system requirements

Before you set up the Kadena Chainweb EVM development environment, verify that your local computer has the required tools installed and meets the following basic requirements:

- You must have [Docker](https://www.docker.com) and [Docker Compose](https://docs.docker.com/compose/) or an Open Container Initiative (OCI) compliant alternative.
- You must have at least 4 CPU cores and 8 GB of memory available for Docker. 
  You can configure CPU and memory for Docker using command-line options or Resource settings.
- You must have a network connection to download the container images for the development network.
- You must have a POSIX-compliant terminal shell for running command-line programs and scripts.
- You should have `bash` and [jq](https://jqlang.org) programs installed.
- You must have JavaScript tooling installed, including [Node.js](https://nodejs.org) version `v22`, the [npm](https://www.npmjs.com) or [yarn](https://yarnpkg.com/) package manager, and [npx](https://docs.npmjs.com/cli/v8/commands/npx) to deploy Solidity contracts with Hardhat.
- You must have at least 6 CPU cores and 12 GB of memory available for Docker to run the Blockscout block explorer.

## Quick start

To download and install the Chainweb EVM development network:

1. Open a terminal shell on your computer.

1. Clone the [kadena-evm-sandbox](https://github.com/kadena-io/kadena-evm-sandbox) repository and change to the `kadena-evm-sandbox` directory by running the following command:

   ```sh
   git clone https://github.com/kadena-io/kadena-evm-sandbox && cd kadena-evm-sandbox
   ```

   The `kadena-evm-sandbox` directory includes the `network` command-line program that you can use to perform common tasks to manage and monitor the development network.
   The `network` program supports commands that are similar to Docker commands.
   You can explore all of the commands available by running the following command:

   ```sh
   ./network help
   ```

2. Pull the latest container images using the `network` command-line program by running the following command:

   ```sh
   ./network devnet pull
   ```

   You can execute `network` commands for convenience or use `docker` commands directly.
   Pulling the latest container images isn't strictly required, but it's recommended before you start the development network for the first time.
   
   You should see output similar to the following:

   ```sh
   [+] Pulling 10/10
    ✔ bootnode-evm-22 Skipped - Image is already being pulled by bootnode-evm-21               0.0s
    ✔ bootnode-evm-20 Skipped - Image is already being pulled by bootnode-evm-21               0.0s 
    ✔ bootnode-evm-24 Skipped - Image is already being pulled by bootnode-evm-21               0.0s 
    ✔ bootnode-evm-23 Skipped - Image is already being pulled by bootnode-evm-21               0.0s 
    ✔ bootnode-mining-client Pulled                                                            1.7s
    ✔ allocations Pulled                                                                       1.7s
    ✔ bootnode-frontend Pulled                                                                 1.7s
    ✔ bootnode-mining-trigger Pulled                                                           1.8s
    ✔ bootnode-evm-21 Pulled                                                                   1.7s
    ✔ bootnode-consensus Pulled                                                                1.8s
      ✔ 63467be34da6 Pull complete                                                            34.9s 
      ✔ 036ac59a35be Pull complete                                                             6.4s 
      ✔ 4a057fff0021 Pull complete                                                             6.3s 
   ```

3. Start the network by running the following command:

   ```sh
   ./network devnet start
   ```

   This command starts the development blockchain and allocates the test account addresses. 
   You should see output similar to the following excerpt:

   ```sh
   [+] Running 3/4
    ✔ Network chainweb-evm_bootnode-internal      Create...                                    0.1s 
    ✔ Network chainweb-evm_p2p                    Created                                      0.0s 
    ✔ Network chainweb-evm_bootnode-frontend      Create...                                    0.0s 
    ⠋ Volume "chainweb-evm_bootnode-evm-22_data"  Cr...                                        0.0s
   ...
    ✔ Container bootnode-evm-23                   Started                                      1.2s
    ✔ Container bootnode-evm-20                   Started                                      1.2s
    ✔ Container bootnode-evm-22                   Started                                      1.3s 
    ✔ Container bootnode-evm-24                   Started                                      1.7s 
    ✔ Container bootnode-evm-21                   Started                                      1.2s 
    ✔ Container bootnode-allocations              Started                                      1.5s 
    ✔ Container bootnode-consensus                Healthy                                      9.3s 
    ✔ Container bootnode-frontend                 Started                                      9.7s 
    ✔ Container bootnode-mining-trigger           Started                                      9.5s 
    ✔ Container bootnode-mining-client            Started                                      9.6s 
   [+] Creating 1/1
    ✔ Container bootnode-evm-20    Running                                                     0.0s 
   wallets created: {
     alloc0: {
       address: '0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6',
       privateKey: '0xe711c50150f500fdebec57e5c299518c2f7b36271c138c55759e5b4515dc7161'
     },
   ...
   ```

1. Check that blocks are being produced by running the following command:

   ```sh
   ./network devnet status
   ```

   This command displays the current block height and cut height for the development network with output similar to the following excerpt:

   ```sh
   Node: bootnode-consensus
   chain        height  hash                                         type
   0            36      G1BY2DprJ6ULTaPOt67XEDtjw03gVgu4IHXsYhHgUfs  default
   1            35      Euw83eOfY1DTbQIHOnETvNYjAW6hvxMZ4RDeZWsmuzI  default
   2            36      dPs3Tj6ug0c7NyG0v-XbyZdXh2QZh_WvyvZHu6uk4_I  default
   3            36      OoC9hTEJmPVj3pMcjPwM0qofXS4wN4172aL5ffN2om4  default
   4            36      GKNU8tzdtLNXudlvRv5orVQ8bFXN0F7pQ63MlavtE88  default
   ...
   20           37      dsrjWRrIgsezR2InWb3EzMml28owAmIQLh20fdHVrqs  evm
   21           36      j9fI_MQEYboaqx2qu2MtyBjKGTsJHb9FMq8ktVPq4zw  evm
   22           36      _6quxrPShEpb0hyd3jB2VNdlQq2xmsPZFOgku4iA5SY  evm
   23           37      Q_muuzU3TUZH0n1kP74tmW7VMIuelsrlGRW8TnYwqVE  evm
   24           36      pUattWugcCjy_2_0ejgTx1SqaeHGvtV_nWA_Fc5PGnw  evm
   ...
   cut-height:  3529
   ```
   
   You can call the `./network devnet status` command repeatedly to verify that the block height and cut height values are increasing.

### Test the simple token contract

To test the simple token contract:

1. Install Hardhat and related dependencies in the development network by running the following command:

   ```sh
   ./network solidity setup
   ```

   If the `npm` package manager reports any issues, address them before continuing to the next step.
   For example, you might be prompted to run `npm audit fix` to address issues.

1. Test the simple token contract by running the following command:

   ```sh
   ./network solidity test
   ```
   
   This command executes a set of tests that deploy the sample ERC-20 token contract and check that token transfer operations succeed or revert as expected when tokens are transferred between addresses on two Chainweb EVM chains.
   For example, you should see output similar to the following excerpt:

   ```sh
   ...
   Found 2 Kadena devnet networks: kadena_devnet0, kadena_devnet1
   Deployed to address 0x5c8B984DEb026110310f617c5DBa96Fd39704835 with signer: 0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6 on network kadena_devnet0
   Deployed to address 0x5c8B984DEb026110310f617c5DBa96Fd39704835 with signer: 0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6 on network kadena_devnet1
   Authorizing 20:0x5c8B984DEb026110310f617c5DBa96Fd39704835 for 20:0x5c8B984DEb026110310f617c5DBa96Fd39704835
   Authorizing 21:0x5c8B984DEb026110310f617c5DBa96Fd39704835 for 20:0x5c8B984DEb026110310f617c5DBa96Fd39704835
   Authorizing 20:0x5c8B984DEb026110310f617c5DBa96Fd39704835 for 21:0x5c8B984DEb026110310f617c5DBa96Fd39704835
   Authorizing 21:0x5c8B984DEb026110310f617c5DBa96Fd39704835 for 21:0x5c8B984DEb026110310f617c5DBa96Fd39704835
   Transfering 500000000000000000000 tokens from 20:0x5c8B984DEb026110310f617c5DBa96Fd39704835:0xFB8Fb7f9bdc8951040a6D195764905138F7462Ed to 21:0x5c8B984DEb026110310f617c5DBa96Fd39704835:0xFB8Fb7f9bdc8951040a6D195764905138F7462Ed
   Initiating cross-chain transfer from kadena_devnet0 to kadena_devnet1 : 21
   transfer-crosschain status: 1, at block number 59 with hash 0x6d94c15d315dd5fa8d29abe3048835c8c7814cf367b1c2002c5a879642dc6ea6
   found log at tx 0 and event 1
   Redeeming tokens on chain kadena_devnet1
   ...
   ```

### Restarting the development network

If the development network stops producing blocks or seems stuck, you can restart the `chainweb-node` service without stopping or restarting other network components.

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

## Modifying the network configuration

The `devnet` folder in the `kadena-evm-sandbox` repository includes a Python script, `compose.py`, that generates the `docker-compose.yaml` file for the Chainweb EVM Docker Compose project.
The `compose.py` script automates the creation of the `docker-compose.yaml` file with different configuration settings for the following predefined `project` use cases:

- The `app-dev` project generates a configuration file optimized for application development with a single full-service bootstrap node.
  This configuration produces blocks at a fixed rate of two seconds per chain, has mining enabled, and exposes the Chainweb service API on the chains you specify as command-line arguments.
- The `kadena-dev` project generates a configuration file that simulates a production environment with four node roles: one bootstrap node, one application development node, and two mining nodes.
  This configuration is optimized for testing and debugging Chainweb node backend services, such as consensus and peer-to-peer networking.
- The `minimal` project generates a configuration file for a minimal development environment with one bootstrap node and simulated mining.

To generate a `docker-compose.yaml` for one of the predefined project use cases, add the `--project` command-line option and the use case project name to the `compose.py` script.
For example, you can run the following command to generate a `docker-compose.yaml` file that simulates a production environment and then starts the network using that configuration:

```bash
python3.13 compose.py --project kadena-dev > docker-compose.yaml && docker compose up -d
```

To generate a `docker-compose.yaml` that's optimized for application development, you can run a command similar to the following:

```bash
python3.13 compose.py --project app-dev --exposed-chains "3, 20" > docker-compose.yaml && docker compose up -d
```

This example only exposes the Chainweb service API on one Pact chain (3) and one EVM chain (20).
You can run `compose.py` script to generate the `docker-compose.yaml` file for any of the predefined project configurations.
Alternatively, you can modify the `compose.py` script or write your own script to customize the development environment settings you want to use.

## Integrating with other Hardhat projects

If you want to experiment with using the Chainweb EVM development network with other Hardhat projects, you must configure the Hardhat project to connect to the Chainweb EVM development network.
You must also configure the Hardhat project to include account information—addresses and balances—for all available accounts.
In the `kadena-evm-sandbox` directory, the `solidity` directory provides an example of a simple Hardhat project with a Hardhat configuration file, Solidity smart contract, and a test file.

The `solidity` project includes the following files to configure the Chainweb EVM development network:

- The `solidity/devnet-accounts.json` file contains all of the account information generated from a test BIP-44 wallet using a seed entropy value of `0x0000 0000 0000 0000 0000 0000 0000 0000` (16 zero bytes).
- The `solidity/hardhat.config.js` file reads the account information from the `solidity/devnet-accounts.json` file, sets the properties that describe the Chainweb EVM nodes, and configures the `kadena_devnet0` network as the default Hardhat network for the `solidity` project.

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
   const devnetAccountsPath = path.join(__dirname, "devnet-accounts.json");
   const devnetAccountsFile = fs.readFileSync(devnetAccountsPath, "utf8");
   const devnetAccounts = JSON.parse(devnetAccountsFile);

   // Validate account configuration
   const requiredAccounts = 20;
   if (devnetAccounts.accounts.length !== requiredAccounts) {
     throw new Error(
       `Expected ${requiredAccounts} accounts in devnet-accounts.json, found ${devnetAccounts.accounts.length}`
     );
   }
   ```

4. Copy and paste the code to configure network information from the `solidity/hardhat.config.js` file into the `hardhat.config.js` file for your project.

   For example:

   ```javascript
     defaultNetwork: "kadena_devnet0",
     networks: {
       kadena_devnet0: {
         url: 'http://localhost:8545',
         chainId: 1789,
         accounts: devnetAccounts.accounts.map(account => account.privateKey),
         chainwebChainId: 0,
       },
       kadena_devnet1: {
         url: 'http://localhost:8555',
         chainId: 1790,
         accounts: devnetAccounts.accounts.map(account => account.privateKey),
         chainwebChainId: 1,
       },
     },
   ```

5. (Optional) Copy and paste the code to configure etherscan settings from the `solidity/hardhat.config.js` file into the `hardhat.config.js` file for your project.

   For example:

   ```javascript
     defaultNetwork: "kadena_devnet0",
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

6. Save your changes and close the `hardhat.config.js` file.

### Compiling and testing integration

After configuring your Hardhat project to use the Chainweb EVM development network, you can compile, test, and deploy the project using standard `hardhat` commands.
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

### Changing the default network

If you prefer to keep the `hardhat` network as the default network for your Hardhat project, you can remove the setting that configures `kadena_devnet0` to be the default network.

To change the default network:

1. Open the `hardhat.config.js` file for your Hardhat project in your code editor.

2. Remove or comment out the following line from the network settings:

   ```sh
   defaultNetwork: "kadena_devnet0",
   ```

3. Run `hardhat` commands using the `--network kadena_devnet0` or `--network kadena_devnet1` command-line option.

   For example, run unit tests on the Chainweb EVM development network like this:

   ```sh
   npx hardhat test --network kadena_devnet0
   ```

   Similarly, you can run scripts on the Chainweb EVM development network like this:

   ```sh
   npx hardhat run scripts/deploy.js --network kadena_devnet0
   ```

   You can then run the same commands without the `--network` command-line option to execute them on the default Hardhat network instance.
   If your smart contract uses any Kadena-specific precompile functions or other Kadena-specific or Chainweb-specific features, you might be unable to run the contract on the Hardhat network.
   If you have a smart contract that requires Hardhat-specific features, you might be unable to run the contract on the Kadena development network.

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

```sh
Found 2 Kadena devnet networks: kadena_devnet0, kadena_devnet1
Deployed to address 0x0Be392280A18d06DDC9CdD162485CB3334abf8e7 with signer: 0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6 on network kadena_devnet0
Deployed to address 0x03C92E75C2e211E9A57B3f31e7354E9D0aF6F257 with signer: 0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6 on network kadena_devnet1
```

This deploying signer is simply the first signer retrieved by the `getSigners` function in the `solidity/test/utils/utils.js` file.

Typically, if you wanted to call a smart contract function using a different signer—for example, `alice`—you could call the function like this:

```javascript
const tx = await token0
  .connect(alice)
  .transferCrossChain(receiver.address, amount, token1Info.chain);
```

If you call this function in the default Hardhat network, the call creates a new contract instance using the new signer `alice` in the background.
However, if you want to call a contract in the Kadena development network, you must be aware of the network context to get the correct signing address.

For example, if `kadena_devnet0` is the default network and you want to call a contract that is on `kadena_devnet1` instead of `kadena_devnet0`, you must first switch to `kadena_devnet1` and then get the signer address.
This difference in behavior is because signers in Hardhat have a specific network context.
In the Kadena development network, the `alice` signer retrieved on `kadena_devnet0` has the same address as the `alice` signer on `kadena_devnet1` but is not the same signer object.
Therefore, you must specifically switch to the `kadena_devnet1` network context to get the `alice` signer for that network before you execute the transaction using that account address.

For an example of how to switch the network context, see the "Should transfer tokens to different address from chain 1 to chain 0" test the in the `solidity/test/SimpleToken.integration.test.js` file.

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
