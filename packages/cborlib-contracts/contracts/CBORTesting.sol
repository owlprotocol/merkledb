//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@ensdomains/buffer/contracts/Buffer.sol";

import "./CBOREncoding.sol";
import "./CBORDecoding.sol";

/**
 * @dev Documentation for contract.
 *
 */
contract CBORTesting {

    using Buffer for Buffer.buffer;


    function createEncoding() public view returns (bytes memory) {
        Buffer.buffer memory buf;
        buf.init(64);

        uint256 myval = 1809251394333065553493296640760748560207343510400633813116524750123642650624;
        CBOREncoding.encodeBigNum(buf, myval);

        // CBOR.encodeString(buf, "some string that's longer than 24 characters!");

        // buf.encode

        // CBOR.encodeUInt(buf, myval);

        console.log("encoded data: %s", myval);

        return buf.buf;
    }

    function decodeBytes(bytes memory encoding) public view returns (bytes[2][] memory decodedData) {
        return CBORDecoding.decodeCBOR(encoding);
    }


}
