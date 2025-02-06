import { ethers } from "ethers";
import { provider, wallets, getBalances } from "./wallets.mjs";
import { setTimeout } from 'timers/promises';
import { get } from "http";

async function main() {
  console.log('wallets created:', Object.fromEntries(
    Object.entries(wallets).map(([key, wallet]) => [
      key,
      {
        address: wallet.address,
        privateKey: wallet.privateKey
      }
    ])
  ));
  console.log('balances:', await getBalances());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error running test', error);
    process.exit(1);
  });
