import { CID } from 'multiformats';

export default interface BinaryTreeNodeData {
    key: CID;
    left?: CID;
    right?: CID;
}
