import Identities from 'orbit-db-identity-provider';
import { ethers } from 'ethers';

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
