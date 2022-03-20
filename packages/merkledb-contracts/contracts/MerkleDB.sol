//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IMerkleDB.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleDB is IMerkleDB, Ownable {
    bytes32 public merkleRoot;
    bytes32 public merkleTreeIPFS;
    bytes32 public databaseIPFS;

    function merkleProofData(bytes calldata bytesLeaf, bytes32[] calldata path)
        external
        view
        override
        returns (bool)
    {
        return MerkleProof.verify(path, merkleRoot, keccak256(bytesLeaf));
    }

    function updateMerkleDB(
        bytes32 _merkleRoot,
        bytes32 _merkleTreeIPFS,
        bytes32 _databaseIPFS
    ) external override onlyOwner {
        merkleRoot = _merkleRoot;
        merkleTreeIPFS = _merkleTreeIPFS;
        databaseIPFS = _databaseIPFS;

        emit DatabaseUpdate(merkleRoot, merkleTreeIPFS, databaseIPFS);
    }
}
