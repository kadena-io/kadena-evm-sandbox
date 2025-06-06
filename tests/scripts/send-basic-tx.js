import pkg from 'hardhat';
const { ethers, chainweb } = pkg;

async function main() {
  console.log('Testing basic transaction functionality');

  // Get the first chain ID
  const chainId = (await chainweb.getChainIds())[0];
  console.log(`Testing on chain ${chainId}`);

  // Switch to the first chain
  await chainweb.switchChain(chainId);

  // Get signer
  const [signer1, signer2] = await ethers.getSigners();
  console.log(`Using signers: ${signer1.address} and ${signer2.address}`);

  // Get balance
  const balance = await ethers.provider.getBalance(signer1.address);
  console.log(`Signer1 balance: ${ethers.formatEther(balance)} KDA`);

  try {
    // Send a small amount to self with explicit gas values
    // const tx = await signer1.sendTransaction({
    //   to: signer2.address,
    //   value: ethers.parseEther('0.0001'),
    //   gasLimit: 21000,
    //   gasPrice: ethers.parseUnits('10', 'gwei'),
    // });
    const tx = await signer1.sendTransaction({
      to: signer2.address,
      value: ethers.parseEther("0.0001"),
      gasLimit: 21000,
    });
    // const tx = await signer1.sendTransaction({
    //   to: signer2.address,
    //   value: ethers.parseEther("0.0001"),
    //   gasLimit: 21000,
    //   maxFeePerGas: ethers.parseUnits("20", "gwei"),        // Maximum total fee per gas
    //   maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")  // Tip for miners
    // });

    console.log(`Transaction sent: ${tx.hash}`);

    // Poll for receipt with timeout
    console.log('Waiting for receipt...');

    // Wait with timeout
    const timeoutMs = 180000; // 180 seconds
    const startTime = Date.now();

    while (true) {
      try {
        // Try to get receipt
        const receipt = await ethers.provider.getTransactionReceipt(tx.hash);

        if (receipt) {
          console.log(`Transaction mined in block ${receipt.blockNumber}`);
          console.log(
            `Transaction status: ${receipt.status ? 'success' : 'failed'}`
          );
          return;
        }
      } catch (error) {
        // Ignore errors when polling
      }

      // Wait a bit before trying again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Still waiting...');
    }

    console.log('Timeout reached! Transaction may still be pending.');
    console.log(
      `You can check the transaction status later with the hash: ${tx.hash}`
    );
  } catch (error) {
    console.error('Error sending transaction:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
