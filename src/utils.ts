import { Address, AnchorProvider, web3 } from '@project-serum/anchor'

export const toPublicKey = (address: Address): web3.PublicKey => {
  const publicKey = new web3.PublicKey(address)
  return publicKey
}

export const toBase58 = (address: Address): string => {
  const publicKey = new web3.PublicKey(address)
  return publicKey.toBase58()
}

interface WalletInterface {
  signTransaction(tx: web3.Transaction): Promise<web3.Transaction>
  signAllTransactions(txs: web3.Transaction[]): Promise<web3.Transaction[]>
}

export const getAnchorProvider = (
  node: string,
  walletAddress: Address,
  wallet: WalletInterface,
): AnchorProvider => {
  const connection = new web3.Connection(node, 'confirmed')
  const publicKey = new web3.PublicKey(walletAddress)
  return new AnchorProvider(
    connection,
    {
      publicKey: publicKey,
      ...wallet,
    },
    {
      commitment: 'confirmed',
      skipPreflight: true,
    },
  )
}
