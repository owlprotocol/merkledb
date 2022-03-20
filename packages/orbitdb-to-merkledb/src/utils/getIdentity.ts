import Identities from 'orbit-db-identity-provider';

export async function getIdentity() {
    const options = { id: 'merkledb' };
    const identity = await Identities.createIdentity(options);
    return identity;
}

if (require.main === module) {
    getIdentity().then((id) => {
        console.log(id.toJSON());
    });
}
