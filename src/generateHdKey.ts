import { Mnemonic, randomBytes } from 'ethers';
import {
  mnemonicToSeed,
  selfmadeDeriveKey as deriveKeyFromSeed,
} from './hdWalletUtils/hdwallet.js';
import {
  bufferToHex,
  uint8ArrayToBuffer,
  uint8ArrayToHex,
} from './hdWalletUtils/primitiveConvert.js';

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
export const genBip44Path = (arg: {
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

/*
 * ニーモニック、パスフレーズからHDウォレットができるので、任意のpathのアドレスを導出する。
 */
export const deriveKeyFromMnemonic = (arg: {
  mnemonicString: string;
  passphrase: string;
  path: string;
}) => {
  const seed = mnemonicToSeed(arg.mnemonicString, arg.passphrase);
  const seedBuf = uint8ArrayToBuffer(seed);

  const wallet = deriveKeyFromSeed({
    seed: seedBuf,
    passphrase: arg.passphrase,
    path: arg.path,
  });

  return {
    publicKey: uint8ArrayToHex(wallet.publicKey, true),
    privateKey: bufferToHex(wallet.key, true),
    address: wallet.address,
  };
};

/*
 * mnemonic を作る
 * 32byteが推奨。これだけはライブラリに依存することにする。
 * 長さは合っているが、コールドウォレットのニーモニックのランダム性はもっと慎重に決めるべき
 */
export const createMnemonic = (arg: { byteSize: number }) => {
  if (arg.byteSize < 31) {
    throw new Error('insecure byte size');
  }
  const entropy = randomBytes(arg.byteSize);
  const mnemonic = Mnemonic.fromEntropy(entropy);

  return mnemonic.phrase;
};
