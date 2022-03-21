import { NAME } from './utils/environment';
import hello from './hello';
import sleep from './utils/sleep';

async function main() {
    while (true) {
        await sleep(1000);
        console.log(`${Date.now()} ${hello(NAME)}`);
    }
}

if (typeof require !== 'undefined' && require.main === module) {
    main();
}
