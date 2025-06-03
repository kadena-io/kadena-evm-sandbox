import { describe, it, beforeAll, expect } from 'bun:test'
import hre, { ethers } from 'hardhat'
import type { Contract, ContractFactory } from 'ethers'
import hardhat from 'hardhat'

let TokenFactory: ContractFactory
let token: Contract

beforeAll(async () => {
  // 1️⃣ Ensure the contracts are compiled under your hardhat.config.ts
  await hre.run('compile')

  console.log('-preparing to deploy token contract-')
  const [signer] = await hardhat.ethers.getSigners()
  const account = signer?.address!
  console.log('checking balance for account:', account)
  const balance = await hardhat.ethers.provider.getBalance(account)
  console.log(`Balance for account ${account}:`, balance.toString())

  TokenFactory = await ethers.getContractFactory('Token')
  console.log('TokenFactory:', TokenFactory)
})
