import { assert } from "chai";
import { ethers } from "hardhat";
import cbor from "cbor";
import { toHex, padLeft, utf8ToHex, toBN, hexToUtf8, numberToHex } from "web3-utils";
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

    it("Basic number encoding/decoding", async function () {
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
            const decodedProfile = await decoder.testDecodeCBORMapping(encodedProfile);

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
