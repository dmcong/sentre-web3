import { web3 } from '@project-serum/anchor'

const GET_MULTIPLE_ACCOUNTS_LIMIT: number = 99

async function getMultipleAccountsCore(
  connection: web3.Connection,
  publicKeys: web3.PublicKey[],
  commitmentOverride?: web3.Commitment,
): Promise<
  Array<null | { publicKey: web3.PublicKey; account: web3.AccountInfo<Buffer> }>
> {
  const commitment = commitmentOverride ?? connection.commitment
  const accounts = await connection.getMultipleAccountsInfo(
    publicKeys,
    commitment,
  )
  return accounts.map((account, idx) => {
    if (account === null) {
      return null
    }
    return {
      publicKey: publicKeys[idx],
      account,
    }
  })
}

function chunks<T>(array: T[], size: number): T[][] {
  return Array.apply(0, new Array(Math.ceil(array.length / size))).map(
    (_, index) => array.slice(index * size, (index + 1) * size),
  )
}

export async function getMultipleAccounts(
  connection: web3.Connection,
  publicKeys: web3.PublicKey[],
  commitment?: web3.Commitment,
): Promise<
  Array<null | { publicKey: web3.PublicKey; account: web3.AccountInfo<Buffer> }>
> {
  if (publicKeys.length <= GET_MULTIPLE_ACCOUNTS_LIMIT) {
    return await getMultipleAccountsCore(connection, publicKeys, commitment)
  } else {
    const batches = chunks(publicKeys, GET_MULTIPLE_ACCOUNTS_LIMIT)
    const results = await Promise.all<
      Array<null | {
        publicKey: web3.PublicKey
        account: web3.AccountInfo<Buffer>
      }>
    >(
      batches.map((batch) =>
        getMultipleAccountsCore(connection, batch, commitment),
      ),
    )
    return results.flat()
  }
}
