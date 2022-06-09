import { Address, web3 } from '@project-serum/anchor'

export const toPublicKey = (address: Address): web3.PublicKey => {
  const publicKey = new web3.PublicKey(address)
  return publicKey
}

export const toBase58 = (address: Address): string => {
  const publicKey = new web3.PublicKey(address)
  return publicKey.toBase58()
}
