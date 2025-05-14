import { Point, modP } from './constant.js';

// ----------------------
// Convert 関数群
// ----------------------

/**
 * Uint8Array → Hex文字列（小文字, プレフィックスなし）
 */
export const uint8ArrayToHex = (arrayBuffer: Uint8Array, prefix = false): string => {
  const hex = Array.from(arrayBuffer)
    .map((i) => i.toString(16).padStart(2, '0'))
    .join('');
  const prefixStr = prefix ? '0x' : ''

  return prefixStr + hex
}

/**
 * bigint → number（安全な範囲内のみ）
 */
export const bigintToInt = (bn: bigint): number => {
  const num = Number(bn);
  if (!Number.isSafeInteger(num)) {
    throw new Error('bigint is too large to convert safely to number');
  }
  return num;
};

/**
 * Uint8Array → Buffer（コピーなし）
 */
export const uint8ArrayToBuffer = (arr: Uint8Array): Buffer =>
  Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);

/**
 * Hex文字列 → Uint8Array
 */
export const hexToUint8Array = (hex: string): Uint8Array => {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  if (hex.length % 2 !== 0) throw new Error('Hex string must have even length');
  if (!/^[0-9a-fA-F]*$/.test(hex)) throw new Error('Invalid hex string');

  const len = hex.length / 2;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    u8[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return u8;
};

/**
 * Hex文字列 → Buffer
 */
export const hexToBuffer = (hex: string): Buffer => {
  if (hex.length % 2 !== 0) throw new Error('Hex string must have even length');
  return Buffer.from(hex, 'hex');
};

/**
 * Buffer → Hex文字列（prefix 付き指定可）
 */
export const bufferToHex = (buffer: Buffer, prefix = false): string =>
  (prefix ? '0x' : '') + buffer.toString('hex');

/**
 * Buffer → bigint（BE解釈）
 */
export const bufferToBigInt = (buffer: Buffer): bigint =>
  BigInt('0x' + buffer.toString('hex'));

/**
 * number → Buffer（BE, 固定長, 最大4byte）
 */
export const intToBuffer = (n: number, byteLength: number): Buffer => {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('Only non-negative integers are supported');
  }
  const buf = Buffer.alloc(byteLength);
  buf.writeUIntBE(n, byteLength - 4, 4); // 右詰め
  return buf;
};

/**
 * bigint → Buffer（BE, 固定長, オーバーフロー検出あり）
 */
export const bigintToBuffer = (n: bigint, byteSize: number): Buffer => {
  if (n < 0n) throw new Error('Only non-negative integers are supported');

  const hex = n.toString(16).padStart(byteSize * 2, '0');
  if (hex.length > byteSize * 2) {
    throw new Error(`Value too large to fit in ${byteSize} bytes`);
  }

  return Buffer.from(hex, 'hex');
};

/**
 * bigint → Hex文字列（プレフィックス/ゼロ埋めあり）
 */
export const bigintToHex = (
  n: bigint,
  byteLength?: number,
  prefix = false,
): string => {
  if (n < 0n) throw new Error('Only non-negative integers are supported');

  const hex = n.toString(16);
  const padded = hex.padStart(
    byteLength ? byteLength * 2 : hex.length + (hex.length % 2),
    '0',
  );

  return (prefix ? '0x' : '') + padded;
};

/**
 * Buffer → Uint8Array（コピーなし）
 */
export const bufferToUint8Array = (buf: Buffer): Uint8Array =>
  new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

/**
 * Hex文字列 → bigint（0x付き可）
 */
export const hexToBigInt = (hex: string): bigint => {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  if (!/^[0-9a-fA-F]*$/.test(hex)) throw new Error('Invalid hex string');
  return BigInt('0x' + hex);
};

/**
 * number → bigint
 */
export const intToBigInt = (n: number): bigint => {
  return BigInt(n);
};

/**
 * Buffer → number（最大6byte, BE）
 */
export const bufferToInt = (buf: Buffer): number => {
  if (buf.length > 6) {
    throw new Error('Too large to safely convert to number');
  }
  return buf.readUIntBE(0, buf.length);
};

// ------------------
// 数学ユーティリティ (有限体)
// bigint で基本的に計算して、最後にtoBigintModPを行えば良い。
// ------------------
/**
 * bigint を F_p の正準表現に変換（常に 0 ≦ n < p）
 */
export const toBigintModP = (n: bigint, p: bigint): bigint => ((n % p) + p) % p;

/**
 * 逆元 a⁻¹ mod p を拡張ユークリッド互除法で計算（a, pは互いに素）
 */
export const inverseOfModP = (a: bigint, p: bigint): bigint => {
  a = toBigintModP(a, p);
  let [t, newT] = [0n, 1n];
  let [r, newR] = [p, a];

  while (newR !== 0n) {
    const q = r / newR;
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }

  return t < 0n ? t + p : t;
};

// ------------------
// 楕円曲線演算 (secp256k1)
// ------------------

/**
 * 楕円曲線上の点PとQを加算（加算/倍加とも対応）
 */
export const pointAdd = (P: Point, Q: Point): Point => {
  const [x1, y1] = P;
  const [x2, y2] = Q;

  let lambda: bigint;

  if (x1 === x2 && y1 === y2) {
    // 点の倍加
    lambda = (3n * x1 * x1 * inverseOfModP(2n * y1, modP)) % modP;
  } else {
    // 通常の加算
    lambda = ((y2 - y1) * inverseOfModP(x2 - x1, modP)) % modP;
  }

  const x3 = toBigintModP(lambda * lambda - x1 - x2, modP);
  const y3 = toBigintModP(lambda * (x1 - x3) - y1, modP);

  return [x3, y3];
};

/**
 * 楕円曲線上の点 G にスカラー k をかける（k倍演算）
 */
export const multiplyPointNTimes = (k: bigint, G: Point): Point => {
  let R: Point | null = null;
  let addend = G;

  while (k > 0n) {
    if (k & 1n) {
      R = R === null ? addend : pointAdd(R, addend);
    }
    addend = pointAdd(addend, addend);
    k >>= 1n;
  }

  return R!;
};
