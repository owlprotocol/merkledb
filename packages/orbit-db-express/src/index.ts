import getApp from './getApp';

const port = 3000;

if (typeof require !== 'undefined' && require.main === module) {
    getApp().then((app) => {
        app.listen(port, () => {
            console.log(`OrbitDB Express Server listening on port ${port}`);
        });
    });
}
