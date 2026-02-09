import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const DecentralizedDataManagement = await ethers.getContractFactory("DecentralizedDataManagement");
    const contract = await DecentralizedDataManagement.deploy();

    await contract.waitForDeployment();

    console.log("DecentralizedDataManagement deployed to:", await contract.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
