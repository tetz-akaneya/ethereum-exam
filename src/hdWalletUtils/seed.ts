import { createHmac } from 'crypto';
import type { Tagged } from 'type-fest';

import { bufferToUint8Array, uint8ArrayToUBigInt } from '../primitive/converter.js';
import { parseDerivationPath } from './derivePath.js';
import { KeyInfo, makeKeyInfo } from './keyInfo.js';
import {
  CKDpriv,
  getPublicKeyCompressed,
  makePrivateKey,
} from './privateKey.js';
import { CURVE_ORDER } from './secp256k1/point.js';

export type Seed = Tagged<Uint8Array, 'Seed'>;

export const createMasterKey = (seed: Seed) => {
  const I = bufferToUint8Array(
    createHmac('sha512', 'Bitcoin seed').update(seed).digest(),
  );

  return {
    privKey: makePrivateKey(I.subarray(0, 32)),
    chainCode: I.subarray(32),
  };
};

/**
 * BIP32 seed の妥当性チェック
 */
const isValidBip32Seed = (seed: Uint8Array): boolean => {
  const length = seed.length;
  return length >= 16 && length <= 64;
};

export const makeSeed = (data: Uint8Array): Seed => {
  if (!isValidBip32Seed(data)) {
    throw new Error('invalid seed')
  }

  return data as Seed;
};

export const deriveKeyInfoFromSeed = (arg: {
  seed: Seed;
  passphrase: string;
  path: string;
}): KeyInfo => {
  const parsedPath = parseDerivationPath({
    path: arg.path,
  });
  const I = createMasterKey(arg.seed);

  const keyInfo = parsedPath.reduce((prev, index) => {
    return CKDpriv({
      privKey: prev.privKey,
      chainCode: prev.chainCode,
      index,
    });
  }, I);

  const publicKey = getPublicKeyCompressed(keyInfo.privKey, true);

  return makeKeyInfo({
    publicKey: publicKey,
    privKey: keyInfo.privKey,
    chainCode: keyInfo.chainCode,
  });
};
