//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IMerkleDB.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "hardhat/console.sol";

contract MerkleDB is IMerkleDB {
    bytes32 public merkleRoot;
    bytes32 public merkleTreeIPFS;
    bytes32 public databaseIPFS;

    function merkleProofData(bytes calldata bytesLeaf, bytes32[] calldata path)
        external
        view
        override
        returns (bool)
    {
        bool res = MerkleProof.verify(path, merkleRoot, keccak256(bytesLeaf));
        console.log(res);
        return res;
    }

    function updateMerkleDB(
        bytes32 _merkleRoot,
        bytes32 _merkleTreeIPFS,
        bytes32 _databaseIPFS
    ) external override {
        merkleRoot = _merkleRoot;
        merkleTreeIPFS = _merkleTreeIPFS;
        databaseIPFS = _databaseIPFS;

        emit DatabaseUpdate(merkleRoot, merkleTreeIPFS, databaseIPFS);
    }
}
