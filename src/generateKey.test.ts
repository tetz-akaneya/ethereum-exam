import fc from 'fast-check';

import {
  changePathDict,
  coinTypeDict,
  createMnemonic,
  deriveKeyFromMnemonic,
  genBip44Path,
  purposeDict,
  typedKeys,
} from './generateHdKey.js';

const passphrase = 'passphrase';

describe('deriveKey', () => {
  it('should derive correct key from static mnemonic', () => {
    const key = deriveKeyFromMnemonic({
      mnemonicString:
        'breeze tackle yellow jazz lion east prison multiply senior struggle celery galaxy',
      passphrase,
      path: genBip44Path({
        purpose: purposeDict.BIP44,
        coinType: coinTypeDict.Ethereum,
        account: 0,
        change: changePathDict.external,
        index: 0,
      }),
    });

    expect(key).toEqual({
      address: '0xe3c8468a41b17ccfb37324cca0577b9463ad860b',
      privateKey:
        '0x27e3b75b734ef80adfcddc1e94ba99000cb11fe7b3c4c0efd8e1defba158042f',
      publicKey:
        '0x03045fae61d46c406f0d6638e336b44bdf3ca2cd25f1691aed99d63983e904d5bc',
    });
  });

  it('should derive key from randomly generated mnemonic', () => {
    const mnemonicString = createMnemonic({ byteSize: 32 });
    const key = deriveKeyFromMnemonic({
      mnemonicString,
      passphrase,
      path: genBip44Path({
        purpose: purposeDict.BIP44,
        coinType: coinTypeDict.Ethereum,
        account: 0,
        change: changePathDict.external,
        index: 0,
      }),
    });

    expect(key.address.length).toEqual(42);
    expect(key.publicKey.length).toEqual(68);
    expect(key.privateKey.length).toEqual(66);
  });
});

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

describe('createMnemonic', () => {
  it('should generate 24-word mnemonic when byteSize is 32', () => {
    const actual = createMnemonic({ byteSize: 32 }).split(' ').length
    const expected = 24

    expect(actual).toEqual(expected);
  });
});

