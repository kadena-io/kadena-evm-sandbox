import fs from 'fs'
import path from 'path'
import { describe, beforeAll, it, expect } from 'bun:test'
import hre, { ethers } from 'hardhat'

const contractsDir = path.resolve(__dirname, '../../contracts')
const largeSolPath = path.join(contractsDir, 'Large.sol')

// ~35 KB of nonsense functions
function generateLargeSource(fnCount = 500) {
  let funcs = ''
  for (let i = 0; i < fnCount; i++) {
    funcs += `    function f${i}() public pure returns (uint256) { return ${i}; }\n`
  }
  return `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Large {
${funcs}
}
`
}

describe('Oversized contract error scenarios', () => {
  beforeAll(async () => {
    if (!fs.existsSync(contractsDir)) fs.mkdirSync(contractsDir)
    fs.writeFileSync(largeSolPath, generateLargeSource(500), 'utf8')

    process.chdir(path.resolve(__dirname, '../../'))
    await hre.run('compile')
  })

  it('rejects deployment of a >24 KB contract', async () => {
    const factory = await ethers.getContractFactory('Large')
    // instead of `await factory.deploy()` which throws, we assert the throw
    await expect(factory.deploy()).rejects.toThrow(
      /trying to deploy a contract whose code is too large/i
    )
  })

  it('rejects estimateGas for an >24 KB deployment', async () => {
    const factory = await ethers.getContractFactory('Large')
    const unsignedTx = await factory.getDeployTransaction()
    await expect(ethers.provider.estimateGas(unsignedTx)).rejects.toThrow(
      /trying to deploy a contract whose code is too large/i
    )
  })
})
