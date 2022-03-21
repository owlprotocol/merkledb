import app from './app';

const port = 3000;

if (typeof require !== 'undefined' && require.main === module) {
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });
}
