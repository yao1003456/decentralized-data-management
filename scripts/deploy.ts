import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const DecentralizedDataManagement = await ethers.getContractFactory("DecentralizedDataManagement");
    const contract = await DecentralizedDataManagement.deploy();

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    // Get deployment block number
    const deploymentTx = contract.deploymentTransaction();
    let deployBlock = 0;
    if (deploymentTx) {
        const receipt = await deploymentTx.wait();
        if (receipt) {
            deployBlock = receipt.blockNumber;
        }
    }

    console.log("DecentralizedDataManagement deployed to:", contractAddress);
    console.log("Deployment Block:", deployBlock);

    // Update .env files
    const clientEnvPath = path.join(__dirname, "../../distributed-client/.env.local");
    const serverEnvPath = path.join(__dirname, "../../distributed-server/.env.local");

    updateEnvFile(clientEnvPath, "VITE_CONTRACT_ADDRESS", contractAddress);
    updateEnvFile(clientEnvPath, "VITE_DEPLOY_BLOCK", deployBlock.toString());

    updateEnvFile(serverEnvPath, "CONTRACT_ADDRESS", contractAddress);
}

function updateEnvFile(filePath: string, key: string, value: string) {
    let content = "";
    if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, "utf-8");
    }

    const regex = new RegExp(`^${key}=.*`, "m");
    if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
    } else {
        content += `\n${key}=${value}`;
    }

    fs.writeFileSync(filePath, content.trim() + "\n");
    console.log(`Updated ${key} in ${filePath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
