// sign-offline.mjs （または package.json に "type": "module" を指定して .js）
import { TransactionRequest, Wallet, parseEther, parseUnits } from 'ethers';
import { generateKey } from './generateKey';


export const sign = async (data: { txData: TransactionRequest, privateKey: string }) => {
  // オフラインで保持される秘密鍵
  const wallet = new Wallet(data.privateKey);

  // 署名
  return wallet.signTransaction(data.txData);
}

