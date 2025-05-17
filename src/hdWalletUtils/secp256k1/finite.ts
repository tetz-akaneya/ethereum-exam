// ------------------
// 数学ユーティリティ (有限体, finite field)
// ------------------

import { Tagged } from "type-fest";

/**
 * bigint を F_p の正準表現に変換（常に 0 ≦ n < p）
 * JavaScriptの `%` は剰余（remainder）で負値を返す可能性があるため、正の代表元を得るために補正する。
 */
const toBigintModP = (n: bigint, p: bigint): bigint => ((n % p) + p) % p;

type _FiniteP = {
  val: bigint
  p: bigint
}
export type FiniteP = Tagged<_FiniteP, 'FiniteP'>

const makeFiniteP = (arg: _FiniteP): FiniteP => {
  return {
    val: toBigintModP(arg.val, arg.p),
    p: arg.p
  } as FiniteP
}

// 和
const addInModP = (a: FiniteP, b: FiniteP): FiniteP => {
  if (a.p !== b.p) throw new Error('invalid p')

  return makeFiniteP({ val: a.val + b.val, p: a.p });
};

// 差
const subInModP = (a: FiniteP, b: FiniteP): FiniteP => {
  if (a.p !== b.p) throw new Error('invalid p')

  return makeFiniteP({ val: a.val - b.val, p: a.p })
};

// 積
const mulInModP = (a: FiniteP, b: FiniteP): FiniteP => {
  if (a.p !== b.p) throw new Error('invalid p')

  return makeFiniteP({ val: a.val * b.val, p: a.p })
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

  return makeFiniteP({ val: t, p: a.p })
};

export const Fp = {
  make: makeFiniteP,
  add: addInModP,
  sub: subInModP,
  mul: mulInModP,
  div: divInModP,
  inv: inverseOfInModP,
};
