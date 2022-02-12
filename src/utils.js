import { connect, Contract, keyStores, WalletConnection } from 'near-api-js'
import getConfig from './config'
import {BN} from 'bn.js'

const nearConfig = getConfig(process.env.NODE_ENV || 'development')

// Initialize contract & set global variables
export async function initContract() {
  // Initialize connection to the NEAR testnet
  const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, nearConfig))

  // Initializing Wallet based Account. It can work with NEAR testnet wallet that
  // is hosted at https://wallet.testnet.near.org
  window.walletConnection = new WalletConnection(near)

  // Getting the Account ID. If still unauthorized, it's just empty string
  window.accountId = window.walletConnection.getAccountId()

  // Initializing our contract APIs by contract name and configuration
  window.contract = await new Contract(window.walletConnection.account(), nearConfig.contractName, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['list', 'get_total_posts', 'get_total_donations'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['create', 'donate'],
  })
}

export function logout() {
  window.walletConnection.signOut()
  // reload page
  window.location.replace(window.location.origin + window.location.pathname)
}

export function login() {
  // Allow the current app to make calls to the specified contract on the
  // user's behalf.
  // This works by creating a new access key for the user's account and storing
  // the private key in localStorage.
  window.walletConnection.requestSignIn(nearConfig.contractName)
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function convertToYoctoNear(amount) {
  return new BN(Math.round(amount * 100000000)).mul(new BN("10000000000000000")).toString();
}

export function convertToNear(amount) {
  return Math.round(amount * Math.pow(10, -24) * 10000) / 10000;
}
