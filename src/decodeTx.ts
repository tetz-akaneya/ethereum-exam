import { Transaction } from 'ethers'

export const decodeTx = (rawTx: string) => {
  const decoded = Transaction.from(rawTx)
  if (!decoded) {
    return null;
  }

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
