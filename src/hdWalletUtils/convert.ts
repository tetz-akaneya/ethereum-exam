import { Point, modP } from './constant';
// ----------------------
// Convert 関数
// ----------------------
// Uint8Array から Hex 文字列に変換
export const uint8ArrayToHex = (arrayBuffer: Uint8Array): string => {
  return Array.from(arrayBuffer)
    .map((i) => {
      return i.toString(16).padStart(2, '0');
    })
    .join('');
};

export const bigintToInt = (bn: bigint): number => {
  const num = Number(bn);
  if (!Number.isSafeInteger(num)) {
    throw new Error('bigint is too large to convert safely to number');
  }
  return num;
};

export const uint8ArrayToBuffer = (arr: Uint8Array): Buffer => {
  return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
};

/**
 * Hex 文字列からUint8Arrayに変換
 */
export const hexToUint8Array = (hex: string): Uint8Array => {
  // remove 0x prefix if present
  if (hex.startsWith('0x')) {
    hex = hex.slice(2);
  }

  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }

  if (!/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error('Invalid hex string: contains non-hex characters');
  }

  const len = hex.length / 2;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    u8[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return u8;
};

export const hexToBuffer = (hex: string): Buffer => {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }
  return Buffer.from(hex, 'hex');
};

export const bufferToHex = (buffer: Buffer, prefix = false): string => {
  let suffixStr = '';
  if (prefix) {
    suffixStr = '0x';
  }
  return suffixStr + buffer.toString('hex');
};

export const bufferToBigInt = (buffer: Buffer): bigint => {
  return BigInt('0x' + buffer.toString('hex'));
};

export const intToBuffer = (n: number, byteLength: number): Buffer => {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('Only non-negative integers are supported');
  }

  const buf = Buffer.alloc(byteLength);
  buf.writeUIntBE(n, byteLength - 4, 4); // 最大4バイト（32bit）対応
  return buf;
};

export const bigintToBuffer = (n: bigint, byteSize: number): Buffer => {
  if (n < 0n) {
    throw new Error('Only non-negative integers are supported');
  }

  const hex = n.toString(16).padStart(byteSize * 2, '0');
  if (hex.length > byteSize * 2) {
    throw new Error(`Value too large to fit in ${byteSize} bytes`);
  }

  return Buffer.from(hex, 'hex');
};

export const bigintToHex = (n: bigint, byteLength?: number, prefix = false): string => {
  if (n < 0n) throw new Error('Only non-negative integers are supported');

  const hex = n.toString(16);
  let padStartSize: number;
  if (byteLength) {
    padStartSize = byteLength * 2;
  } else if (hex.length % 2 === 1) {
    padStartSize = hex.length + 1;
  } else {
    padStartSize = hex.length;
  }

  const paddedHex = hex.padStart(padStartSize, '0');
  const prefixStr = prefix ? '0x' : '';
  return prefixStr + paddedHex;
};
export const bufferToUint8Array = (buf: Buffer): Uint8Array => {
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
};
export const hexToBigInt = (hex: string): bigint => {
  if (hex.startsWith('0x')) {
    hex = hex.slice(2);
  }
  if (!/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error('Invalid hex string');
  }
  return BigInt('0x' + hex);
};

export const intToBigInt = (n: number): bigint => {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('Only non-negative integers are supported');
  }
  return BigInt(n);
};

export const bufferToInt = (buf: Buffer): number => {
  if (buf.length > 6) {
    throw new Error('Too large to safely convert to number');
  }
  return buf.readUIntBE(0, buf.length);
};

// ------------------
// 数学(有限体)
// ------------------
// 有限体 F_p の値に強制的に変換
// JSの% p は、[-p+1, p-1]の値を取るが、有限体としては[0,p-1]に収まる必要があるため
export const toBigintModP = (n: bigint, p: bigint) => {
  return ((n % p) + p) % p;
};

/**
 * inverseOfModP: a の mod p における逆元（a⁻¹ ≡ a⁻¹ mod p）を計算する
 * 拡張ユークリッドの互除法を使う
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
// 数学(secp256k1)
// ------------------
/**
 * 楕円曲線上の2点 P, Q を加算する（P = Q の場合もOK）
 */
export function pointAdd(P: Point, Q: Point): Point {
  const [x1, y1] = P;
  const [x2, y2] = Q;

  let lambda: bigint;

  if (x1 === x2 && y1 === y2) {
    // 倍加（doubling）
    (lambda = 3n * x1 * x1 * inverseOfModP(2n * y1, modP)), modP;
  } else {
    // 一般加算
    (lambda = (y2 - y1) * inverseOfModP(x2 - x1, modP)), modP;
  }

  const x3 = toBigintModP(lambda * lambda - x1 - x2, modP);
  const y3 = toBigintModP(lambda * (x1 - x3) - y1, modP);

  return [x3, y3];
}

/**
 * scalarMult: 楕円曲線上の点 G にスカラー k を掛ける（k·G）
 */
export function multiplyPointNTimes(k: bigint, G: Point): Point {
  let R: Point | null = null;
  let addend = G;

  while (k > 0n) {
    if (k & 1n) {
      // Rが無限遠点(null)の場合は、0として計算
      R = R === null ? addend : pointAdd(R, addend);
    }
    addend = pointAdd(addend, addend);
    k >>= 1n;
  }

  return R!;
}
