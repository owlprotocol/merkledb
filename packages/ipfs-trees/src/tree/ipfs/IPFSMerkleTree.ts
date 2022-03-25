import { CID } from 'multiformats';
import Tree from '../Tree';
import IPFSMerkle from './IPFSMerkle';
import IPFSMerkleIndex from './IPFSMerkleIndex';
import IPFSTreeMap from './IPFSTreeMap';

export default class IPFSMerkleTree extends IPFSMerkle {
    //Maps node CIDs to parent
    private readonly _parentMapping: IPFSTreeMap | undefined;
    //Maps leaf node hashes to CID
    private readonly _leafMapping: IPFSTreeMap | undefined;

    protected constructor(
        key: IPFSMerkleIndex | undefined,
        left: IPFSMerkleTree | undefined,
        right: IPFSMerkleTree | undefined,
        keyCID: CID | undefined,
        leftCID: CID | undefined,
        rightCID: CID | undefined,
        parentMapping?: IPFSTreeMap | undefined,
        leafMapping?: IPFSTreeMap | undefined,
    ) {
        super(key, left, right, keyCID, rightCID, leftCID);
        if (!key) throw new Error('No key!');
        this._parentMapping = parentMapping;
        this._leafMapping = leafMapping;
    }

    static async createLeafAsync(key: IPFSMerkleIndex): Promise<IPFSMerkleTree> {
        const n = this.create(key, undefined, undefined) as IPFSMerkleTree;
        const cid = await n.cid();
        //Map leaf
        //@ts-ignore
        n._leafMapping = IPFSTreeMap.createMap(key.toHex(), cid);
        return n;
    }

    //Override factory to include parent mapping
    override async withLeft(left: Tree<IPFSMerkleIndex>): Promise<IPFSMerkleTree> {
        const n = await super.withLeft(left);
        //@ts-ignore
        this._parentMapping = this._parentMapping!.set();
        //@ts-ignore
        return n;
    }

    //Inserts and returns root
    static async *insertGenerator(root: IPFSMerkleTree | undefined, a: IPFSMerkleTree): AsyncGenerator<IPFSMerkleTree> {
        if (!root) {
            //No root, return self
            yield a;
            return;
        }

        const levelOrderGen = IPFSMerkleTree.levelOrderTraversal(root);

        for await (const n of levelOrderGen) {
            const left = await n.getLeft();
            if (left === undefined) {
                //Set Left Node
                const newMerk = (await n.withLeft(a)) as IPFSMerkleTree;

                //Leaf nodes
                yield (await newMerk.getLeft()) as IPFSMerkleTree;
                yield (await newMerk.getRight()) as IPFSMerkleTree;
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
