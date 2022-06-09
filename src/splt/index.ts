import { BN, AnchorProvider, web3, Address } from '@project-serum/anchor'
import { Transaction } from '@solana/web3.js'

import * as Tx from './transactions'

type MintToParams = {
  amount: BN
  mint?: web3.Keypair
  dstAddress?: Address
}
export const createMintAndMintTo = async (
  provider: AnchorProvider,
  { amount, mint = web3.Keypair.generate(), dstAddress }: MintToParams,
) => {
  const txCreateMint = await Tx.createMintTransaction(provider, { mint })
  const mintAddress = mint.publicKey
  const txCreateTokenAccount = await Tx.createTokenAccountTransaction(
    provider,
    { mintAddress, owner: dstAddress },
  )
  const txMinTo = await Tx.createMintToTransaction(provider, {
    mintAddress: mint.publicKey,
    amount,
    dstAddress,
  })
  const transaction = new Transaction().add(
    txCreateMint,
    txCreateTokenAccount,
    txMinTo,
  )
  const txId = await provider.sendAndConfirm(transaction, [mint])
  return { txId }
}

export * from './transactions'
