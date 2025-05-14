import { createHmac } from 'crypto';
import { ethers } from 'ethers';
import {
  intToBuffer,
  uint8ArrayToHex,
  hexToUint8Array,
  bufferToBigInt,
  bigintToBuffer,
  hexToBigInt,
  toBigintModP,
  multiplyPointNTimes,
} from './convert.js';
import { HARDENED_OFFSET, CURVE_ORDER, G, Point, modP } from './constant.js';
import { pbkdf2Sync } from 'crypto';

// ----------------------
// 自作のHDウォレット用関数
// ----------------------
export const createMasterKeyBip32 = (seed: Buffer) => {
  const I = createHmac('sha512', 'Bitcoin seed').update(seed).digest();
  return {
    key: I.subarray(0, 32),
    chainCode: I.subarray(32),
  };
};

/*
 * BIP32 のCKDPriv関数実装
 */
export const selfmadeCKDpriv = (
  privKey: Buffer,
  chainCode: Buffer,
  index: number,
) => {
  const indexBuffer = intToBuffer(index, 4);
  let data: Buffer;
  if (HARDENED_OFFSET <= index) {
    data = Buffer.concat([Buffer.from([0x00]), privKey, indexBuffer]);
  } else {
    data = Buffer.concat([createPublicKey(privKey, true), indexBuffer]);
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
    key: bigintToBuffer(childKeyBn, 32),
    chainCode: IR,
  };
};

// Ethereumアドレス取得（0x付き、先頭12バイト除去）
export const ethereumAddressFromPrivKey = (privKey: Buffer): string => {
  // 非圧縮形式であることに注意
  const pubKey = createPublicKey(privKey, false).subarray(1); // 65バイト中、先頭1バイトを除去
  const address = ethers.keccak256(pubKey).slice(-40); // 下位20バイト
  return '0x' + address;
};

export const createPublicKey = (
  privateKey: Uint8Array,
  compressed: boolean = true,
) => {
  const privateKeyBignum = hexToBigInt(uint8ArrayToHex(privateKey));
  if (privateKeyBignum >= CURVE_ORDER) {
    return new Uint8Array();
  }

  const PublicKeyPoint = multiplyPointNTimes(
    BigInt('0x' + uint8ArrayToHex(privateKey)),
    G,
  );
  const publicKey = serializePoint(PublicKeyPoint, compressed);

  return hexToUint8Array(publicKey);
};

const serializePoint = (point: Point, compressed = true) => {
  if (compressed) {
    const isYEven = point[1] % 2n === 0n;
    const dynamicPrefix = isYEven ? '02' : '03';
    return `${dynamicPrefix}${point[0].toString(16).padStart(64, '0')}`;
  } else {
    const staticPrefix = '04';
    return `${staticPrefix}${point[0].toString(16).padStart(64, '0')}${point[1].toString(16).padStart(64, '0')}`;
  }
};

/**
 * m/44'/60'/0/2/3 -> [2147483692, 2147483708, 0, 2, 3]
 * Hardened indexは 2^31 を加算して表現
 */
export const parseDerivationPath = (path: string): number[] => {
  if (!path.startsWith('m/')) {
    throw new Error("Path must start with 'm/'");
  }

  return path
    .slice(2) // "m/" を取り除く
    .split('/')
    .map((component) => {
      const hardened = component.endsWith("'");
      const index = parseInt(hardened ? component.slice(0, -1) : component, 10);
      if (isNaN(index) || index < 0) {
        throw new Error(`Invalid path component: ${component}`);
      }
      return hardened ? index + HARDENED_OFFSET : index;
    });
};

export const selfmadeDeriveKey = (arg: {
  seed: Buffer;
  passphrase: string;
  path: string;
}) => {
  const parsedPath = parseDerivationPath(arg.path);
  const I = createMasterKeyBip32(arg.seed);

  const result = parsedPath.reduce((prev, index) => {
    return selfmadeCKDpriv(prev.key, prev.chainCode, index);
  }, I);

  const publicKey = createPublicKey(result.key, true);

  return {
    publicKey,
    key: result.key,
    chainCode: result.chainCode,
    address: ethereumAddressFromPrivKey(result.key),
  };
};

/**
 * UTF-8 NFKD 正規化を行う
 */
const normalizeNfkd = (str: string): string => {
  return str.normalize('NFKD');
};

/**
 * ニーモニックからBIP-39準拠のシードを生成する
 * @param mnemonic ニーモニック（12〜24語）
 * @param passphrase パスフレーズ（任意、デフォルト空文字列）
 * @returns 64バイトのシード（Uint8Array）
 */
export const mnemonicToSeed = (
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
