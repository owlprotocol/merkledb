import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { IPFS } from 'ipfs';
import MerkleDBArtifact from '../artifacts/contracts/MerkleDB.sol/MerkleDB.json';
import OrbitDBManager from './OrbitDBManager';
import toMerkleTree from '../utils/toMerkleTree';

interface SenderParams {
    from: string;
    nonce: number;
}
/**
 *
 * @param db OrbitDB KV Database
 */
export function snapshotOrbitDB(db: any, ipfs: IPFS, merkleDB: Contract, senderOptions: SenderParams) {
    return new Promise(async (resolve) => {
        //TODO: Handle op (currently assumes only PUT)
        const rows = Object.values(db.all).map((v: any) => v.payload.value);
        const { tree, leaves } = toMerkleTree(rows);

        //Publish on-chain
        const from = senderOptions.from;
        const nonce = senderOptions.nonce;
        const merkleRoot = '0x' + tree.getRoot().toString('hex');

        const result = await ipfs.add(JSON.stringify(leaves));
        const merkleTreeIPFS = result.cid.toString();
        const tx = merkleDB.methods.updateMerkle(merkleRoot, merkleTreeIPFS);
        tx.send({
            nonce,
            from,
            gas: 200000,
            gasPrice: '150000000000',
        })
            .on('transactionHash', (hash: string) => {
                console.debug({
                    message: 'Snapshot MerkleDB contract',
                    orbitDBAddress: db.address,
                    merkleDBAddress: merkleDB.options.address,
                    merkleTree: tree.toString(),
                    merkleTreeLeaves: rows,
                    merkleRoot,
                    hash,
                });
                resolve({ tree, merkleRoot, txHash: hash, merkleTreeIPFS });
            })
            .on('error', (error: any) => console.error(error));
    }) as Promise<{ tree: any; merkleRoot: string; merkleTreeIPFS: string; txHash: string }>;
}

/**
 *
 * Event handler
 * @param db OrbitDB KV Database
 * @param tree Merkle Tree to add leaves to
 */
/*
export function onUpdateOrbitDBHandler2(tree: MerkleTree, merkleDB: Contract) {
    return (value: any, { from, nonce }: SenderParams) => {
        return new Promise((resolve) => {
            tree.addLeaf(cbor.encode(toSortedKeysObject(value)), true);
            //Publish on-chain
            const merkleRoot = '0x' + tree.getRoot().toString('hex');
            const merkleTreeIPFS = '0x';
            const tx = merkleDB.methods.updateMerkle(merkleRoot, merkleTreeIPFS);
            tx.send({
                nonce,
                from,
                gas: 100000,
                gasPrice: '150000000000',
            }).on('transactionHash', (hash: string) => {
                resolve({ tree, hash });
            });
        }) as Promise<{ tree: any; hash: string }>;
    };
}
*/

export class MerkleDBManager {
    private ipfs: IPFS;
    private web3: Web3;
    private account;
    private nonce = 0;
    private orbitDBManager: OrbitDBManager;

    private merkleDBContracts: { [contractAddress: string]: Contract } = {};
    //private merkleDBTrees: { [orbitDBAddress: string]: any } = {};
    private orbitDBToMerkleAddress: { [orbitDBAddress: string]: string } = {};
    private orbitDBListeners: { [orbitDBAddres: string]: any } = {};

    constructor(orbitDBManager: OrbitDBManager, ipfs: IPFS, web3: Web3) {
        this.ipfs = ipfs;
        this.web3 = web3;
        this.account = web3.eth.accounts.wallet[0].address;
        this.orbitDBManager = orbitDBManager;
    }

    async initialize() {
        this.nonce = await this.web3.eth.getTransactionCount(this.account);
    }

    async subscribe(orbitDBAddress: string, merkleDBAddress: string) {
        if (this.orbitDBListeners[orbitDBAddress]) throw new Error('Subscription exists!');

        const from = this.account;
        const db = await this.orbitDBManager.get(orbitDBAddress, { type: 'docstore', create: true });
        const contract = this.getMerkleDBContract(merkleDBAddress);
        this.orbitDBToMerkleAddress[orbitDBAddress] = merkleDBAddress;

        /*
        if (!this.merkleDBTrees[orbitDBAddress]) {
            this.merkleDBTrees[orbitDBAddress] = new MerkleTree([], keccak256, {
                hashLeaves: true,
                sortPairs: true,
            });
        }

        const tree = this.merkleDBTrees[orbitDBAddress];
        */
        //const onUpdate = onUpdateOrbitDBHandler(tree, contract);

        //OnWrite listener
        const listener = async (address: string, entry: any) => {
            //const value = entry.payload.value;
            //const { hash } = await onUpdate(value, { from, nonce: this.nonce++ });
            snapshotOrbitDB(db, this.ipfs, contract, { from, nonce: this.nonce++ });
        };
        db.events.on('write', listener);
        this.orbitDBListeners[orbitDBAddress] = listener;

        //Initial snapshot
        const { merkleRoot, txHash } = await snapshotOrbitDB(db, this.ipfs, contract, { from, nonce: this.nonce++ });
        //this.merkleDBTrees[orbitDBAddress] = tree;

        return { merkleRoot, txHash };
    }

    unsubscribe(orbitDBAddress: string) {
        const db = this.orbitDBManager.findDb(orbitDBAddress);
        if (db) {
            db.events.off('write', this.orbitDBListeners[orbitDBAddress]);
        }

        delete this.orbitDBToMerkleAddress[orbitDBAddress];
        delete this.orbitDBListeners[orbitDBAddress];
    }

    async snapshot(orbitDBAddress: string, merkleDBAddress: string) {
        const from = this.account;
        const db = await this.orbitDBManager.get(orbitDBAddress, { type: 'docstore', create: true });
        const contract = this.getMerkleDBContract(merkleDBAddress);

        const { merkleRoot, txHash } = await snapshotOrbitDB(db, this.ipfs, contract, { from, nonce: this.nonce++ });
        //this.merkleDBTrees[orbitDBAddress] = tree;

        return { merkleRoot, txHash };
    }

    getMerkleDBContract(address: string) {
        if (!this.merkleDBContracts[address]) {
            this.merkleDBContracts[address] = new this.web3.eth.Contract(MerkleDBArtifact.abi as any, address);
        }
        return this.merkleDBContracts[address];
    }

    getAllMerkleAddress() {
        return this.orbitDBToMerkleAddress;
    }

    getMerkleAddress(orbitDBAddress: string) {
        return this.orbitDBToMerkleAddress[orbitDBAddress];
    }

    async createMerkleDBContract() {
        return new Promise(async (resolve) => {
            new this.web3.eth.Contract(MerkleDBArtifact.abi as any)
                .deploy({
                    data: MerkleDBArtifact.bytecode,
                    arguments: [],
                })
                .send({
                    from: this.account,
                    nonce: this.nonce++,
                    gas: 2000000,
                    gasPrice: '150000000000',
                })
                .on('receipt', (r) => resolve(r));
        });
    }
}
