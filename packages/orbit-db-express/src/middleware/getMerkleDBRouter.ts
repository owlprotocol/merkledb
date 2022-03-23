import express from 'express';
import { MerkleDBManager } from './MerkleDBManager';

export async function getMerkleDBRouter(merkleDBManager: MerkleDBManager) {
    const router = express.Router();

    router.get('/subscription', (req, res) => {
        res.send(merkleDBManager.getAllMerkleAddress());
    });

    router.get('/subscription/:dbname', (req, res) => {
        const { dbname } = req.params;
        const address = merkleDBManager.getMerkleAddress(dbname);
        res.send({ address });
    });

    router.post('/subscription/:dbname', async (req, res) => {
        const { dbname } = req.params;
        const { address } = req.body;
        try {
            await merkleDBManager.subscribe(dbname, address);
            res.sendStatus(200);
        } catch (error: any) {
            res.status(500).send({ error: error.message });
        }
    });

    router.delete('/subscription/:dbname', (req, res) => {
        const { dbname } = req.params;
        merkleDBManager.unsubscribe(dbname);
        res.sendStatus(200);
    });

    router.post('/snapshot/:dbname', async (req, res) => {
        const { dbname } = req.params;
        const { address } = req.body;
        const { merkleRoot, hash } = await merkleDBManager.snapshot(dbname, address);
        res.send({ merkleRoot, hash });
    });

    router.get('/contract/:address', async (req, res) => {
        const { address } = req.params;
        const contract = merkleDBManager.getMerkleDBContract(address);

        const promises = [
            contract.methods.merkleRoot().call(),
            contract.methods.merkleTreeIPFS().call(),
            contract.methods.databaseIPFS().call(),
        ];
        const [merkleRoot, merkleTreeIPFS, databaseIPFS] = await Promise.all(promises);
        const data = { merkleRoot, merkleTreeIPFS, databaseIPFS };
        res.send(data);
    });

    router.post('/contract', async (req, res) => {
        const receipt = await merkleDBManager.createMerkleDBContract();
        res.send({ receipt });
    });

    return router;
}
