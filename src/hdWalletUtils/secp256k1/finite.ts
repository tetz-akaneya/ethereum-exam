// ------------------
// 数学ユーティリティ (有限体, finite field)
// ------------------
/**
 * bigint を F_p の正準表現に変換（常に 0 ≦ n < p）
 * JavaScriptの `%` は剰余（remainder）で負値を返す可能性があるため、正の代表元を得るために補正する。
 */
const toBigintModP = (n: bigint, p: bigint): bigint => ((n % p) + p) % p;

// 和
const addInModP = (a: bigint, b: bigint, p: bigint): bigint => {
  return toBigintModP(a + b, p);
};

// 差
const subInModP = (a: bigint, b: bigint, p: bigint): bigint => {
  return toBigintModP(a - b, p);
};

// 積
const mulInModP = (a: bigint, b: bigint, p: bigint): bigint => {
  return toBigintModP(a * b, p);
};

// 商
const divInModP = (a: bigint, b: bigint, p: bigint): bigint => {
  if (b % p === 0n) throw new Error('Division by zero in F_p');

  return toBigintModP(a * inverseOfInModP(b, p), p);
};

// 積の逆元
const inverseOfInModP = (a: bigint, p: bigint): bigint => {
  a = toBigintModP(a, p);
  let [t, newT] = [0n, 1n];
  let [r, newR] = [p, a];

  while (newR !== 0n) {
    const q = r / newR;
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }
  if (r > 1n) throw new Error(`${a} has no inverse modulo ${p}`);

  return t < 0n ? t + p : t;
};

export const Fp = {
  add: addInModP,
  sub: subInModP,
  mul: mulInModP,
  div: divInModP,
  inv: inverseOfInModP,
};
