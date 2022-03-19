import { expect } from "chai";
import { ethers } from "hardhat";
//@ts-ignore
import { Merk, verifyProof } from "merk";

describe("Greeter", function () {
    it("Should return the new greeting once it's changed", async function () {
        const Greeter = await ethers.getContractFactory("Greeter");
        const greeter = await Greeter.deploy("Hello, world!");
        await greeter.deployed();

        expect(await greeter.greet()).to.equal("Hello, world!");

        const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

        // wait until the transaction is mined
        await setGreetingTx.wait();

        expect(await greeter.greet()).to.equal("Hola, mundo!");
    });
});

describe("MerkleDB", () => {
    it("Should verify merkle proof", async () => {
        const MerkleDB = await ethers.getContractFactory("MerkleDB");
        const merkleDB = await MerkleDB.deploy();

        await merkleDB.deployed();

        let keys: Buffer[] = [];
        let values: Buffer[] = [];
        for (let i = 0; i < 256; i++) {
            keys.push(Buffer.from(`key${i}`));
            values.push(Buffer.from(`value${i}`));
        }

        // const db = Merk("state.db");

        // const update = db.batch();

        // keys.forEach((e, i) => update.put(e, values[i]).commitSync());

        // console.log(db.rootHash());
    });
});
