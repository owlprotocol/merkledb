//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import { CBORSpec as Spec } from "./components/CBORSpec.sol";
import { CBORPrimitives as Primitives } from "./components/CBORPrimitives.sol";
import { CBORUtilities as Utils } from "./components/CBORUtilities.sol";
import { CBORDataStructures as DataStructures } from "./components/CBORDataStructures.sol";
import "./components/ByteUtils.sol";

/**
 * @dev Solidity library built for decoding CBOR data.
 *
 */
library CBORDecoding {

    /************
     * Mappings *
     ***********/

    /**
     * @dev Parses an encoded CBOR Mapping into a 2d array of data
     * @param encoding Encoded CBOR bytes data
     * @return decodedData Decoded CBOR data (returned in 2d array).
     * Interpretting this bytes data from bytes to it's proper object is up
     * to the implementer.
     */
    function decodeMapping(
        bytes memory encoding
    ) external view returns(
        bytes[2][] memory decodedData
    ) {
        uint cursor = 0;
        // Type check
        (Spec.MajorType majorType, uint8 shortCount) = Utils.parseFieldEncoding(encoding[cursor]);
        require(majorType == Spec.MajorType.Map, "Object is not a mapping!");

        // Decode and return
        decodedData = DataStructures.expandMapping(encoding, cursor, shortCount);
        return decodedData;
    }

    /**********
     * Arrays *
     *********/

    /**
     * @dev Parses an encoded CBOR array into a bytes array of its data
     * @param encoding Encoded CBOR bytes data
     * @return decodedData Decoded CBOR data (returned in array).
     * Interpretting this bytes data from bytes to it's proper object is up
     * to the implementer.
     */
    function decodeArray(
        bytes memory encoding
    ) external view returns(
        bytes[] memory decodedData
    ) {
        uint cursor = 0;
        // Type check
        (Spec.MajorType majorType, uint8 shortCount) = Utils.parseFieldEncoding(encoding[cursor]);
        require(majorType == Spec.MajorType.Array, "Object is not an array!");

        // Decode and return
        decodedData = DataStructures.expandArray(encoding, cursor, shortCount);
        return decodedData;
    }

    /**************
     * Primitives *
     *************/

    /**
     * @dev Parses an encoded CBOR dynamic bytes array into it's array of data
     * @param encoding Encoded CBOR bytes data
     * @return decodedData Decoded CBOR data (returned in structs).
     * Interpretting this bytes data from bytes to it's proper object is up
     * to the implementer.
     */
    function decodePrimitive(
        bytes memory encoding
    ) external view returns(
        bytes memory decodedData
    ) {
        uint cursor = 0;
        // See what our field looks like
        (Spec.MajorType majorType, uint8 shortCount, uint start, uint end, uint next) = Utils.parseField(encoding, cursor);
        require(
            majorType != Spec.MajorType.Array &&
            majorType != Spec.MajorType.Map,
            "Encoding is not a primitive!"
        );

        // Save our data
        decodedData = Utils.extractValue(encoding, majorType, shortCount, start, end);
        return decodedData;
    }

    /********************
     * Helper Functions *
     *******************/

    // /**
    //  * @dev Performs linear search through data for a key
    //  * @param encoding Encoded CBOR bytes data
    //  * @param key Ke
    //  * @return value Decoded CBOR data as bytes.
    //  */
    // function decodeMappingGetValue(
    //     bytes memory encoding,
    //     bytes memory key
    // ) external view returns(
    //     bytes memory value
    // ) {
    //     // Ensure we start with a mapping
    //     bytes32 keyHash = keccak256(key);

    //     // Decode our data
    //     bytes[2][] memory decodedData = decodeMapping(encoding);

    //     // Linear Search
    //     for (uint keyIdx = 0; keyIdx < decodedData.length; keyIdx++)
    //         if (keyHash == keccak256(decodedData[keyIdx][0]))
    //             return decodedData[keyIdx][1];

    //     revert("Key not found!");
    // }

}
