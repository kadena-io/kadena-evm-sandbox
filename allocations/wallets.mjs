import { ethers } from "ethers";

const rpcUrl = process.env.RPC_URL || "http://localhost:8545"

export const provider = new ethers.JsonRpcProvider(rpcUrl);
export const wallet = ethers.HDNodeWallet.fromSeed(new Uint8Array(16), provider)

// BIP-44:
// Kadena 626 0x80000272
// testnet 1 0x80000001

// allocations
// for (const i of [...Array(6).keys()]) { console.log(wallet.derivePath(`m/44'/1'/0'/0/${i}`).address) }
// 0x8849BAbdDcfC1327Ad199877861B577cEBd8A7b6
// 0xFB8Fb7f9bdc8951040a6D195764905138F7462Ed
// 0x28f2d8ef4e0fe6B2E945cF5C33a0118a30a62354
// 0xa24a79678c9fffEF3E9A1f3cb7e51f88F173B3D5
// 0x47fAE86F6416e6115a80635238AFd2F18D69926B
// 0x87466A8266b9DFB3Dc9180a9c43946c4AB2c2cb2
//
export const genesisAllocation0 = wallet.derivePath("m/44'/1'/0'/0/0").connect(provider)
export const genesisAllocation1 = wallet.derivePath("m/44'/1'/0'/0/1").connect(provider)
export const genesisAllocation2 = wallet.derivePath("m/44'/1'/0'/0/2").connect(provider)
export const genesisAllocation3 = wallet.derivePath("m/44'/1'/0'/0/3").connect(provider)
export const genesisAllocation4 = wallet.derivePath("m/44'/1'/0'/0/4").connect(provider)
export const genesisAllocation5 = wallet.derivePath("m/44'/1'/0'/0/5").connect(provider)
export const genesisAllocation6 = wallet.derivePath("m/44'/1'/0'/0/6").connect(provider)
export const genesisAllocation7 = wallet.derivePath("m/44'/1'/0'/0/7").connect(provider)
export const genesisAllocation8 = wallet.derivePath("m/44'/1'/0'/0/8").connect(provider)
export const genesisAllocation9 = wallet.derivePath("m/44'/1'/0'/0/9").connect(provider)
export const genesisAllocation10 = wallet.derivePath("m/44'/1'/0'/0/10").connect(provider)
export const genesisAllocation11 = wallet.derivePath("m/44'/1'/0'/0/11").connect(provider)
export const genesisAllocation12 = wallet.derivePath("m/44'/1'/0'/0/12").connect(provider)
export const genesisAllocation13 = wallet.derivePath("m/44'/1'/0'/0/13").connect(provider)
export const genesisAllocation14 = wallet.derivePath("m/44'/1'/0'/0/914").connect(provider)
export const genesisAllocation15 = wallet.derivePath("m/44'/1'/0'/0/15").connect(provider)
export const genesisAllocation16 = wallet.derivePath("m/44'/1'/0'/0/16").connect(provider)
export const genesisAllocation17 = wallet.derivePath("m/44'/1'/0'/0/17").connect(provider)
export const genesisAllocation18 = wallet.derivePath("m/44'/1'/0'/0/18").connect(provider)
export const genesisAllocation19 = wallet.derivePath("m/44'/1'/0'/0/19").connect(provider)

export const miner0 = wallet.derivePath("m/44'/1'/1'/0/0").connect(provider)
export const miner1 = wallet.derivePath("m/44'/1'/1'/0/1").connect(provider)

export async function getBalances() {
  return {
    alloc0: await provider.getBalance(genesisAllocation0.address),
    alloc1: await provider.getBalance(genesisAllocation1.address),
    alloc2: await provider.getBalance(genesisAllocation2.address),
    alloc3: await provider.getBalance(genesisAllocation3.address),
    alloc4: await provider.getBalance(genesisAllocation4.address),
    alloc5: await provider.getBalance(genesisAllocation5.address),
    alloc6: await provider.getBalance(genesisAllocation6.address),
    alloc7: await provider.getBalance(genesisAllocation7.address),
    alloc8: await provider.getBalance(genesisAllocation8.address),
    alloc9: await provider.getBalance(genesisAllocation9.address),
    alloc10: await provider.getBalance(genesisAllocation10.address),
    alloc11: await provider.getBalance(genesisAllocation11.address),
    alloc12: await provider.getBalance(genesisAllocation12.address),
    alloc13: await provider.getBalance(genesisAllocation13.address),
    alloc14: await provider.getBalance(genesisAllocation14.address),
    alloc15: await provider.getBalance(genesisAllocation15.address),
    alloc16: await provider.getBalance(genesisAllocation16.address),
    alloc17: await provider.getBalance(genesisAllocation17.address),
    alloc18: await provider.getBalance(genesisAllocation18.address),
    alloc19: await provider.getBalance(genesisAllocation19.address),

    miner0: await provider.getBalance(miner0.address),
    miner1: await provider.getBalance(miner1.address),
  }
}

export const wallets = {
  alloc0: genesisAllocation0,
  alloc1: genesisAllocation1,
  alloc2: genesisAllocation2,
  alloc3: genesisAllocation3,
  alloc4: genesisAllocation4,
  alloc5: genesisAllocation5,
  alloc6: genesisAllocation6,
  alloc7: genesisAllocation7,
  alloc8: genesisAllocation8,
  alloc9: genesisAllocation9,
  alloc10: genesisAllocation10,
  alloc11: genesisAllocation11,
  alloc12: genesisAllocation12,
  alloc13: genesisAllocation13,
  alloc14: genesisAllocation14,
  alloc15: genesisAllocation15,
  alloc16: genesisAllocation16,
  alloc17: genesisAllocation17,
  alloc18: genesisAllocation18,
  alloc19: genesisAllocation19,
  miner0: miner0,
  miner1: miner1,
}
