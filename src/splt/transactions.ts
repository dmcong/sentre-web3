import {
  Address,
  AnchorProvider,
  Spl,
  utils,
  web3,
  BN,
} from '@project-serum/anchor'
import { getMultipleAccounts } from '@project-serum/anchor/dist/cjs/utils/rpc'
import { Transaction } from '@solana/web3.js'

import { toPublicKey } from '../utils'

export type MintToParams = {
  mintAddress: Address
  amount: BN
  dstAddress?: Address
}
export const createMintToTransaction = async (
  provider: AnchorProvider,
  { mintAddress, amount, dstAddress = provider.wallet.publicKey }: MintToParams,
) => {
  const splProgram = Spl.token(provider)
  const mintPublicKey = toPublicKey(mintAddress)
  const associatedAddress = await utils.token.associatedAddress({
    mint: mintPublicKey,
    owner: toPublicKey(dstAddress),
  })
  const ixMintTo = await splProgram.methods
    .mintTo(amount)
    .accounts({
      mint: mintPublicKey,
      to: associatedAddress,
      authority: provider.wallet.publicKey,
    })
    .instruction()

  return new Transaction().add(ixMintTo)
}

export type CreateMintParams = {
  mint: web3.Keypair
  decimals?: number
  mintAuthority?: Address
  freezeAuthority?: Address
}
export const createMintTransaction = async (
  provider: AnchorProvider,
  {
    mint,
    decimals = 9,
    mintAuthority = provider.wallet.publicKey,
    freezeAuthority = provider.wallet.publicKey,
  }: CreateMintParams,
) => {
  const splProgram = Spl.token(provider)

  const ixCreate = await splProgram.account.mint.createInstruction(mint)
  const ixRent = await splProgram.methods
    .initializeMint(
      decimals,
      toPublicKey(mintAuthority),
      toPublicKey(freezeAuthority),
    )
    .accounts({
      mint: mint.publicKey,
      rent: web3.SYSVAR_RENT_PUBKEY,
    })
    .instruction()

  return new Transaction().add(ixCreate).add(ixRent)
}

export type CreateTokenAccountParams = {
  mintAddress: Address
  owner?: Address
}
export const createTokenAccountTransaction = async (
  provider: AnchorProvider,
  { mintAddress, owner = provider.wallet.publicKey }: CreateTokenAccountParams,
) => {
  const mintPublicKey = toPublicKey(mintAddress)
  const payerPublicKey = toPublicKey(provider.wallet.publicKey)
  const ownerPublicKey = toPublicKey(owner)

  const associatedTokenAccount = await utils.token.associatedAddress({
    mint: mintPublicKey,
    owner: ownerPublicKey,
  })

  const ix = new web3.TransactionInstruction({
    keys: [
      {
        pubkey: payerPublicKey,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: associatedTokenAccount,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: ownerPublicKey,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: mintPublicKey,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: utils.token.TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: web3.SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ],
    programId: utils.token.ASSOCIATED_PROGRAM_ID,
    data: Buffer.from([]),
  })

  return new Transaction().add(ix)
}

export type CreateMultiTokenAccountParams = {
  mints: Address[]
  owner?: Address
}
export const createMultiTokenAccountIfNeededTransactions = async (
  provider: AnchorProvider,
  { mints, owner = provider.wallet.publicKey }: CreateMultiTokenAccountParams,
) => {
  const ownerPublicKey = toPublicKey(owner)
  const transactions: web3.Transaction[] = []
  const tokenAccounts = []
  for (const mint of mints) {
    const mintPublicKey = toPublicKey(mint)
    const associatedTokenAccount = await utils.token.associatedAddress({
      mint: mintPublicKey,
      owner: ownerPublicKey,
    })
    tokenAccounts.push(associatedTokenAccount)
  }
  const data = await getMultipleAccounts(provider.connection, tokenAccounts)
  data.forEach(async (value, index) => {
    if (value !== null) return
    const tx = await createTokenAccountTransaction(provider, {
      mintAddress: mints[index],
      owner,
    })
    transactions.push(tx)
  })

  return transactions
}
