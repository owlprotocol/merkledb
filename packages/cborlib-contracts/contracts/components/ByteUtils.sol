//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

/**
 * @dev Helpful byte utility functions.
 *
 */
library ByteUtils {

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
    ) internal view returns (
        bytes memory slicedData
    ) {
        // Slice our bytes
        for (uint i = start; i < end; i++)
            slicedData = abi.encodePacked(slicedData, data[i]);
    }

    /**
     * @dev Converts a dynamic bytes array to a uint256
     * @param data dynamic bytes array
     * @return value calculated uint256 value
     */
    function bytesToUint256(
        bytes memory data
    ) internal view returns (
        uint256 value
    ) {
        for (uint i = 0; i < data.length; i++)
            value += uint8(data[i])*(2**(8*(data.length-(i+1))));
    }

    /*
     The following function has been written by Alex Beregszaszi, use it under the terms of the MIT license
    */
    function copyBytes(bytes memory _from, uint _fromOffset, uint _length, bytes memory _to, uint _toOffset) internal view returns (bytes memory _copiedBytes) {
        uint minLength = _length + _toOffset;
        require(_to.length >= minLength); // Buffer too small. Should be a better way?
        uint i = 32 + _fromOffset; // NOTE: the offset 32 is added to skip the `size` field of both bytes variables
        uint j = 32 + _toOffset;
        while (i < (32 + _fromOffset + _length)) {
            assembly {
                let tmp := mload(add(_from, i))
                mstore(add(_to, j), tmp)
            }
            i += 32;
            j += 32;
        }
        return _to;
    }

    /*
     The following function has been written by the Oraclize API team, use it under the terms of the MIT license
    */
    function strCompare(string memory _a, string memory _b) internal view returns (int _returnCode) {
        bytes memory a = bytes(_a);
        bytes memory b = bytes(_b);
        uint minLength = a.length;
        if (b.length < minLength) {
            minLength = b.length;
        }
        for (uint i = 0; i < minLength; i ++) {
            if (a[i] < b[i]) {
                return -1;
            } else if (a[i] > b[i]) {
                return 1;
            }
        }
        if (a.length < b.length) {
            return -1;
        } else if (a.length > b.length) {
            return 1;
        } else {
            return 0;
        }
    }

    /*
     The following function has been written by the Oraclize API team, use it under the terms of the MIT license
    */
    function parseAddr(string memory _a) internal view returns (address _parsedAddress) {
        bytes memory tmp = bytes(_a);
        uint160 iaddr = 0;
        uint160 b1;
        uint160 b2;
        for (uint i = 2; i < 2 + 2 * 20; i += 2) {
            iaddr *= 256;
            b1 = uint160(uint8(tmp[i]));
            b2 = uint160(uint8(tmp[i + 1]));
            if ((b1 >= 97) && (b1 <= 102)) {
                b1 -= 87;
            } else if ((b1 >= 65) && (b1 <= 70)) {
                b1 -= 55;
            } else if ((b1 >= 48) && (b1 <= 57)) {
                b1 -= 48;
            }
            if ((b2 >= 97) && (b2 <= 102)) {
                b2 -= 87;
            } else if ((b2 >= 65) && (b2 <= 70)) {
                b2 -= 55;
            } else if ((b2 >= 48) && (b2 <= 57)) {
                b2 -= 48;
            }
            iaddr += (b1 * 16 + b2);
        }
        return address(iaddr);
    }


}
