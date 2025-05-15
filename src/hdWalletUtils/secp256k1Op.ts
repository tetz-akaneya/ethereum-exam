// ------------------
// 楕円曲線演算 (secp256k1)
// ------------------

import { Point, modP } from "./constant";

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
/**
 * bigint を F_p の正準表現に変換（常に 0 ≦ n < p）
 */
export const toBigintModP = (n: bigint, p: bigint): bigint => ((n % p) + p) % p;

