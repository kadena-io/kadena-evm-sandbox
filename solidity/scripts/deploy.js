const { ethers, chainweb } = require('hardhat');

async function main() {
  const verificationDelay = 10000; // Delay in milliseconds before verification
  const [deployer] = await ethers.getSigners();

  const deployed = await chainweb.deployContractOnChains({
    name: 'SimpleToken',
    constructorArgs: [ethers.parseUnits('1000000'), deployer.address],
  });


  if (deployed.deployments.length === 0) {
    console.log('No contracts deployed');
    return;
  }

  console.log('Contracts deployed');

  deployed.deployments.forEach(async (deployment) => {
    console.log(`${deployment.address} on ${deployment.chain}`);
  });

  await chainweb.runOverChains(async (chainId) => {
    // Find the deployment for this specific chain
    const deployment = deployed.deployments.find(d => d.chain === chainId);

    if (!deployment) {
      console.log(`No deployment found for chain ${chainId}, skipping verification`);
      return;
    }

    const contractAddress = deployment.address;

    // Now handle verification
    // Check if we're on a local network
    const isLocalNetwork = network.name.includes('hardhat') || network.name.includes('localhost');

    // Skip verification for local networks
    if (isLocalNetwork) {
      console.log(`Skipping contract verification for local network: ${network.name}`);
    } else {
      try {
        console.log(`Waiting ${verificationDelay / 1000} seconds before verification...`);

        // Optional delay for verification API to index the contract
        if (verificationDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, verificationDelay));
        }

        console.log(`Attempting to verify contract ${contractAddress} on chain ${chainId}...`);
        await run("verify:verify", {
          address: contractAddress,
          constructorArguments: [ethers.parseUnits('1000000'), deployer.address]
        });

        console.log(`✅ Contract successfully verified on chain ${chainId}`);

      } catch (verifyError) {
        console.error(`Error verifying contract on chain ${chainId}:`, verifyError.message);
      }
    }
  });






  console.log("SimpleToken deployment process completed");
}

main()
  .then(() => process.exit(0)) // Exiting the process if deployment is successful.
  .catch((error) => {
    console.error(error); // Logging any errors encountered during deployment.
    process.exit(1); // Exiting the process with an error code.
  });