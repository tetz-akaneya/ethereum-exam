import { Mnemonic } from 'ethers';

import {
  changePathDict,
  coinTypeDict,
  genBip44Path,
  purposeDict,
} from './bip32Path';
import { createMnemonic, deriveKeyInfoFromMnemonic, toSeed } from './mnemonic';
import { uint8ArrayToHex } from '../primitive/converter';

const passphrase = 'passphrase';

describe('keysForBipPath', () => {
  it('should derive correct key from static mnemonic', () => {
    const actual = deriveKeyInfoFromMnemonic({
      mnemonic:
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

    expect(actual).toEqual({
      address: '0xe3c8468a41b17ccfb37324cca0577b9463ad860b',
      privKey:
        '0x27e3b75b734ef80adfcddc1e94ba99000cb11fe7b3c4c0efd8e1defba158042f',
      publicKey:
        '0x03045fae61d46c406f0d6638e336b44bdf3ca2cd25f1691aed99d63983e904d5bc',
    });
  });

  it('should derive key from randomly generated mnemonic', () => {
    const mnemonic = createMnemonic({ byteSize: 32 });
    const key = deriveKeyInfoFromMnemonic({
      mnemonic: mnemonic,
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
    expect(key.privKey.length).toEqual(66);
  });
});

describe('createMnemonic', () => {
  it('should generate 24-word mnemonic when byteSize is 32', () => {
    const actual = createMnemonic({ byteSize: 32 }).split(' ').length;
    const expected = 24;

    expect(actual).toEqual(expected);
  });
});

describe('toSeed', () => {
  it('should derive correct seed from static mnemonic and passphrase', () => {
    const mnemonic =
      'breeze tackle yellow jazz lion east prison multiply senior struggle celery galaxy';

    const seed = toSeed(mnemonic, passphrase);
    const libMnemonic = Mnemonic.fromPhrase(mnemonic, passphrase);
    const actual = uint8ArrayToHex(seed, true)
    const expected = libMnemonic.computeSeed()

    expect(actual).toEqual(expected);
  });

  it('should derive correct seed from random mnemonic and passphrase', () => {
    const mnemonic = createMnemonic({ byteSize: 32 });

    const seed = toSeed(mnemonic, passphrase);
    const libMnemonic = Mnemonic.fromPhrase(mnemonic, passphrase);
    const actual = uint8ArrayToHex(seed, true);
    const expected = libMnemonic.computeSeed();

    expect(actual).toEqual(expected);
  });
});
