import { pbkdf2Sync, randomBytes } from 'crypto';
import { Mnemonic } from 'ethers';

import {
  bufferToHex,
  uint8ArrayToBuffer,
  uint8ArrayToHex,
} from '../primitive/converter.js';
import { deriveKeyInfoFromSeed } from './seed.js';

/*
 * mnemonic を作る。entropyは32byteが推奨。
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

/**
 * ニーモニックからBIP-39準拠のシードを生成する
 * @param mnemonic ニーモニック（12〜24語）
 * @param passphrase パスフレーズ（任意、デフォルト空文字列）
 * @returns 64バイトのシード（Uint8Array）
 */
export const toSeed = (
  mnemonic: string,
  passphrase: string = '',
): Uint8Array => {
  const normalizedMnemonic = normalizeNfkd(mnemonic);
  const normalizedSalt = 'mnemonic' + normalizeNfkd(passphrase);

  const seed = pbkdf2Sync(
    Buffer.from(normalizedMnemonic, 'utf8'),
    Buffer.from(normalizedSalt, 'utf8'),
    2048,
    64,
    'sha512',
  );

  return new Uint8Array(seed);
};

/*
 * ニーモニック、パスフレーズからHDウォレットができるので、任意のpathのアドレスを導出する。
 */
export const deriveKeyInfoFromMnemonic = (arg: {
  mnemonic: string;
  passphrase: string;
  path: string;
}) => {
  const seed = toSeed(arg.mnemonic, arg.passphrase);
  const seedBuf = uint8ArrayToBuffer(seed);

  const wallet = deriveKeyInfoFromSeed({
    seed: seedBuf,
    passphrase: arg.passphrase,
    path: arg.path,
  });

  return {
    publicKey: uint8ArrayToHex(wallet.publicKey, true),
    privKey: bufferToHex(wallet.privKey, true),
    address: wallet.address,
  };
};

/**
 * UTF-8 NFKD 正規化を行う
 */
const normalizeNfkd = (str: string): string => {
  return str.normalize('NFKD');
};
