import Web3 from 'web3';
import { Account } from 'web3-core';
import esMain from 'es-main';

export async function getEthereumAccount() {
    const web3 = new Web3();
    const wallet = web3.eth.accounts.wallet.create(1);
    return wallet[0] as Account;
}

export default getEthereumAccount;

if (esMain(import.meta)) {
    getEthereumAccount().then((account) => {
        console.log(account.privateKey);
    });
}
