import BN from 'bn.js';
import elliptic from 'elliptic';
import { appendHexPrefix } from '../../converter/primitive.js';

const EC = elliptic.ec

/** 秘密鍵の上限値（secp256k1 の曲線次数） */
export const CURVE_ORDER =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

/** secp256k1 の有限体の素数 modP（256ビット） */
export const modP = 2n ** 256n - 2n ** 32n - 977n;

/** 楕円曲線上の点を表す型 [x, y] */
export type Point = [bigint, bigint];

/** secp256k1 の生成点 G（base point） */
export const G: Point = [
  0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
];

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

// ------------------
// 数学ユーティリティ (有限体)
// bigint で基本的に計算して、最後にtoBigintModPを行えば良い。
// ------------------
/*
 * bigint を F_p の正準表現に変換（常に 0 ≦ n < p）
 */
export const toBigintModP = (n: bigint, p: bigint): bigint => ((n % p) + p) % p;

/*
 * bip32 path の公開鍵のシリアライズ関数
 */
export const serializePoint = (point: Point, compressed = true) => {
  if (compressed) {
    const isYEven = point[1] % 2n === 0n;
    const dynamicPrefix = isYEven ? '02' : '03';
    return `${dynamicPrefix}${point[0].toString(16).padStart(64, '0')}`;
  } else {
    const staticPrefix = '04';
    return `${staticPrefix}${point[0].toString(16).padStart(64, '0')}${point[1].toString(16).padStart(64, '0')}`;
  }
};

// test のため
export function multiplyGNTimesEc(n: bigint) {
  // secp256k1 曲線のインスタンスを作成
  const ec = new EC('secp256k1');

  // 例: 生成点 G を取得
  const G: elliptic.curve.base.BasePoint = ec.g;

  const multipliedG = G.mul(new BN(n.toString(10)));

  return [
    BigInt(appendHexPrefix(multipliedG.getX().toString(16))),
    BigInt(appendHexPrefix(multipliedG.getY().toString(16))),
  ];
}
