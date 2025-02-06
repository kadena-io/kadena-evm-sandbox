# Kadena EVM Sandbox

This repository presents a preview of the upcoming support for the EVM in the
[Kadena](https://kadena.io) blockchain.

The sandbox includes the following components:

-   A docker compose project for a Kadena development network. The network runs a
    [Chainweb](https://kadena.io/chainweb) with twenty chains.

    Two chains use the EVM as payload provider for processing transactions. The
    remaining 18 chains use a minimal payload provider that does not support any
    user transactions.

    The network runs a single Chainweb node along with a single mining client.
    PoW consensus is disabled and blocks are produced at a constant rate of two
    seconds per per chain, or ten blocks per second across the whole network.
-   A hardhat Solidity project that demonstrates the implementation of a simple
    ERC-20 token with support for burn-mint style transfers between the EVM
    chains in the network.
-   An ethers projects that provides BIP-44 wallets for all allocations in the
    Genesis block.
-   Docker compose project for running [Blockscout](https://blockscout.com)
    instances for the EVM chains in the development network. Blockscout is a
    blockchain explorer that provides an user experience and API similar to
    [Etherscan](https://etherscan.io).
-   A commandline tool for managing and monitoring the different network
    components in the Kadena EVM sandbox.

## System requirements

For running the development network:

-   [docker](https://www.docker.com) or a compatible alternative.
-   [docker compose](https://docs.docker.com/compose/) or a compatible
    alternative.
-   At least 4 CPU cores and 8GB of Memory that are available to docker. (Please
    check the docker configuration if it provides sufficient resources to
    docker.)
-   A network connection for downloading the container images for the network
    components.
-   A command line terminal with a POSIX compliant shell.
-   A `bash` installation.

For deploying the Solidity contracts with hardhat:

-   A local [Node.js](https://nodejs.org) and
    [npx](https://docs.npmjs.com/cli/v8/commands/npx) installation.

For running the Blockscout instances:

-   At least 6 CPU cores and 12GB of RAM that are available to docker.

## Quick Start

Clone the the Github repository of [this
project](https://github.com/kadena-io/kadena-evm-sandbox):

```sh
git clone https://github.com/kadena-io/kadena-evm-sandbox
cd kadena-evm-sandbox
```

When running for the first time it is recommended to pull all container images
before starting the network:

```sh
./network devnet pull
```

Start the network:

```sh
./network devnet start
```

Check that blocks are being produced:

```sh
./network devnet status
```

Call the previous command repeatedly and check that the cut height value is
increasing.

Deploy the simple token contract and test that cross chain transfers are
working:

```sh
./network solidity test
```

Explore available commands for managing and monitoring the network:

```sh
./network help
```

When done shut down the network with:

```sh
./network devnet stop
```

If, for some reason, the network gets stuck the chainweb-node can be restarted
via:

```sh
./network devnet restart
```

## Network Components

-   `chainweb-node`
    -   software:
        [chainweb-node](https://github.com/kadena-io/chainweb-node/tree/lars/pp/evm)
    -   exported ports: 1848 (service API)
-   `chainweb-miner`
    -   software:
        [chainweb-mining-client][https://github.com/kadena-io/chainweb-mining-client)
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

## Chain Specification

Chains are defined in the files named
`./devnet/chainweb-chain{NUM}-spec.json`. The Ethereum chain-ids begin at 1789.

All initial accounts are generated from a BIP-44 wallet from a seed entropy
value of value of `0x0000 0000 0000 0000 0000 0000 0000 0000` (16 zero bytes).

The allocations in the genesis block use the following path values

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

The above addresses, their private keys, and their starting balances can be
viewed with the following command:

```
./network allocations

```

The mining accounts are

- `m/44'/1'/1'/0/0` (address: 0xd42d71cdc2A0a78fE7fBE7236c19925f62C442bA)
- `m/44'/1'/1'/0/1` (address: 0x38a6BD13CC381c68751BE2cef97BD79EBcb2Bb31)

Details about how the wallet is generated can be found in the file
`allocations/wallet.mjs`.

## Integration into Hardhat Projects

In order to use the devnet with a Hardhat project, the devnet must be configured
as a network. Part of configuring the network is making Hardhat aware of the
avaialbe accounts. The `solidity` directory is an example of a very simple
Hardhat project with a simple solidity smart contract and a test file. The
`solidity/hardhat.config.js` file is an example of how to configure the devnet
as the default hardhat network. It reads in the account details from
`solidity/devnet-accounts.json`. This file contains the accounts used by the
devnet. It was generated using the `solidity/generate-accounts.mjs` script. It
also configures the `kadena_devent` network and sets it as default. The unit
tests can then be run with the standard hardhat command:

```
npx hardhat test

```

In order for this to work in your own hardhat project, you must copy the
`solidity/devnet-accounts.json` into the root directory of your project. Use the
`solidity/hardhat.config.js` as an example of how to set up your Hardhat Config
or just copy it as the starting point for your config. If you have a Hardhat
TypeScript project, you can use `solidity/hardhat.config.ts.example` instead.

With this Hardhat configuration, you can also run deployment scripts. For
instance, if you have a deployment script called deploy.js in your scripts
directory, you could run it using the standard hardhat command to run scripts:

```
npx hardhat run scripts/deploy.js

```

If you prefer to keep the `hardhat` network as your default network and
configure kadena_devnet as a separate network for your project, simply remove
the following line from the network config in `solidity/hardhat.config.js`:

```
defaultNetwork: "kadena_devnet",

```

and then run unit tests like this:

```
npx hardhat test --network kadena_devnet
```

and other scripts like this:

```
npx hardhat run scripts/deploy.js --network kadena_devnet
```

Running the same commands without the --network switch will then run them
against a hardhat instance. Note that if your smart contracts use any
Kadena-specific pre-compiles or other features, running against hardhat may not
work.

## Blockscout

The EVM chains in network can be explored via
[Blockscout](https://blockscout.com). [Blockscout](https://blockscout.com) is a
blockchain monitor that provides an UX experience that is similar to
[Etherscan](https://etherscan.io). For details please take a look at the
[README](./blockscout-compose/README.md).

Before the first use it is recommanded to pull all images before actually
starting Blockscout:

```sh
./network blockscout pull
```

The Blockscout instances are then started with:

```sh
./network blockscout stop
```

It can take a while until the the frontend is initialized. In particular, on
macos it is faster to start Blockscout before starting the development network.

The Blockscout UIs for the EVM chains are available at the following URLs.

-   [chainweb chain 0](http://localhost:8000)
-   [chainweb chain 1](http://localhost:8001)

If you get a 502 failure status in your browser the frontend is not yet
initialized. This process can take up to several minutes.

