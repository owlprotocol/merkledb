import { useState, useEffect } from 'react';
import { IPFSMapInterface, IPFSTree } from '@owlprotocol/ipfs-trees';
import logo from './logo.svg';
import './App.css';

function App() {
    const [count, setCount] = useState(0);

    //https://vitejs.dev/guide/env-and-mode.html#env-variables
    const title = import.meta.env.VITE_APP_TITLE;

    useEffect(async () => {
        //Enable real IPFS connection instead of in-memory cache
        //IPFSSingleton.setIPFS()

        let map: IPFSMapInterface = IPFSTree.createNull();
        map = await map.setJSON('3', { message: 'node3' });

        console.debug(map)
        /*
        map = await map.setJSON('3', { message: 'node3' });
        map = await map.setJSON('2', { message: 'node2' });
        map = await map.setJSON('4', { message: 'node4' });
        map = await map.setJSON('1', { message: 'node1' });
        map = await map.setJSON('5', { message: 'node5' });

        const cid = await map.cid();
        const cidList = await map.putAllSync();
        console.debug({ cid, cidList })

        const map2: IPFSMapInterface = await IPFSTree.createFromCID(cid);
        //Fetches leaf nodes
        const n1 = await map2.getJSON('1');
        */
    }, [])

    return (
        <div className='App'>
            <header className='App-header'>
                <img src={logo} className='App-logo' alt='logo' />
                <h1>{title}</h1>
                <p>Hello Vite + React! </p>
                <p>
                    <button type='button' onClick={() => setCount((count) => count + 1)}>
                        count is: {count}
                    </button>
                </p>
                <p>
                    Edit <code>App.tsx</code> and save to test HMR updates.
                </p>
                <p>
                    <a className='App-link' href='https://reactjs.org' target='_blank' rel='noopener noreferrer'>
                        Learn React
                    </a>
                    {' | '}
                    <a
                        className='App-link'
                        href='https://vitejs.dev/guide/features.html'
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        Vite Docs
                    </a>
                </p>
            </header>
        </div>
    );
}

export default App;
