const { expect } = require('chai');
const { ethers, chainweb, artifacts } = require('hardhat');
const crypto = require('crypto');
const { getSigners } = require('./utils/utils');
const { hexlify } = require('ethers');
const { switchChain, getChainIds } = chainweb;

const CREATE2_DEPLOYER = '0x4e59b44847b379578588920cA78FbF26c0B4956C';
const CREATE2_BYTECODE = "0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3";

describe('Deploy SimpleToken via CREATE2 factory', async function () {
  const salt = '0x' + crypto.randomBytes(32).toString('hex');
  const contracts = [];

  before(async function () {
    console.log(`Using salt: ${salt}`);
    await chainweb.runOverChains(async (chain) => {
      const signers = await getSigners(chain);
      const deployer = signers.deployer;

      // Setup Contract Deployment Parameters and compute init code
      console.log(`Compute Contract Init Code`);
      const SimpleToken = await ethers.getContractFactory('SimpleToken', deployer);
      const constructorArgs = [ethers.parseUnits('1000000'), deployer.address];
      const encodedConstructorArgs = SimpleToken.interface.encodeDeploy(constructorArgs);
      const initCode = ethers.concat([SimpleToken.bytecode, encodedConstructorArgs]);

      // Expected address
      const address = ethers.getCreate2Address(
        CREATE2_DEPLOYER,
        salt,
        ethers.keccak256(initCode)
      );
      console.log(`Expected address: ${address}`);
      contracts.push({chain, initCode, address, salt});
    });
  });

  it('Should have the same address on all chains', async function () {
    const chainIds = await getChainIds();
    console.log(`Chains: ${chainIds}`);
    const expectedAddress = contracts[0].address;
    for (let i=1; i<contracts.length; i++) {
      expect(hexlify(contracts[i].address)).to.equal(hexlify(expectedAddress));
    }
    console.log(`Expected address on all chains: ${expectedAddress}`);
  });

  it('Should have CREATE2 factory deployed', async function () {
    await chainweb.runOverChains(async (chain) => {
      const signers = await getSigners(chain);
      const provider = signers.deployer.provider;
      const code = await provider.getCode(CREATE2_DEPLOYER);
      expect(code).to.not.equal('0x');
    });
  });

  it('Should have the expected bytecode for CREATE2 factory', async function () {
    await chainweb.runOverChains(async (chain) => {
      const signers = await getSigners(chain);
      const provider = signers.deployer.provider;
      await switchChain(chain);
      const code = await provider.getCode(CREATE2_DEPLOYER);
      expect(code).to.equal(CREATE2_BYTECODE);
    });
  });

  it('Should deploy at the expected address', async function () {
    await chainweb.runOverChains(async (chain) => {
      const contract = contracts.find(d => d.chain === chain);
      const signers = await getSigners(chain);
      const deployer = signers.deployer;
      const address = await deployer.call({
        to: CREATE2_DEPLOYER,
        data: ethers.concat([contract.salt, contract.initCode])
      });
      console.log(`address: ${JSON.stringify(address)}`);
      expect(hexlify(address)).to.equal(hexlify(contract.address));
    });
  });

  it('Should deploy SimpleToken contracts via CREATE2 factory', async function () {
    const txs = await chainweb.runOverChains(async (chain) => {
      const contract = contracts.find(d => d.chain === chain);
      const signers = await getSigners(chain);
      const deployer = signers.deployer;
      console.log(`Deploying SimpleToken on chain ${chain} via CREATE2 factory...`);
      const tx = await deployer.sendTransaction({
        to: CREATE2_DEPLOYER,
        data: ethers.concat([contract.salt, contract.initCode])
      });
      tx.chainwebChainid = chain;
      return tx;
    });

    for (let tx of txs) {
      console.log(`awaiting transaction result of transaction ${tx.hash} on chain ${tx.chainwebChainid}`);
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    }
    console.log(`Deployed SimpleToken on all chains`);
  });

  it('Should have deployed code at the address', async function () {
    await chainweb.runOverChains(async (chain) => {
      const contract = contracts.find(d => d.chain === chain);
      const deployedCode = await ethers.provider.getCode(contract.address);
      expect(deployedCode).to.not.equal('0x');
    });
  });

  it('Should call the deployed SimpleToken contract', async function () {
    await chainweb.runOverChains(async (chain) => {
      const contract = contracts.find(d => d.chain === chain);
      const signers = await getSigners(chain);
      const deployer = signers.deployer;
      const simpleToken = new ethers.Contract(
        contract.address,
        await artifacts.readArtifact('SimpleToken').then(a => a.abi),
        deployer
      );
      const name = await simpleToken.name();
      expect(name).to.equal('SimpleToken');
      const symbol = await simpleToken.symbol();
      expect(symbol).to.equal('SIM');
      const totalSupply = await simpleToken.totalSupply();
      expect(totalSupply).to.equal(ethers.parseUnits('1000000'));
      const balance = await simpleToken.balanceOf(deployer.address);
      expect(balance).to.equal(ethers.parseUnits('1000000'));
    });
  });
});


