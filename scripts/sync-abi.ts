import * as fs from "fs";
import * as path from "path";

const ARTIFACT_PATH = path.join(__dirname, "../artifacts/contracts/Control.sol/DecentralizedDataManagement.json");
const CLIENT_ABI_PATH = path.join(__dirname, "../../distributed-client/src/abi.json");
const SERVER_ABI_PATH = path.join(__dirname, "../../distributed-server/abi.json");

async function main() {
    if (!fs.existsSync(ARTIFACT_PATH)) {
        console.error("Artifact not found. Run 'npx hardhat compile' first.");
        process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf-8"));
    const abi = artifact.abi;

    console.log(`Syncing ABI to client: ${CLIENT_ABI_PATH}`);
    fs.writeFileSync(CLIENT_ABI_PATH, JSON.stringify(abi, null, 2));

    console.log(`Syncing ABI to server: ${SERVER_ABI_PATH}`);
    fs.writeFileSync(SERVER_ABI_PATH, JSON.stringify(abi, null, 2));

    console.log("ABI sync complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
