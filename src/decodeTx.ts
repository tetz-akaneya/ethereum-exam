import { Transaction } from 'ethers'

export const decodeTx = (rawTx: string) => {
  const decoded = Transaction.from(rawTx)
  if (!decoded) {
    return null;
  }

  decoded.data
  decoded.from
  decoded.to
  decoded.gasLimit
  decoded.gasPrice
  decoded.type

  console.log(JSON.stringify(decoded))

  return {
    from: decoded.from,
    to: decoded.to,
    value: decoded.value,
    nonce: decoded.nonce,
    gasLimit: decoded.gasLimit,
    maxPriorityFeePerGas: decoded.maxPriorityFeePerGas,
    maxFeePerGas: decoded.maxFeePerGas,
    data: decoded.data,
    chainId: decoded.chainId,
    type: decoded.type,
  }
}
