//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

/**
 * @dev Solidity library built for decoding CBOR data.
 *
 */
library CBORDecoding {

    uint8 constant private MAJOR_BITMASK = uint8(0xe0); // 11100000
    uint8 constant private SHORTCOUNT_BITMASK = ~MAJOR_BITMASK; // 00011111

    // Major Data Types
    enum CBORMajorType {
        UnsignedInteger,
        NegativeInteger,
        ByteString,
        TextString,
        Array,
        Map,
        TagOfNumber,
        SimpleFloat
    }

    // Returned Data
    struct CBORData {
        CBORMajorType valueType;
        bytes value;
    }

    /**
     * @dev Parses an encoded CBOR dynamic bytes array into it's array of data
     * @param encoding Encoded CBOR bytes data
     * @return decodedData Decoded CBOR data (returned in structs).
     * Interpretting this bytes data from bytes to it's proper object is up
     * to the implementer.
     */
    function decodeCBOR(
        bytes memory encoding
    ) public view returns(
        CBORData[] memory decodedData
    ) {
        uint totalKeys;

        // Scan array length (get total keys)
        for (uint key = 0; key < encoding.length; ) {
            // See what our field looks like
            (/*uint8 majorType*/, uint8 shortCount) = parseFieldEncoding(encoding[key]);
            // Skip to the next key definition, increment keys counter
            key += getDataLength(shortCount) + 1;
            totalKeys++;

            if (key >= encoding.length) break;
        }

        // Allocate new array
        decodedData = new CBORData[](totalKeys);
        uint itemIdx = 0;

        // Loop through adding data to array
        for (uint key = 0; key < encoding.length; key++) {
            // See what our field looks like
            (uint8 majorType, uint8 shortCount) = parseFieldEncoding(encoding[key]);
            // NOTE - here is where we would impelemnt indefinite length types
            uint dataLength = getDataLength(shortCount);
            // Save our data
            CBORData memory item;
            item.valueType = CBORMajorType(majorType);
            item.value = sliceBytesMemory(encoding, key+1, key+1+dataLength);
            decodedData[itemIdx] = item;
            // Skip to the next key definition
            itemIdx++;
            key += dataLength + 1;
        }

    }

    /**
     * @dev Parses a CBOR byte into major type and short count.
     * See https://en.wikipedia.org/wiki/CBOR for reference.
     * @param fieldEncoding the field to encode
     * @return majorType corresponding data type (see RFC8949 section 3.2)
     * @return shortCount corresponding short count (see RFC8949 section 3)
     */
    function parseFieldEncoding(
        bytes1 fieldEncoding
    ) internal pure returns (
        uint8 majorType,
        uint8 shortCount
    ) {
        uint8 types = uint8(fieldEncoding);

        majorType = (types & MAJOR_BITMASK) >> 5;
        shortCount = types & SHORTCOUNT_BITMASK;
    }

    /**
     * @dev Returns the length (in bytes) of a field value
     * @param shortCount corresponding short count (see RFC8949 section 3)
     * @return dataLength corresponding length (in bytes) of data values
     */
    function getDataLength(
        uint8 shortCount
    ) internal view returns (
        uint dataLength
    ) {
        console.log("Short Count: %s", shortCount);
        // How far does our data extend (skip to the next key)
        if (shortCount < 24)
            // 
            dataLength = 0;
        if (shortCount == 24) dataLength += 1;
        else if (shortCount == 25) dataLength += 2;
        else if (shortCount == 26) dataLength += 4;
        else if (shortCount == 27) dataLength += 8;
        else if (shortCount == 31)
            revert("Indefinite length not yet implemented!");
        else
            revert("Unimplemented CBOR implementations");
    }

    /**
     * @dev Slices a dynamic bytes object from start:end (non-inclusive end)
     * @param start position to start byte slice (inclusive)
     * @param end position to end byte slice (non-inclusive)
     * @return slicedData dynamic sliced bytes object
     */
    function sliceBytesMemory(
        bytes memory data,
        uint start,
        uint end
    ) internal pure returns (
        bytes memory slicedData
    ) {
        // Slice our bytes
        for (uint i = start; i < end; i++)
            slicedData = abi.encodePacked(slicedData, data[i]);
    }

}
