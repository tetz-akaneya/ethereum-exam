import { createHmac } from 'crypto';
import { ethers } from 'ethers';
import { Tagged } from 'type-fest';

import {
  appendHexPrefix,
  bufferToUint8Array,
  concatUint8Arrays,
  hexToUBigInt,
  hexToUint8Array,
  uBigintToUint8Array,
  uint8ArrayToHex,
  uint8ArrayToUBigInt,
  uIntToUint8Array,
} from '../primitive/converter.js';
import { iife } from '../primitive/iife.js';
import { HARDENED_OFFSET } from './derivePath.js';
import { Fp } from './secp256k1/finite.js';
import {
  CURVE_ORDER,
  G,
  multiplyPointNTimes,
  primeNumSecp256k1,
  serializePoint,
} from './secp256k1/point.js';

type _PrivateKey = Uint8Array;
export type PrivateKey = Tagged<_PrivateKey, 'PrivateKey'>;
export const makePrivateKey = (data: _PrivateKey): PrivateKey => {
  if (uint8ArrayToUBigInt(data) === 0n)
    throw new Error('Derived key is invalid (zero)');

  return data as PrivateKey;
};

export const getPriavteKeyData = (privateKey: PrivateKey) =>
  privateKey as _PrivateKey;

// Ethereumアドレス取得（0x付き、先頭12バイト除去）
export const getEthereumAddress = (privKey: PrivateKey): string => {
  // 非圧縮形式であることに注意
  const pubKey = getPublicKeyCompressed(privKey, false).subarray(1); // 65バイト中、先頭1バイトを除去
  const address = ethers.keccak256(pubKey).slice(-40); // 下位20バイト
  return appendHexPrefix(address);
};

/**
 * 秘密鍵から公開鍵取得
 * BIP32 のN関数
 */
export const getPublicKeyCompressed = (
  privateKey: PrivateKey,
  compressed: boolean = true,
): Uint8Array => {
  const privateKeyBigint = uint8ArrayToUBigInt(privateKey);
  if (privateKeyBigint >= CURVE_ORDER) {
    return new Uint8Array();
  }

  const PublicKeyPoint = multiplyPointNTimes(
    privateKeyBigint,
    G,
  );
  const publicKey = serializePoint(PublicKeyPoint, compressed);

  return hexToUint8Array(publicKey);
};

const createHmacSha512 = (arg: { chainCode: Uint8Array; data: Uint8Array }) => {
  return bufferToUint8Array(
    createHmac('sha512', arg.chainCode).update(arg.data).digest(),
  );
};

/**
 * BIP32 のCKDPriv関数実装
 */
export const CKDpriv = (arg: {
  privKey: PrivateKey;
  chainCode: Uint8Array;
  index: number;
}): {
  privKey: PrivateKey;
  chainCode: Uint8Array;
} => {
  const indexUint8Array = uIntToUint8Array(arg.index, 4);
  const data = iife(() => {
    if (arg.index >= HARDENED_OFFSET) {
      return concatUint8Arrays([
        Uint8Array.from([0x00]),
        getPriavteKeyData(arg.privKey),
        indexUint8Array,
      ]);
    } else {
      return concatUint8Arrays([
        getPublicKeyCompressed(arg.privKey, true),
        indexUint8Array,
      ]);
    }
  });

  const I = createHmacSha512({
    chainCode: arg.chainCode,
    data,
  });
  const IL = I.subarray(0, 32);
  const IR = I.subarray(32);

  const childKey = uBigintToUint8Array(
    Fp.add(
      uint8ArrayToUBigInt(IL),
      uint8ArrayToUBigInt(getPriavteKeyData(arg.privKey)),
      CURVE_ORDER,
    ),
    32,
  );

  if (primeNumSecp256k1 < uint8ArrayToUBigInt(IL))
    throw new Error('Derived key is invalid (larger than modP)');

  return {
    privKey: makePrivateKey(childKey),
    chainCode: IR,
  };
};
