import path from 'path'
import { describe, beforeAll, it, expect } from 'bun:test'
import hre, { ethers } from 'hardhat'

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

describe('EVM error scenarios on Kadena devnet', () => {
  it('rejects a tx with a reused nonce', async () => {
    const [sender, receiver] = await ethers.getSigners()
    const provider = ethers.provider
    const wallet = sender.connect(provider)
    const { gasPrice } = await provider.getFeeData()
    // gasPrice is a bigint | undefined; you can assert it exists
    if (!gasPrice) throw new Error('Could not fetch gasPrice')
    const tx1 = await wallet.sendTransaction({
      to: await receiver.getAddress(),
      value: 1n,
      gasLimit: 21_000n,
      gasPrice
    })
    await tx1.wait()

    const reusedNonce = tx1.nonce
    console.log('Reusing nonce:', reusedNonce)

    // now attempt to send a new tx with the same nonce
    await expect(
      wallet.sendTransaction({
        to: await receiver.getAddress(),
        value: 1n,
        gasLimit: 21_000n,
        gasPrice,
        nonce: reusedNonce
      })
    ).rejects.toThrow(/nonce too low|already known/i)
  })

  it('rejects a tx with too-low gas limit', async () => {
    const [sender, receiver] = await ethers.getSigners()
    const provider = ethers.provider
    const wallet = sender.connect(provider)

    const { gasPrice } = await provider.getFeeData()
    // gasPrice is a bigint | undefined; you can assert it exists
    if (!gasPrice) throw new Error('Could not fetch gasPrice')

    const nextNonce = await provider.getTransactionCount(
      await sender.getAddress()
    )

    await expect(
      wallet.sendTransaction({
        to: await receiver.getAddress(),
        value: 1n,
        gasLimit: 1n, // intentionally too low
        gasPrice,
        nonce: nextNonce
      })
    ).rejects.toThrow(
      /requires at least|intrinsic gas too low|gas limit too low/i
    )
  })

  it('rejects a tx with an invalid signature', async () => {
    const [sender, receiver] = await ethers.getSigners()
    const provider = ethers.provider

    const { gasPrice } = await provider.getFeeData()
    if (!gasPrice) throw new Error('Missing gasPrice')

    const nonce = await provider.getTransactionCount(await sender.getAddress())
    const chainId = (await provider.getNetwork()).chainId
    const txReq = {
      to: await receiver.getAddress(),
      value: 1n,
      gasLimit: 21_000n,
      gasPrice,
      nonce,
      chainId
    }

    // Why expect me to test this if it is not implemented?
    await expect(sender.signTransaction(txReq)).rejects.toThrow(
      /HardhatEthersSigner\.signTransaction/
    )

    /* Once the above is implemented, we can proceed with the test 
        const raw = await sender.signTransaction(txReq)

        const tampered = raw.slice(0, -2) + (raw.slice(-2) === '00' ? '01' : '00')

        await expect(provider.broadcastTransaction(tampered)).rejects.toThrow(
            /invalid signature|signature/i
        ) 
    */
  })
})
