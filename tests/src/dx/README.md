# Chainweb EVM Test Suite DX tasks

This test suite explores various behaviors and edge cases when interacting with the Chainweb EVM using Hardhat and the Reth Ethereum client.

---

## 1. ERC-20 Deployment with Hardhat

**File:** `token.test.ts`  
**Tutorial:** Hardhat ERC-20 Token Tutorial
[hardhat tutorial](https://hardhat.org/tutorial)

- Follow the Hardhat ERC-20 tutorial.
- Deploy the token to Chainweb EVM using the Reth client.
- Validate contract functionality (e.g. `transfer`, `approve`, `balanceOf`).

---

## 2. CryptoZombies Deployment Test

**File:** `zombies.test.ts`  
**Tutorial:** CryptoZombies.io
[crypto zombies tutorial](https://cryptozombies.io/)

- Work through a CryptoZombies chapter (Solidity basics and contract design).
- Deploy resulting contracts to Chainweb EVM.
- Check for compatibility and quirks specific to Chainweb + Reth.

---

## 3. Invalid Transaction Testing

**File:** `tx.test.ts`

Create and submit transactions that intentionally fail:

- ❌ Reused nonce
- ❌ Gas too low
- ❌ Invalid signature

Log and validate the resulting error messages from Chainweb EVM.

---

## 4. Large Contract Deployment

**File:** `large.test.ts`

- Attempt to deploy a contract larger than 24 KB.
- Test whether Chainweb EVM accepts the code or returns a size-related rejection.
- Analyze gas usage and block acceptance behavior.

---

## Notes

- All tests target Chainweb EVM via Reth.
- Use Hardhat for local development and contract interaction.
- Consider adding these tests to a CI flow or benchmarking script for automated EVM compatibility checks.
