import { BN, AnchorProvider, web3 } from '@project-serum/anchor'
import { Transaction } from '@solana/web3.js'

import * as Tx from './transactions'

export const createMintAndMintTo = async (
  provider: AnchorProvider,
  amount: BN,
  mint = web3.Keypair.generate(),
) => {
  const txCreateMint = await Tx.createMintTransaction(provider, { mint })
  const txCreateTokenAccount = await Tx.createTokenAccountTransaction(
    provider,
    { mint: mint.publicKey },
  )
  const txMinTo = await Tx.createMintToTransaction(provider, {
    mint: mint.publicKey,
    amount,
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
