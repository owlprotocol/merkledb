import { assert } from "chai";
import { ethers } from "hardhat";
import cbor from "cbor";
import { toHex, padLeft } from "web3-utils";
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

        let number = 10;
        assert.equal(
            (await decoder.decodeBytes(cbor.encode(number)))[0].value,
            padLeft(toHex(number), 2),
            "decoding failed!"
        );

        number = 100_000;
        assert.equal(
            (await decoder.decodeBytes(cbor.encode(number)))[0].value,
            padLeft(toHex(number), 8),
            "decoding failed!"
        );

        number = -100;
        console.log(cbor.encode(number).toString("hex"));
        assert.equal(
            (await decoder.decodeBytes(cbor.encode(number)))[0].value,
            toHex(number),
            "decoding failed!"
        );
    });
});
