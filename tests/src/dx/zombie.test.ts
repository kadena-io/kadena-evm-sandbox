import path from 'path'
import { beforeAll, it, expect } from 'bun:test'
import hre, { ethers } from 'hardhat'
import type { Contract } from 'ethers'

let factory: Contract
let ownerAddress: string

beforeAll(async () => {
  process.chdir(path.resolve(__dirname, '../../'))

  await hre.run('compile')

  const allContracts = await hre.artifacts.getAllFullyQualifiedNames()
  console.log('Compiled contracts:', allContracts)

  const [owner] = await ethers.getSigners()
  ownerAddress = owner.address
  console.log('Owner address:', ownerAddress)

  factory = (await ethers.deployContract(
    'ZombieFactory'
  )) as unknown as Contract & {
    deploymentTransaction(): Promise<import('ethers').ContractTransaction>
  }

  const tx = await factory.deploymentTransaction()
  if (!tx) throw new Error('Deployment transaction is undefined')
  const receipt = await tx.wait()
  if (!receipt) throw new Error('Deployment receipt is undefined')

  // logging
  console.log(`ZombieFactory deployed at ${factory.target ?? factory.address}`)
  console.log(`   txHash=${tx.hash}  gasUsed=${receipt.gasUsed.toString()}`)

  const network = await ethers.provider.getNetwork()
  console.log('Network:', network.name, `chainId=${network.chainId}`)

  const blockNumber = await ethers.provider.getBlockNumber()
  console.log('Current block number:', blockNumber)

  const feeData = await ethers.provider.getFeeData()
  console.log('Gas price:', feeData.gasPrice?.toString())
})

it('has the proper DNA settings baked in', async () => {
  const dnaDigits = await factory.dnaDigits()
  const dnaModulus = await factory.dnaModulus()

  expect(dnaDigits).toBe(16n)
  expect(dnaModulus).toBe(10n ** dnaDigits)
})

it('creates a random zombie and emits NewZombie', async () => {
  const name = 'Alice'
  const tx = await factory.createRandomZombie(name)
  const receipt = await tx.wait()

  console.log('zombie created:', name)
  console.log(`   txHash=${tx.hash}  gasUsed=${receipt.gasUsed.toString()}`)
  console.log('   blockNumber=', receipt.blockNumber)

  const [log] = await factory.queryFilter(
    factory.filters.NewZombie(null, null, null),
    receipt.blockNumber,
    receipt.blockNumber
  )
  expect(log).toBeDefined()

  if ('args' in log && log.args) {
    const { zombieId, name: eventName, dna } = log.args
    expect(zombieId).toBe(0n)
    expect(eventName).toBe(name)
    expect(dna).toBeLessThan(await factory.dnaModulus())
  } else {
    throw new Error('Log does not contain event arguments')
  }
})

it('zombies array contains our new zombie', async () => {
  const [zName, zDna] = await factory.zombies(0)
  expect(zName).toBe('Alice')
  expect(zDna).toBeLessThan(await factory.dnaModulus())
})
