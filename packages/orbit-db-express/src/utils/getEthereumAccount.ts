import Web3 from 'web3';
import { Account } from 'web3-core';

export async function getEthereumAccount() {
    const web3 = new Web3();
    const wallet = web3.eth.accounts.wallet.create(1);
    return wallet[0] as Account;
}

export default getEthereumAccount;
