// ------------------
// 数学ユーティリティ (有限体, finite field)
// ------------------

import { Tagged } from "type-fest";

/**
 * bigint を F_p の正準表現に変換（常に 0 ≦ n < p）
 * JavaScriptの `%` は剰余（remainder）で負値を返す可能性があるため、正の代表元を得るために補正する。
 */
const toBigintModP = (n: bigint, p: bigint): bigint => ((n % p) + p) % p;
const zero = 0n
const one = 1n

type _FiniteP = {
  readonly val: bigint
  readonly p: bigint
}
export type FiniteP = Tagged<_FiniteP, 'FiniteP'>

const makeFiniteP = (p: _FiniteP['p']) => (val: _FiniteP['val']): FiniteP => {
  if (p <= 1) throw new Error('p should be a prime')

  return {
    val: toBigintModP(val, p),
    p: p
  } as FiniteP
}

// 和
const addInModP = (...as: FiniteP[]): FiniteP => {
  if (as.length < 2) throw new Error('at least 2 elements')

  const p = as[0].p;

  const isValidP = as.every((a) => {
    return a.p === p
  })

  if (!isValidP) throw new Error('invalid p')

  const val = as.reduce((acc, a) => {
    return acc + a.val
  }, zero)

  return makeFiniteP(p)(val);
};

// 差
const subInModP = (a: FiniteP, b: FiniteP): FiniteP => {
  if (a.p !== b.p) throw new Error('invalid p')

  return makeFiniteP(a.p)(a.val - b.val);
};

// 積
const mulInModP = (...as: FiniteP[]): FiniteP => {
  if (as.length < 2) throw new Error('at least 2 elements')
  const p = as[0].p;

  const isValidP = as.every((a) => {
    return a.p === p
  })

  if (!isValidP) throw new Error('invalid p')

  const val = as.reduce((acc, a) => {
    return acc * a.val
  }, one)

  return makeFiniteP(p)(val);
};

// 商
const divInModP = (a: FiniteP, b: FiniteP): FiniteP => {
  if (a.p !== b.p) throw new Error('invalid p')
  if (b.val === 0n) throw new Error('Division by zero in F_p');

  return mulInModP(a, inverseOfInModP(b));
};

// 積の逆元
const inverseOfInModP = (a: FiniteP): FiniteP => {
  let [t, newT] = [0n, 1n];
  let [r, newR] = [a.p, a.val];

  while (newR !== 0n) {
    const q = r / newR;
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }
  if (r > 1n) throw new Error(`${a.val} has no inverse modulo ${a.p}`);

  return makeFiniteP(a.p)(t);
};

export const Fp = {
  makeFp: makeFiniteP,
  add: addInModP,
  sub: subInModP,
  mul: mulInModP,
  div: divInModP,
  inv: inverseOfInModP,
};
