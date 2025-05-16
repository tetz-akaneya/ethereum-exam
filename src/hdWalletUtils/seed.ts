import { createHmac } from 'crypto';
import type { Tagged } from 'type-fest';

import { bufferToUint8Array } from '../primitive/converter.js';
import { parseDerivationPath } from './derivePath.js';
import { KeyInfo, makeKeyInfo } from './keyInfo.js';
import { toSeed } from './mnemonic.js';
import {
  CKDpriv,
  getEthereumAddress,
  getPublicKeyCompressed,
  makePrivateKey,
} from './privateKey.js';

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

export const fromMnemonic = toSeed;
export const makeSeed = (uint8Array: Uint8Array): Seed => {
  return uint8Array as Seed;
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
    address: getEthereumAddress(keyInfo.privKey),
  });
};
