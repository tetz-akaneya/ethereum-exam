import fc from 'fast-check'

import { G, multiplyGNTimesEc, multiplyPointNTimes } from './point'

describe('multiplyPointNTimes', () => {
  it('works same as library', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 2n ** 256n - 1n }), // ← max は inclusive なので -1n
        (n) => {
          const customResult = multiplyPointNTimes(n, G)
          const libResult = multiplyGNTimesEc(n)

          expect(customResult).toEqual(libResult)
        },
      ),
    )
  })
})
