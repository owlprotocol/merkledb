import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send('OrbitDB Express Server');
});

app.get('/dbs', (req, res) => {
    throw new Error('Unimplemented');
});

app.get('/db/:dbname', (req, res) => {
    throw new Error('Unimplemented');
});

app.get('/db/:dbname/value', (req, res) => {
    throw new Error('Unimplemented');
});

app.get('/db/:dbname/:item', (req, res) => {
    throw new Error('Unimplemented');
});

app.get('/db/:dbname/iterator', (req, res) => {
    throw new Error('Unimplemented');
});

app.get('/db/:dbname/index', (req, res) => {
    throw new Error('Unimplemented');
});

app.get('/db/indentity', (req, res) => {
    throw new Error('Unimplemented');
});

app.post('/db/:dbname', (req, res) => {
    throw new Error('Unimplemented');
});

app.post('/db/:dbname/query', (req, res) => {
    throw new Error('Unimplemented');
});

app.post('/db/:dbname/add', (req, res) => {
    throw new Error('Unimplemented');
});

app.post('/db/:dbname/put', (req, res) => {
    throw new Error('Unimplemented');
});

app.post('/db/:dbname/inc', (req, res) => {
    throw new Error('Unimplemented');
});

app.post('/db/:dbname/inc/:val', (req, res) => {
    throw new Error('Unimplemented');
});

app.post('/db/:dbname/access/write', (req, res) => {
    throw new Error('Unimplemented');
});

app.delete('/db/:dbname', (req, res) => {
    throw new Error('Unimplemented');
});

app.delete('/db/:dbname/:item', (req, res) => {
    throw new Error('Unimplemented');
});

export default app;
