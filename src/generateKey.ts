import { randomBytes, HDNodeWallet } from "ethers";

// ランダムなウォレット（秘密鍵＋アドレス）を作成
export const generateKey = () => {
  const entropy = randomBytes(16);
  const mnemonic = HDNodeWallet.entropyToMnemonic(entropy);

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonicPhrase: wallet.mnemonic?.phrase,
  }
}
