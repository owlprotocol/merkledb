import Identities from 'orbit-db-identity-provider';
import { ethers } from 'ethers';
import esMain from 'es-main';

import { ETH_PRIVATE_KEY } from '../environment.js';

export async function getOrbitDBIdentity(ethPrivateKey?: string) {
    let wallet: ethers.Wallet;
    if (!ethPrivateKey) wallet = ethers.Wallet.createRandom();
    else wallet = new ethers.Wallet(ethPrivateKey);

    const identity = await Identities.createIdentity({
        type: 'ethereum',
        wallet,
    });
    return identity;
}

export default getOrbitDBIdentity;

if (esMain(import.meta)) {
    console.debug(ETH_PRIVATE_KEY);
    const id = await getOrbitDBIdentity(ETH_PRIVATE_KEY);
    console.log(id.toJSON());
}
