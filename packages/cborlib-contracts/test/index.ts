import { assert, expect } from "chai";
import { ethers } from "hardhat";
import cbor from "cbor";
import { toHex, padLeft, utf8ToHex, toBN, hexToUtf8, numberToHex, leftPad } from "web3-utils";
// eslint-disable-next-line node/no-missing-import, camelcase
import { CBORDecoding__factory, CBORTesting__factory } from "../typechain";

describe("CBOR Decoding", function () {
    // eslint-disable-next-line camelcase
    let CBORTestingFactory: CBORTesting__factory;
    // eslint-disable-next-line camelcase
    let CBORDecodingFactory: CBORDecoding__factory;

    before(async () => {
        CBORDecodingFactory = await ethers.getContractFactory("CBORDecoding");
        CBORTestingFactory = await ethers.getContractFactory("CBORTesting", {
            libraries: {
                CBORDecoding: (await CBORDecodingFactory.deploy()).address,
            },
        });
    });

    it("Basic primitive encoding/decoding", async function () {
        const decoder = await CBORTestingFactory.deploy();

        let value = -1;
        assert.equal(
            (await decoder.testDecodeCBORPrimitive(cbor.encode(value)))[0],
            "0x00",
            "decoding failed!"
        );

        value = 100_000;
        assert.equal(
            (await decoder.testDecodeCBORPrimitive(cbor.encode(value)))[0],
            padLeft(toHex(value), 8),
            "decoding failed!"
        );

        value = -100;
        assert.equal(
            (await decoder.testDecodeCBORPrimitive(cbor.encode(value)))[0],
            "0x63",
            "decoding failed!"
        );

        let stringValue = "im a string";
        assert.equal(
            (
                await decoder.testDecodeCBORPrimitive(cbor.encode(stringValue))
            )[0],
            toHex(stringValue),
            "decoding failed!"
        );

        stringValue = "im a long string".repeat(100);
        assert.equal(
            (
                await decoder.testDecodeCBORPrimitive(cbor.encode(stringValue))
            )[0],
            toHex(stringValue),
            "decoding failed!"
        );
    });

    it("Mapping decoding", async function () {
        const decoder = await CBORTestingFactory.deploy();

        const myMapping = { a: "1", b: "2", c: "3" };
        const decoded = await decoder.testDecodeCBORMapping(
            cbor.encode(myMapping)
        );
        // Assert all keys are equal
        expect(decoded).to.deep.equal(
            Object.entries(myMapping).map(([k, v]) => [
                utf8ToHex(k),
                utf8ToHex(v),
            ])
        );
    });

    it("Array decoding", async function () {
        const decoder = await CBORTestingFactory.deploy();

        const myMapping = [1, 2, 3, 4];
        const decoded = await decoder.testDecodeCBORArray(
            cbor.encode(myMapping)
        );
        console.log(`Decoded: ${decoded}`);
        // Assert all keys are equal
        expect(decoded).to.deep.equal(
            myMapping.map((k) => leftPad(toHex(k), 2))
        );
    });

    it("Nested array", async function () {
        /**
         * Testing is complicated by the fact that CBORDecode is nest-aware, but
         * cannot decode and return a nested object. Instead, it has to decode one
         * layer at a time (due to polymorphism limitations of Solidity).
         */

        const decoder = await CBORTestingFactory.deploy();

        const myMapping = [[1, 2, [3], 4]];

        const myMappingEncoded = cbor.encode(myMapping);
        const decoded = await decoder.testDecodeCBORPrimitive(myMappingEncoded);
        expect(cbor.encode(myMapping[0]).toString("hex")).to.deep.equal(
            decoded[0].slice(2)
        );
    });

    it("Nested mapping", async function () {
        /**
         * Testing is complicated by the fact that CBORDecode is nest-aware, but
         * cannot decode and return a nested object. Instead, it has to decode one
         * layer at a time (due to polymorphism limitations of Solidity).
         */

        const decoder = await CBORTestingFactory.deploy();

        const myMapping = { 1: 2, 3: 4, 5: { 6: 7 }, 7: 8 };

        const myMappingEncoded = cbor.encode(myMapping);
        console.log(`Requesting decode: ${myMappingEncoded.toString("hex")}`);
        const decoded = await decoder.testDecodeCBORMapping(myMappingEncoded);
        console.log(`Decoded: ${JSON.stringify(decoded)}`);
        // expect(cbor.encode(myMapping).toString("hex")).to.deep.equal(
        //     decoded[0].slice(2)
        // );
    });

    it("Linear Search Decoding", async function () {
        const decoder = await CBORTestingFactory.deploy();

        const values = cbor.encode({ a: 1, b: 2, c: 3 });
        // Good call
        await decoder.testDecodeCBORMappingGetValue(values, toHex("a"));
        // Bad call
        const call = decoder.testDecodeCBORMappingGetValue(values, toHex("x"));
        await expect(call).to.be.revertedWith("Key not found!");
    });

    it("Test with game data", async () => {
        const decoder = await CBORTestingFactory.deploy();

        const profiles = [
            {
                id: "1",
                name: "Alice",
                address: "0x0000000000000000000000000000000000000001",
                score: 10,
                balance: "1000000000000000000",
                premium: false,
            },
            {
                id: "2",
                name: "Bob",
                address: "0x0000000000000000000000000000000000000002",
                score: 100,
                balance: "5000000000000000000",
                premium: true,
            },
            {
                id: "3",
                name: "Charlie",
                address: "0x0000000000000000000000000000000000000003",
                score: 50,
                balance: "2000000000000000000",
                premium: false,
            },
        ];

        for (const profile of profiles) {
            const encodedProfile = cbor.encode(profile);
            const decodedProfile = await decoder.testDecodeCBORMapping(
                encodedProfile
            );

            let iteration = 0;
            for (let [key, value] of Object.entries(profile)) {
                // Type checks
                if (typeof value === "boolean") value = Number(value);
                if (typeof value === "string") value = utf8ToHex(value);
                if (typeof value === "number") value = padLeft(toHex(value), 2);

                key = utf8ToHex(key);

                assert.equal(
                    decodedProfile[iteration][0],
                    key,
                    `key mismatch! ${[hexToUtf8(key), value]}`
                );
                assert.equal(
                    decodedProfile[iteration][1],
                    value,
                    `value mismatch! ${[hexToUtf8(key), value]}`
                );
                iteration++;
            }
        }
    });
});
