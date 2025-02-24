const { Contract, ContractFactory } = require("ethers");
const { ethers } = require("hardhat");
const { deployContracts } = require("../test/utils/utils");

async function main() {
  await deployContracts();
}

main()
  .then(() => process.exit(0)) // Exiting the process if deployment is successful.
  .catch((error) => {
    console.error(error); // Logging any errors encountered during deployment.
    process.exit(1); // Exiting the process with an error code.
  });
