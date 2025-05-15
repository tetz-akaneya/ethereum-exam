import fc from 'fast-check';

import {
  changePathDict,
  coinTypeDict,
  genBip44Path,
  purposeDict,
  typedKeys,
} from './bip32Path';

describe('genBip44Path', () => {
  it('should generate correct BIP44 path format for random path', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...typedKeys(purposeDict)),
        fc.constantFrom(...typedKeys(coinTypeDict)),
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        fc.constantFrom(...typedKeys(changePathDict)),
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        (purposeKey, coinTypeKey, account, changeKey, index) => {
          const actual = genBip44Path({
            purpose: purposeDict[purposeKey],
            coinType: coinTypeDict[coinTypeKey],
            account,
            change: changePathDict[changeKey],
            index,
          });

          const expected = `m/${purposeDict[purposeKey]}'/${coinTypeDict[coinTypeKey]}'/${account}'/${changePathDict[changeKey]}/${index}`;
          expect(actual).toEqual(expected);
        },
      ),
    );
  });
});
