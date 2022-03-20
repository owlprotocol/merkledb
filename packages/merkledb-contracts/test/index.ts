import { expect } from "chai";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "ethers/lib/utils";
import crypto from "crypto";
import { toHex, padLeft } from "web3-utils";

describe("MerkleDB", () => {
    for (let i = 2; i < 256; i++) {
        it(`${i} Should verify merkle proof`, async () => {
            await test(i);
        });
    }
});

async function test(n: number) {
    const MerkleDB = await ethers.getContractFactory("MerkleDB");
    const merkleDB = await MerkleDB.deploy();

    await merkleDB.deployed();

    let valuesRaw: number[] = [];
    for (let i = 0; i < n; i++) {
        valuesRaw.push(i);
    }

    const values = valuesRaw.map((e) => padLeft(toHex(e), 64));

    const tree = new MerkleTree(values, keccak256, {
        hashLeaves: true,
        sortPairs: true,
    });
    const root = tree.getRoot().toString("hex");
    const leaf = values[1];
    const leafHash = keccak256(leaf).toString();
    const proof = tree.getProof(leafHash);
    const verify = tree.verify(proof, leafHash, root);

    expect(verify).to.be.equal(true);

    const randomBytes = crypto.randomBytes(32).toString("hex");

    const update = await merkleDB.updateMerkle("0x" + root, "0x" + randomBytes);
    await update.wait();
    const proofHex = proof.map((e) => "0x" + e.data.toString("hex"));

    const contractVerify = await merkleDB.merkleProofData(leaf, proofHex);

    expect(contractVerify).to.be.equal(true);
}
