import getApp from './getApp';
import { EventEmitter } from 'events';

EventEmitter.defaultMaxListeners = 100;

const port = 3000;

if (typeof require !== 'undefined' && require.main === module) {
    getApp().then((app) => {
        app.listen(port, () => {
            console.log(`OrbitDB Express Server listening on port ${port}`);
        });
    });
}
