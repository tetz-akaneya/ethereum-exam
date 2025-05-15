// ------------------
// 数学ユーティリティ (有限体, finite field)
// bigint で基本的に計算して、最後にtoBigintModPを行えば良い。
// ------------------
/*
 * bigint を F_p の正準表現に変換（常に 0 ≦ n < p）
 */
const toBigintModP = (n: bigint, p: bigint): bigint => ((n % p) + p) % p;

// 和
export const addInModP = (a: bigint, b: bigint, p: bigint): bigint => {
  return toBigintModP(a + b, p)
}

// 差
export const subInModP = (a: bigint, b: bigint, p: bigint): bigint => {
  return toBigintModP(a - b, p)
}

// 積
export const mulInModP = (a: bigint, b: bigint, p: bigint): bigint => {
  return toBigintModP(a * b, p)
}

// 商
export const divInModP = (a: bigint, b: bigint, p: bigint): bigint => {
  return toBigintModP(a * inverseOfInModP(b, p), p)
}

// 積の逆元
export const inverseOfInModP = (a: bigint, p: bigint): bigint => {
  a = toBigintModP(a, p);
  let [t, newT] = [0n, 1n];
  let [r, newR] = [p, a];

  while (newR !== 0n) {
    const q = r / newR;
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }

  return t < 0n ? t + p : t;
}

