//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMerkleDB {
    event MerkleUpdate(bytes32 merkleRoot);

    function merkleProofData(bytes calldata bytesLeaf, bytes32[] calldata path)
        external
        view
        returns (bool);

    function updateMerkle(bytes32 _merkleRoot) external;
}
