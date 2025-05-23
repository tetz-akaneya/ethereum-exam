import { Transaction, TransactionRequest, Wallet } from 'ethers'

import { PrivateKey } from '../hdWalletUtils/privateKey.js'
import { uint8ArrayToHex } from '../primitive/converter.js'

// async なのは、ethersにおいてsignデータにおけるアドレスがENSで記述されている場合に、
// ネットワークアクセスにより、解決する実装が含まれるため。
const signTx = async (arg: {
  txData: TransactionRequest
  privKey: PrivateKey
}) => {
  // オフラインで保持される秘密鍵
  const wallet = new Wallet(uint8ArrayToHex(arg.privKey))
  uint8ArrayToHex

  // 署名
  return wallet.signTransaction(arg.txData)
}

const decodeTx = (rawTx: string) => {
  const decoded = Transaction.from(rawTx)
  if (!decoded) {
    return null
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

const allowedChainToSign = {
  Sepolia: 11155111,
}

export const EvmTransaction = {
  signTx,
  decodeTx,
  allowedChainToSign,
}
