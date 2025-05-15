import { createHmac } from 'crypto';
import { ethers } from 'ethers';

import { HARDENED_OFFSET } from './bip32Path.js';
import {
  CURVE_ORDER,
  G,
  modP,
  multiplyPointNTimes,
  serializePoint,
  toBigintModP,
} from './secp256k1/point.js';
import { appendHexPrefix, hexToBigInt, uint8ArrayToHex, hexToUint8Array, intToBuffer, bufferToBigInt, bigintToBuffer } from '../converter/primitive.js';

// Ethereumアドレス取得（0x付き、先頭12バイト除去）
export const getEthereumAddress = (privKey: Buffer): string => {
  // 非圧縮形式であることに注意
  const pubKey = getPublicKey(privKey, false).subarray(1); // 65バイト中、先頭1バイトを除去
  const address = ethers.keccak256(pubKey).slice(-40); // 下位20バイト
  return appendHexPrefix(address);
};

/*
 * 秘密鍵から公開鍵取得
 * BIP32 のN関数
 */
export const getPublicKey = (
  privateKey: Uint8Array,
  compressed: boolean = true,
) => {
  const privateKeyBignum = hexToBigInt(uint8ArrayToHex(privateKey));
  if (privateKeyBignum >= CURVE_ORDER) {
    return new Uint8Array();
  }

  const PublicKeyPoint = multiplyPointNTimes(
    hexToBigInt(appendHexPrefix(uint8ArrayToHex(privateKey))),
    G,
  );
  const publicKey = serializePoint(PublicKeyPoint, compressed);

  return hexToUint8Array(publicKey);
};

/*
 * BIP32 のCKDPriv関数実装
 */
export const CKDpriv = (privKey: Buffer, chainCode: Buffer, index: number) => {
  const indexBuffer = intToBuffer(index, 4);
  let data: Buffer;
  if (index >= HARDENED_OFFSET) {
    data = Buffer.concat([Buffer.from([0x00]), privKey, indexBuffer]);
  } else {
    data = Buffer.concat([getPublicKey(privKey, true), indexBuffer]);
  }

  const I = createHmac('sha512', chainCode).update(data).digest();
  const IL = I.subarray(0, 32);
  const IR = I.subarray(32);
  const childKeyBn = toBigintModP(
    bufferToBigInt(IL) + bufferToBigInt(privKey),
    CURVE_ORDER,
  );

  if (childKeyBn === 0n) throw new Error('Derived key is invalid (zero)');
  if (modP < bufferToBigInt(IL))
    throw new Error('Derived key is invalid (larger than modP)');

  return {
    privKey: bigintToBuffer(childKeyBn, 32),
    chainCode: IR,
  };
};
