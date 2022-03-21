import Identities from 'orbit-db-identity-provider';
import { ethers } from 'ethers';
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

if (require.main === module) {
    console.debug(ETH_PRIVATE_KEY)
    getOrbitDBIdentity(ETH_PRIVATE_KEY).then((id) => {
        console.log(id.toJSON());
    });
}
