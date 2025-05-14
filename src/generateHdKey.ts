import { HDNodeWallet, Mnemonic, randomBytes } from 'ethers';

type AllowedCoinType = 'Ethereum';
type AllowedPurpose = 'BIP44';

export const purposeDict: Record<AllowedPurpose, number> = {
  BIP44: 44,
};

export const coinTypeDict: Record<AllowedCoinType, number> = {
  Ethereum: 60,
};

export const typedKeys = <T extends object>(obj: T): (keyof T)[] => {
  return Object.keys(obj) as (keyof T)[];
};

export const changePathDict = {
  external: 0,
  internal: 1,
};

const hardenPath = (index: string | number) => {
  return `${index}'`;
};

/*
 * アポストロフィ付きのpathは、[0, 2**31) の範囲
 */
export const genBipTypicalPath = (arg: {
  purpose: number;
  coinType: number;
  account: number;
  change: number;
  index: number;
}): string => {
  return [
    'm',
    hardenPath(arg.purpose),
    hardenPath(arg.coinType),
    hardenPath(arg.account),
    arg.change,
    arg.index,
  ].join('/');
};

// ニーモニック、パスフレーズからHDウォレットができるので、任意のpathのアドレスを導出する。
export const deriveKey = (arg: {
  mnemonicString: string;
  passphrase: string;
  path: string;
}) => {
  const mnemonic = Mnemonic.fromPhrase(arg.mnemonicString, arg.passphrase);

  const seed = mnemonic.computeSeed();
  const parentWallet = HDNodeWallet.fromSeed(seed);

  const wallet = parentWallet.derivePath(arg.path);

  return {
    publicKey: wallet.publicKey,
    privateKey: wallet.privateKey,
    address: wallet.address,
  };
};

// mnemonic を作る
// 32byteが推奨
// 長さは合っているが、コールドウォレットのニーモニックのランダム性はもっと慎重に決めるべき
export const createMnemonic = (arg: { byteSize: number }) => {
  if (arg.byteSize < 31) {
    throw new Error('insecure byte size');
  }
  const entropy = randomBytes(arg.byteSize);
  const mnemonic = Mnemonic.fromEntropy(entropy);

  return mnemonic.phrase;
};
