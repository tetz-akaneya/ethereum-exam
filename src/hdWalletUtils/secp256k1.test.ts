import fc from 'fast-check';

import { G } from './constant';
import { multiplyPointNTimes } from './secp256k1Op';
import { multiplyGNTimesEc } from './testUse/libraryImp';

describe('multiplyPointNTimes', () => {
  it('works same as library', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 2n ** 256n - 1n }), // ← max は inclusive なので -1n
        (n) => {
          const customResult = multiplyPointNTimes(n, G);
          const libResult = multiplyGNTimesEc(n);

          expect(customResult).toEqual(libResult);
        },
      ),
    );
  });
});
