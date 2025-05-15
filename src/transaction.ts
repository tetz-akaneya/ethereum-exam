import { Transaction, TransactionRequest, Wallet } from 'ethers';

// async なのは、ethersにおいてsignデータにおけるアドレスがENSで記述されている場合に、
// ネットワークアクセスにより、解決する実装が含まれるため。
export const signTx = async (arg: {
  txData: TransactionRequest;
  privKey: string;
}) => {
  // オフラインで保持される秘密鍵
  const wallet = new Wallet(arg.privKey);

  // 署名
  return wallet.signTransaction(arg.txData);
};

export const decodeTx = (rawTx: string) => {
  const decoded = Transaction.from(rawTx);
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
  };
};
