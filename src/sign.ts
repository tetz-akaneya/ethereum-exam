// sign-offline.mjs （または package.json に "type": "module" を指定して .js）
import { TransactionRequest, Wallet, parseEther, parseUnits } from 'ethers';

// async なのは、ethersにおいてsignデータにおけるアドレスがENSで記述されている場合に、
// ネットワークアクセスにより、解決する実装が含まれるため。
export const sign = async (arg: {
  txData: TransactionRequest,
  privateKey: string
}) => {
  // オフラインで保持される秘密鍵
  const wallet = new Wallet(arg.privateKey);

  // 署名
  return wallet.signTransaction(arg.txData);
}

