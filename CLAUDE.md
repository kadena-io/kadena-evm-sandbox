# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository provides a local development environment for Kadena Chainweb EVM - a multi-chain blockchain architecture where EVM execution runs on chains 20-24 alongside Pact smart contracts on chains 0-19. The key innovation is **trustless cross-chain bridging** using SPV (Simple Payment Verification) proofs enabled by Chainweb's braided architecture where all chains share a common view of history.

**Key benefit**: Cross-chain transactions require no relayers, oracles, validators, archives, or third-party coordinators. Security relies strictly on the shared consensus across chains in the network.

## Core Architecture Concepts

### Multi-Chain Structure
- **Pact chains**: 0-19 (default consensus)
- **EVM chains**: 20-24 (EVM payload provider)
- All chains share consensus and can internally verify each other's historical events via SPV proofs
- No third-party relayers, oracles, or validators needed for cross-chain transactions

### Cross-Chain Bridging Protocol
Cross-chain transfers follow a three-step pattern (see `docs/bridging-protocol.md` and `solidity/contracts/SimpleToken.sol`):

1. **Initialize on source chain**: Contract emits `CrossChainInitialized` event with burn operation
2. **Generate SPV proof**: Query endpoint for proof of the source chain event
3. **Complete on target chain**: Submit proof to redeem; contract verifies via precompiles and mints tokens

### Key Precompiles
Smart contracts interact with two critical precompiles:
- `VALIDATE_PROOF_PRECOMPILE` (0x48C3b4d2757447601776837B6a85F31EF88A87bf): Verifies SPV proofs
- `CHAIN_ID_PRECOMPILE` (0x9b02c3e2dF42533e0FD166798B5A616f59DBd2cc): Returns current Chainweb chain ID

### Network Context Management
When working with multiple chains via ethers/viem:
- Signers have network context tied to specific chain IDs
- Use `chainweb.switchChain(chainId)` or `@kadena/hardhat-chainweb`'s `runOverChains` helper
- See `solidity/test/SimpleToken.integration.test.js` for patterns

## Quick Start Workflow

Complete setup and verification workflow for first-time users:

1. **Clone and prepare**:
   ```bash
   git clone https://github.com/kadena-io/kadena-evm-sandbox && cd kadena-evm-sandbox
   ```

2. **Pull container images** (recommended):
   ```bash
   ./network devnet pull
   ```

   Expected output shows pulling of 10 services (consensus, evm chains 20-24, mining client, etc.).

3. **Start the network**:
   ```bash
   ./network devnet start
   ```

   Expected output shows containers starting and wallet creation:
   ```
   Container bootnode-consensus    Healthy
   Container bootnode-mining-client Started
   wallets created: {
     alloc0: {
       address: '0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6',
       privateKey: '0xe711c50150f500fdebec57e5c299518c2f7b36271c138c55759e5b4515dc7161'
     },
     ...
   }
   ```

4. **Verify blocks are being produced**:
   ```bash
   ./network devnet status
   ```

   Shows current block heights for all chains. Run this command repeatedly to confirm heights are increasing:
   ```
   chain    height  hash                                         type
   20       37      dsrjWRrIgsezR2InWb3EzMml28owAmIQLh20fdHVrqs  evm
   21       36      j9fI_MQEYboaqx2qu2MtyBjKGTsJHb9FMq8ktVPq4zw  evm
   ...
   cut-height: 3529
   ```

5. **Set up Solidity environment**:
   ```bash
   cd solidity
   npm install
   cp .env.example .env
   ```

   Note: .env is not used by tests but Hardhat requires it to exist (referenced in testnet configuration).

6. **Set up testing environment** (bun is REQUIRED, not optional):
   ```bash
   cd ../tests
   bun install
   ```

7. **Run integration tests**:
   ```bash
   bun run test
   ```

## Common Commands

### Network Management
```bash
# Start development network (Docker-based)
./network devnet start

# Check block production status
./network devnet status

# View allocated test accounts
./network devnet allocations

# Restart consensus service (if network stops producing blocks)
./network devnet restart

# Stop and clean up
./network devnet stop
```

Note: The `network` program mimics Docker commands for convenience. You can use `./network` commands OR `docker compose` commands directly.

### Solidity Development
```bash
cd solidity

# Run unit tests (internal Hardhat network)
npm run test

# Deploy to local sandbox (requires devnet running)
npm run deploy sandbox

# Deploy with Create2 (deterministic addresses across chains)
npm run deploy-create2 sandbox

# Deploy to testnet (requires DEPLOYER_PRIVATE_KEY in .env)
npm run deploy testnet
```

### Integration Testing
```bash
cd tests

# Run integration tests (requires bun - NOT setup for Node.js yet)
bun run test

# Run e2e tests (timeout: 300000ms / 5 minutes)
bun run e2e
```

Note: These are integration tests, not unit tests, which is why they're slower. E2E tests have 5-minute timeout due to multi-chain coordination. Bun is required.

### Docker Compose Configuration
The `devnet/compose.py` script generates `docker-compose.yaml` for different scenarios:
```bash
cd devnet

# Default: optimized for frontend dev, single node
uv run python ./compose.py > docker-compose.yaml && docker compose up -d

# Simulate production: 4 node roles (bootstrap, app-dev, 2 miners)
python3 compose.py --project kadena-dev > docker-compose.yaml

# Minimal: single bootstrap node with simulated mining
python3 compose.py --project minimal > docker-compose.yaml

# Custom: expose specific chains
python3 compose.py --project app-dev --exposed-chains "3,20" > docker-compose.yaml
```

### Blockscout Explorer
```bash
# Pull latest images (recommended)
./network blockscout pull

# Add local domains to /etc/hosts
./network blockscout add-domains

# Start block explorer (requires 6 CPU cores, 12 GB RAM)
./network blockscout start
```

This adds the following domains to /etc/hosts:
- 127.0.0.1 chain-20.evm.kadena.local
- 127.0.0.1 chain-21.evm.kadena.local
- 127.0.0.1 chain-22.evm.kadena.local
- 127.0.0.1 chain-23.evm.kadena.local
- 127.0.0.1 chain-24.evm.kadena.local

After starting, it takes several minutes before Blockscout is accessible. Access each chain at:
- http://chain-20.evm.kadena.local:8000
- http://chain-21.evm.kadena.local:8000
- http://chain-22.evm.kadena.local:8000
- http://chain-23.evm.kadena.local:8000
- http://chain-24.evm.kadena.local:8000

## Development Setup

### Prerequisites
- Docker with 4+ CPU cores, 8+ GB RAM (12 GB for Blockscout)
- Node.js v22, npm/yarn, npx
- Python 3.13 with `uv` for devnet configuration
- Bash, jq for scripts
- Bun for running tests

### Test Account Allocations
Genesis accounts use BIP-44 wallet with seed entropy `0x0000...0000` (16 zero bytes):

**User accounts** (development and testing):
- Paths: `m/44'/1'/0'/0/0` through `m/44'/1'/0'/0/19`
- First account: 0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6
- Pre-allocated in genesis block with test balances

**Mining accounts**:
- Paths: `m/44'/1'/1'/0/0` and `m/44'/1'/1'/0/1`
- First mining account: 0xd42d71cdc2A0a78fE7fBE7236c19925f62C442bA

The `allocations/` directory contains scripts to generate these wallets. See `allocations/wallet.mjs` for generation details. The `solidity/devnet-accounts.json` file provides pre-allocated test accounts that Hardhat configuration reads to make accounts available in the local sandbox development network.

## Project Structure

### `solidity/`
Hardhat project demonstrating ERC-20 cross-chain transfers:
- **Hardhat plugins**: `@kadena/hardhat-chainweb` (multi-chain deployment), `@kadena/hardhat-kadena-create2` (deterministic deployment)
- **Configuration**: `hardhat.config.js` defines `sandbox` (local), `testnet`, and `hardhat` (internal) networks
- **Key contract**: `SimpleToken.sol` - ERC-20 with `transferCrossChain()` and `redeemCrossChain()` methods
- **Tests**: `test/*.test.js` - unit and integration tests with chain switching patterns

### `devnet/`
Docker Compose infrastructure:
- **compose.py**: Generates configuration for different deployment scenarios
- **chain-specs/**: Genesis block specifications with initial allocations
- **config/**: Chainweb node configuration files
- **mining-trigger/**: Simulated mining trigger service

### `tests/`
Bun-based test suite:
- **e2e/**: End-to-end tests for multi-node configurations, miner rewards, etc.
- **src/**: Integration tests for Hardhat, Pact, transactions, token operations
- Uses `viem` for EVM interactions, `@kadena/client` for Pact

### `apps/`
Demo applications (e.g., KEthAmp for ETH Denver)

### `blockscout/`
Optional block explorer configuration for EVM chains

## Deployment Target Selection

When deploying contracts, you have several options:

**sandbox** - Local devnet (requires `./network devnet start`):
- Use for local development and testing
- Pre-allocated test accounts available
- Fast iteration, no real KDA required
- Example: `npm run deploy sandbox`

**localhost** - Local Hardhat node:
- Use for pure Hardhat testing without Chainweb
- Start with: `npx hardhat node`
- Deploy with: `npm run deploy localhost`

**testnet** - Kadena Chainweb EVM Testnet:
- Use for pre-production testing on public testnet
- Requires DEPLOYER_PRIVATE_KEY in .env
- Get testnet KDA from https://tools.kadena.io/faucet/evm
- Example: `npm run deploy testnet`
- Note: Change Create2 salt in `scripts/deploy-using-create2.js` for repeat deployments

**hardhat** (internal) - Hardhat's built-in test network:
- Use for unit tests without external dependencies
- No devnet required
- Example: `npm run deploy:hardhat`

## Hardhat Chainweb Plugin Usage

The `@kadena/hardhat-chainweb` plugin enables multi-chain deployment without configuring each chain as a separate network:

```javascript
// Deploy across all configured chains
npx hardhat run scripts/deploy.js --chainweb sandbox

// Set default chainweb network in hardhat.config.js
module.exports = {
  chainweb: {
    sandbox: { chains: 5, ... }
  },
  defaultChainweb: 'sandbox'
};
```

With `defaultChainweb` set, you can omit the `--chainweb` flag and simply run `npx hardhat run scripts/deploy.js`.

### Cross-Chain Contract Configuration
After deploying to multiple chains, contracts must register peer addresses:
```solidity
// On each chain, authorize the same contract on other chains
token.setCrossChainAddress(targetChainId, targetContractAddress);
```

## Code Examples: Signers and Chain Switching

### Default Signer Usage
By default, contract calls use the first signer from the network context:

```javascript
// Uses default signer (first account in accounts array)
const tx = await token0.transferCrossChain(receiver, amount, targetChain);
```

### Custom Signer Usage
To use a different signer, use the `connect()` method:

```javascript
// Uses alice as the signer
const tx = await token0.connect(alice).transferCrossChain(receiver, amount, targetChain);
```

**Important**: `connect()` creates a new contract instance with the specified signer. The signer must have the correct network context for the chain where the contract is deployed.

### Chain Switching Order
When working with multiple chains, always switch chains BEFORE connecting a signer:

```javascript
// CORRECT: Switch chain first, then connect signer
await chainweb.switchChain(chainId);
const contractOnNewChain = contract.connect(signer);

// INCORRECT: Signer will have wrong network context
const contractWithSigner = contract.connect(signer);
await chainweb.switchChain(chainId);
```

See `solidity/test/SimpleToken.integration.test.js` for complete examples of chain switching patterns.

## Contract Verification with Blockscout

To verify contracts on the local Blockscout instance, configure etherscan settings in `hardhat.config.js`:

```javascript
etherscan: {
  apiKey: 'abc', // Any non-empty string works for Blockscout
  apiURLTemplate: 'http://chain-{cid}.evm.kadena.internal:8000/api/',
  browserURLTemplate: 'http://chain-{cid}.evm.kadena.internal:8000/',
}
```

The `{cid}` placeholder is replaced with the actual chain ID during verification. The apiKey can be any non-empty string when using Blockscout (unlike Etherscan which requires a valid API key).

## Testing Cross-Chain Transfers

Pattern from `solidity/test/SimpleToken.integration.test.js`:
1. Deploy contract to multiple chains using Create2 (same address everywhere)
2. Configure cross-chain addresses on each deployment
3. Execute `transferCrossChain()` on source chain (burns tokens, emits event)
4. Query endpoint for SPV proof
5. Call `redeemCrossChain()` on target chain with proof (mints tokens)

## Troubleshooting

### Network stops producing blocks
If the devnet stops producing new blocks (status shows same heights repeatedly):

```bash
./network devnet restart
```

This restarts the `bootnode-consensus` service without affecting other components.

### Containers stuck or won't stop cleanly
If `./network devnet stop` fails or containers remain in a bad state:

```bash
docker compose down --volumes --remove-orphans
```

This forcibly removes all containers, volumes, and orphan processes. After running, you can start fresh with `./network devnet start`.

### Verifying block production
Run status command repeatedly to confirm heights are increasing:

```bash
# Run multiple times, observe height changes
./network devnet status
./network devnet status
```

If cut-height and individual chain heights are increasing, the network is healthy.

### Bun vs Node.js for tests
The test suite in `tests/` requires Bun. It is NOT setup for Node.js yet. Install Bun from https://bun.sh/.

### Hardhat .env requirement
Tests don't use .env, but Hardhat configuration references it for testnet settings. Always create .env even if empty:

```bash
cp .env.example .env
```

## Important Notes

- **Chain ID offsets**: Sandbox uses `chainIdOffset: 1789`, testnet uses `5920`
- **Chainweb vs EVM chain IDs**: `chainwebChainIdOffset: 20` maps to EVM chains 20-24
- **Create2 salt**: Change salt in `deploy-using-create2.js` for each testnet deployment (not required for fresh devnet)
- **Block production**: Default 2 seconds per chain
- **API endpoint**: Local sandbox at `http://localhost:1848/chainweb/0.0/evm-development/`
- **Test timeout**: Integration tests use 300s timeout due to multi-chain coordination
- **Image pulling**: Recommended but not strictly required before starting devnet

## Cross-Chain Security Model

Security relies solely on shared Chainweb consensus:
- SPV proofs verified against common history (no external validators)
- Contracts validate: target chain, target contract, origin contract, operation type
- Completed transactions tracked via origin hash to prevent replay attacks
- See `SimpleToken.sol:182-259` for validation logic

## Resources

### Documentation
- [Bridging Protocol (Draft)](docs/bridging-protocol.md) - Detailed cross-chain bridging specification
- [Kadena Chainweb EVM Testnet Deployment Guide](https://docs.kadena.io/guides/nodes/howto-evm)

### Developer Tools
- [Kadena Developer Tools - EVM Faucet](https://tools.kadena.io/faucet/evm) - Get testnet KDA for deployments

### NPM Packages
- [@kadena/hardhat-chainweb](https://www.npmjs.com/package/@kadena/hardhat-chainweb) - Multi-chain deployment plugin
- [@kadena/hardhat-kadena-create2](https://www.npmjs.com/package/@kadena/hardhat-kadena-create2) - Deterministic deployment plugin
