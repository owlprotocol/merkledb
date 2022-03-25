import { CID } from 'multiformats';
import Tree from '../src/tree/Tree';
import IPFSMerkle from '../src/tree/ipfs/IPFSMerkle';
import IPFSMerkleIndex from '../src/tree/ipfs/IPFSMerkleIndex';
import IPFSTreeMap from '../src/tree/ipfs/IPFSTreeMap';

export default class IPFSMerkleTree {
    private readonly _root: IPFSMerkle | undefined;
    //Maps node CIDs to parent
    private readonly _parentMapping: IPFSTreeMap | undefined;
    //Maps leaf node hashes to CID
    private readonly _leafMapping: IPFSTreeMap | undefined;

    protected constructor() { }

    //Inserts and returns root
    async *insertGenerator(a: IPFSMerkle): AsyncGenerator<IPFSMerkle> {
        const levelOrderGen = IPFSMerkle.levelOrderTraversal(this);

        for await (const n of levelOrderGen) {
            const left = await n.getLeft();
            if (left === undefined) {
                //Set Left Node
                const newMerk = (await n.withLeft(a)) as IPFSMerkle;

                //Leaf nodes
                yield (await newMerk.getLeft()) as IPFSMerkle;
                yield (await newMerk.getRight()) as IPFSMerkle;
                //New Merkle Root
                yield newMerk;

                break;
            } else {
                const right = await n.getRight();
                if (right === undefined) {
                    //Set Right Node
                    yield (await n.withRight(a)) as IPFSMerkleTree;
                    break;
                }
            }
        }
    }

    static async insert(root: IPFSMerkleTree | undefined, a: IPFSMerkleTree): Promise<IPFSMerkleTree> {
        const gen = IPFSMerkleTree.insertGenerator(root, a);
        let n: IPFSMerkleTree;
        for await (n of gen) {
            n = n;
        }
        return n!;
    }

    async *insertGenerator(a: IPFSMerkleTree): AsyncGenerator<IPFSMerkleTree> {
        yield* IPFSMerkleTree.insertGenerator(this, a);
    }

    async insert(a: IPFSMerkleTree): Promise<IPFSMerkleTree> {
        return IPFSMerkleTree.insert(this, a);
    }

    //Merkle proof generator
}
