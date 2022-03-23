import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { MerkleTree } from 'merkletreejs';
import cbor from 'cbor';
import { keccak256 } from 'web3-utils';
import { IPFS } from 'ipfs';
import MerkleDBArtifact from '../artifacts/contracts/MerkleDB.sol/MerkleDB.json';
import OrbitDBManager from './OrbitDBManager';
import toSortedKeysObject from '../utils/toSortedKeysObject';

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
        const rowsCBOR = rows.map((r) => cbor.encode(toSortedKeysObject(r)));

        const tree = new MerkleTree(rowsCBOR, keccak256, {
            hashLeaves: true,
            sortPairs: true,
        });

        //Publish on-chain
        const from = senderOptions.from;
        const nonce = senderOptions.nonce;
        const merkleRoot = '0x' + tree.getRoot().toString('hex');

        const leavesIPFS = tree.getLeaves();
        const result = await ipfs.add(leavesIPFS);
        const merkleTreeIPFS = result.cid.toString();
        const tx = merkleDB.methods.updateMerkle(merkleRoot, merkleTreeIPFS);
        tx.send({
            nonce,
            from,
            gas: 100000,
            gasPrice: '150000000000',
        }).on('transactionHash', (hash: string) => {
            console.debug({
                message: 'Snapshot MerkleDB contract',
                orbitDBAddress: db.address,
                merkleDBAddress: merkleDB.options.address,
                merkleTree: tree.toString(),
                merkleTreeLeaves: rows,
                merkleRoot: tree.getRoot().toString('hex'),
                hash,
            });
            resolve({ tree, hash });
        });
    }) as Promise<{ tree: any; hash: string }>;
}

/**
 *
 * Event handler
 * @param db OrbitDB KV Database
 * @param tree Merkle Tree to add leaves to
 */
export function onUpdateOrbitDBHandler(tree: MerkleTree, merkleDB: Contract) {
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

export class MerkleDBManager {
    private web3: Web3;
    private account;
    private nonce = 0;
    private orbitDBManager: OrbitDBManager;

    private merkleDBContracts: { [contractAddress: string]: Contract } = {};
    private merkleDBTrees: { [orbitDBAddress: string]: any } = {};
    private orbitDBToMerkleAddress: { [orbitDBAddress: string]: string } = {};
    private orbitDBListeners: { [orbitDBAddres: string]: any } = {};

    constructor(orbitDBManager: OrbitDBManager, web3: Web3) {
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

        if (!this.merkleDBTrees[orbitDBAddress]) {
            this.merkleDBTrees[orbitDBAddress] = new MerkleTree([], keccak256, {
                hashLeaves: true,
                sortPairs: true,
            });
        }

        const tree = this.merkleDBTrees[orbitDBAddress];
        const onUpdate = onUpdateOrbitDBHandler(tree, contract);

        const listener = async (address: string, entry: any) => {
            const value = entry.payload.value;
            const { hash } = await onUpdate(value, { from, nonce: this.nonce++ });
            console.debug({
                message: 'Updating MerkleDB contract',
                orbitDBAddress: db.address,
                merkleDBAddress,
                merkleTree: tree.toString(),
                merkleRoot: tree.getRoot().toString('hex'),
                hash,
            });
        };
        db.events.on('write', listener);
        console.debug({
            message: 'Listening for changes to update MerkleDB contract',
            orbitDBAddress: db.address,
            merkleDBAddress,
            merkleTree: tree.toString(),
            merkleRoot: tree.getRoot().toString('hex'),
        });

        this.orbitDBToMerkleAddress[orbitDBAddress] = merkleDBAddress;
        this.orbitDBListeners[orbitDBAddress] = listener;
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

        //TODO
        //@ts-ignore
        const { tree, hash } = await snapshotOrbitDB(db, ipfs, contract, { from, nonce: this.nonce++ });
        this.merkleDBTrees[orbitDBAddress] = tree;

        return { root: tree.getRoot().toString('hex'), hash };
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
