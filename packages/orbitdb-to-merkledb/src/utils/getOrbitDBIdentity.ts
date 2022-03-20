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

if (require.main === module) {
    getOrbitDBIdentity('0x03b697e56018648c9284827507ed15b2ae8564d1f1357f18e320d260955bf19e').then((id) => {
        console.log(JSON.stringify(id.toJSON()));
    });
}
