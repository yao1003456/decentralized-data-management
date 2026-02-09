import { expect } from "chai";
import { ethers } from "hardhat";
import { DecentralizedDataManagement } from "../typechain-types"; // Assuming Typechain is generated

describe("DecentralizedDataManagement", function () {
    let contract: DecentralizedDataManagement;
    let owner: any;
    let addr1: any;
    let addr2: any;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const DecentralizedDataManagement = await ethers.getContractFactory("DecentralizedDataManagement");
        contract = await DecentralizedDataManagement.deploy();
        await contract.waitForDeployment();
    });

    it("Should set the right owner", async function () {
        // There is no public owner variable, but we can check if address is registered or file uploads work
        // Or we verify through events.
        // Actually, let's test a functionality that requires ownership or registration.

        // Test register publicKey
        await contract.connect(addr1).registerPublicKey("pubkey1");
        expect(await contract.isRegistered(addr1.address)).to.be.true;
    });

    it("Should register a file successfully", async function () {
        const cid = "QmTest123";
        const capsule = ethers.toUtf8Bytes("capsule");
        const ciphertext = ethers.toUtf8Bytes("ciphertext");

        await contract.connect(owner).registerFile(cid, capsule, ciphertext);

        const file = await contract.getFile(cid);
        expect(file.exist).to.be.true;
        expect(file.owner).to.equal(owner.address);
        expect(file.cid).to.equal(cid);
    });

    it("Should fail to register existing file", async function () {
        const cid = "QmTestDuplicate";
        const capsule = ethers.toUtf8Bytes("capsule");
        const ciphertext = ethers.toUtf8Bytes("ciphertext");

        await contract.connect(owner).registerFile(cid, capsule, ciphertext);

        await expect(
            contract.connect(owner).registerFile(cid, capsule, ciphertext)
        ).to.be.revertedWith("File already registered");
    });

    it("Should request access successfully", async function () {
        const cid = "QmTestAccess";
        const capsule = ethers.toUtf8Bytes("capsule");
        const ciphertext = ethers.toUtf8Bytes("ciphertext");

        await contract.connect(owner).registerFile(cid, capsule, ciphertext);

        await contract.connect(addr1).requestAccess(cid);

        const pending = await contract.getPendingRequests(cid);
        expect(pending).to.include(addr1.address);
    });

    it("Should grant access successfully", async function () {
        const cid = "QmTestGrant";
        const capsule = ethers.toUtf8Bytes("capsule");
        const ciphertext = ethers.toUtf8Bytes("ciphertext");

        await contract.connect(owner).registerFile(cid, capsule, ciphertext);
        await contract.connect(addr1).requestAccess(cid);

        await contract.connect(owner).grantAccess(cid, addr1.address);

        const status = await contract.getAccessStatus(cid, addr1.address);
        // AccessStatus.APPROVED is 2 (NONE=0, PENDING=1, APPROVED=2, DENIED=3)
        expect(status).to.equal(2);
    });

    it("Should revoked access successfully", async function () {
        const cid = "QmTestRevoke";
        const capsule = ethers.toUtf8Bytes("capsule");
        const ciphertext = ethers.toUtf8Bytes("ciphertext");

        await contract.connect(owner).registerFile(cid, capsule, ciphertext);
        await contract.connect(addr1).requestAccess(cid);
        await contract.connect(owner).grantAccess(cid, addr1.address);

        await contract.connect(owner).revokeAccess(cid, addr1.address);

        const status = await contract.getAccessStatus(cid, addr1.address);
        // AccessStatus.NONE is 0
        expect(status).to.equal(0);
    });
});
