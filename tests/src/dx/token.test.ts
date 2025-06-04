import path from 'path'
import { beforeAll, it, expect } from 'bun:test'
import hre, { ethers } from 'hardhat'
import type { Contract } from 'ethers'

// let token: Contract
let ownerAddress: string
let receiverAddress: string

beforeAll(async () => {
  // preperation steps
  process.chdir(path.resolve(__dirname, '../../'))

  // compile the contracts
  await hre.run('compile')

  const [owner, receiver] = await ethers.getSigners()
  ownerAddress = owner.address
  receiverAddress = receiver.address

  console.log('Owner address:', ownerAddress)
  console.log('Receiver address:', receiverAddress)
})

it('Deployment should assign the total supply of tokens to the owner', async function () {
  const [owner] = await ethers.getSigners()

  const hardhatToken = await ethers.deployContract('Token')
  const tx = await hardhatToken.deploymentTransaction()
  console.log('Token deployed at:', hardhatToken.target)

  if (!tx) {
    throw new Error('Deployment transaction is undefined')
  }
  console.log('Deployment tx hash:', tx.hash)
  const receipt = await tx.wait()
  if (!receipt) {
    throw new Error('Deployment receipt is undefined')
  }
  console.log(' > gas used:', receipt.gasUsed.toString())
  console.log(' > block number:', receipt.blockNumber)

  const ownerBalance = await hardhatToken.balanceOf(owner.address)
  expect(await hardhatToken.totalSupply()).toBe(ownerBalance)
})

it('Should transfer tokens between accounts', async function () {
  const [_, addr1, addr2] = await ethers.getSigners()

  const hardhatToken = await ethers.deployContract('Token')

  const amount = 50n

  // Transfer 50 tokens from owner to addr1
  await hardhatToken.transfer(addr1.address, amount)
  expect(await hardhatToken.balanceOf(addr1.address)).toBe(amount)

  // Transfer 50 tokens from addr1 to addr2
  await hardhatToken.connect(addr1).transfer(addr2.address, amount)
  expect(await hardhatToken.balanceOf(addr2.address)).toBe(amount)
})
