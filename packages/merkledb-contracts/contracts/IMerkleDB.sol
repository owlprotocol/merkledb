//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMerkleDB {
    event DatabaseUpdate(
        bytes32 merkleRoot,
        bytes32 merkleTreeIPFS,
        bytes32 databaseIPFS
    );

    function merkleProofData(bytes calldata bytesLeaf, bytes32[] calldata path)
        external
        view
        returns (bool);

    function updateMerkleDB(
        bytes32 _merkleRoot,
        bytes32 _merkleTreeIPFS,
        bytes32 _databaseIPFS
    ) external;
}
