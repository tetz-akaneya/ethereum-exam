import fc from 'fast-check'

import { Fp } from './finite'

describe('Fp basic arithmetic', () => {
  test('basic addition, subtraction, multiplication, division', () => {
    const p = 7n
    const make = Fp.makeFp(p)
    const a = make(3n)
    const b = make(5n)

    expect(Fp.add(a, b).val).toBe(1n)
    expect(Fp.sub(a, b).val).toBe(5n)
    expect(Fp.mul(a, b).val).toBe(1n)
    expect(Fp.div(a, b).val).toBe(2n)
  })

  test('additive identity and inverse', () => {
    const p = 11n
    const make = Fp.makeFp(p)
    const a = make(7n)
    const zero = make(0n)

    expect(Fp.add(a, zero).val).toBe(a.val)
    expect(Fp.sub(a, a).val).toBe(0n)
  })

  test('multiplicative identity and inverse', () => {
    const p = 13n
    const make = Fp.makeFp(p)
    for (let i = 1n; i < p; i++) {
      const x = make(i)
      const inv = Fp.inv(x)
      const one = Fp.mul(x, inv)
      expect(one.val).toBe(1n)
    }
  })

  test('distributive law', () => {
    const p = 17n
    const make = Fp.makeFp(p)
    const a = make(3n)
    const b = make(4n)
    const c = make(5n)

    const left = Fp.mul(a, Fp.add(b, c))
    const right = Fp.add(Fp.mul(a, b), Fp.mul(a, c))
    expect(left.val).toBe(right.val)
  })

  test('negative value is normalized', () => {
    const p = 17n
    const make = Fp.makeFp(p)
    const a = make(-5n)
    expect(a.val).toBe(12n) // (-5 mod 17) = 12
  })

  test('throws on mismatched p', () => {
    const a = Fp.makeFp(11n)(1n)
    const b = Fp.makeFp(13n)(2n)
    expect(() => Fp.add(a, b)).toThrow(/invalid p/)
  })

  test('throws on division by zero', () => {
    const p = 7n
    const make = Fp.makeFp(p)
    const a = make(3n)
    const zero = make(0n)
    expect(() => Fp.div(a, zero)).toThrow(/Division by zero/)
  })
})

// ------------------
// fast-check プロパティテスト
// ------------------

const arbFp = (p: bigint) =>
  fc.bigInt({ min: 0n, max: p - 1n }).map((n) => Fp.makeFp(p)(n))

describe('Fp property-based tests', () => {
  const p = 101n

  test('addition is commutative', () => {
    fc.assert(
      fc.property(arbFp(p), arbFp(p), (a, b) => {
        const ab = Fp.add(a, b).val
        const ba = Fp.add(b, a).val
        expect(ab).toBe(ba)
      }),
    )
  })

  test('multiplication is associative', () => {
    fc.assert(
      fc.property(arbFp(p), arbFp(p), arbFp(p), (a, b, c) => {
        const left = Fp.mul(Fp.mul(a, b), c).val
        const right = Fp.mul(a, Fp.mul(b, c)).val
        expect(left).toBe(right)
      }),
    )
  })
})
