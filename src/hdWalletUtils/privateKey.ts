import { createHmac } from 'crypto';
import { Tagged } from 'type-fest';

import {
  bufferToUint8Array,
  concatUint8Arrays,
  hexToUint8Array,
  uBigintToUint8Array,
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
  // 長さチェック（BIP32は常に32バイト）
  if (!isValidSecp256k1PrivateKey(data)) {
    throw new Error('invalid privateKey size');
  }

  return data as PrivateKey;
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

  const PublicKeyPoint = multiplyPointNTimes(privateKeyBigint, G);
  const publicKey = serializePoint(PublicKeyPoint, compressed);

  return hexToUint8Array(publicKey);
};

const createHmacSha512 = (arg: { chainCode: Uint8Array; data: Uint8Array }) => {
  return bufferToUint8Array(
    createHmac('sha512', arg.chainCode).update(arg.data).digest(),
  );
};
/**
 * secp256k1の秘密鍵バリデーション
 */
const isValidSecp256k1PrivateKey = (bytes: Uint8Array): boolean => {
  if (bytes.length !== 32) return false; // 長さチェック（BIP32は常に32バイト）
  const k = uint8ArrayToUBigInt(bytes);

  return k > 0n && k < CURVE_ORDER;
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
        arg.privKey,
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
      Fp.make({ val: uint8ArrayToUBigInt(IL), p: CURVE_ORDER }),
      Fp.make({ val: uint8ArrayToUBigInt(arg.privKey), p: CURVE_ORDER }),
    ).val,
    32,
  );

  if (uint8ArrayToUBigInt(IL) > primeNumSecp256k1) {
    throw new Error('Derived key is invalid (larger than modP)');
  }

  return {
    privKey: makePrivateKey(childKey),
    chainCode: IR,
  };
};
