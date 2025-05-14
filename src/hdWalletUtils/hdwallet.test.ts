import { ethers, HDNodeWallet, Wallet } from 'ethers';
import * as fc from 'fast-check';
import {
  createMasterKeyBip32,
  createPublicKey,
  ethereumAddressFromPrivKey,
  mnemonicToSeed,
  selfmadeCKDpriv,
  selfmadeDeriveKey,
} from './hdwallet';
import { multiplyGNTimesEc } from './testUse/libraryImp';

import {
  changePathDict,
  coinTypeDict,
  createMnemonic,
  genBipTypicalPath,
  purposeDict,
  typedKeys,
} from '../generateHdKey';
import { CURVE_ORDER, G, HARDENED_OFFSET } from './constant';
import {
  bigintToHex,
  bufferToHex,
  hexToBuffer,
  hexToUint8Array,
  multiplyPointNTimes,
  uint8ArrayToHex,
} from './convert';

import secp256k1 from 'secp256k1';
import { Mnemonic } from 'ethers';

describe('createMasterKeyBip32', () => {
  it('works same as library', () => {
    const seed = '000102030405060708090a0b0c0d0e0f';
    const seedBuf = hexToBuffer(seed);
    const wallet = ethers.HDNodeWallet.fromSeed(seedBuf);
    const actual = createMasterKeyBip32(seedBuf);

    // buffer での比較が不慣れだったので文字列にして比較
    expect(bufferToHex(actual.key, true)).toEqual(wallet.privateKey);
    expect(bufferToHex(actual.chainCode, true)).toEqual(wallet.chainCode);
  });
});

describe('selfmadeCKDpriv', () => {
  it('works same as library', () => {
    const seed = '000102030405060708090a0b0c0d0e0f';
    const seedBuf = hexToBuffer(seed);
    const wallet = ethers.HDNodeWallet.fromSeed(seedBuf);
    const I = createMasterKeyBip32(seedBuf);

    const child1 = selfmadeCKDpriv(I.key, I.chainCode, HARDENED_OFFSET + 0);
    expect(bufferToHex(child1.key, true)).toEqual(
      wallet.derivePath("m/0'").privateKey,
    );
    expect(bufferToHex(child1.chainCode, true)).toEqual(
      wallet.derivePath("m/0'").chainCode,
    );

    const child2 = selfmadeCKDpriv(
      child1.key,
      child1.chainCode,
      HARDENED_OFFSET + 0,
    );
    expect(bufferToHex(child2.chainCode, true)).toEqual(
      wallet.derivePath("m/0'/0'").chainCode,
    );
    expect(bufferToHex(child2.key, true)).toEqual(
      wallet.derivePath("m/0'/0'").privateKey,
    );

    const child3 = selfmadeCKDpriv(child2.key, child2.chainCode, 0);
    expect(bufferToHex(child3.chainCode, true)).toEqual(
      wallet.derivePath("m/0'/0'/0").chainCode,
    );
    expect(bufferToHex(child3.key, true)).toEqual(
      wallet.derivePath("m/0'/0'/0").privateKey,
    );
  });
});

describe('selfmadeDeriveKey', () => {
  it('works same as library', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 2n ** 128n, max: 2n ** 512n - 1n }),
        fc.constantFrom(...typedKeys(purposeDict)),
        fc.constantFrom(...typedKeys(coinTypeDict)),
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        fc.constantFrom(...typedKeys(changePathDict)),
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        (seedNum, purposeKey, coinTypeKey, account, changeKey, index) => {
          const generatedPath = genBipTypicalPath({
            purpose: purposeDict[purposeKey],
            coinType: coinTypeDict[coinTypeKey],
            account,
            change: changePathDict[changeKey],
            index,
          });
          const seed = hexToBuffer(bigintToHex(seedNum));
          const wallet =
            ethers.HDNodeWallet.fromSeed(seed).derivePath(generatedPath);
          const expected = {
            key: wallet.privateKey,
            chainCode: wallet.chainCode,
            address: wallet.address.toLowerCase(),
          };
          const result = selfmadeDeriveKey({
            seed,
            passphrase: '',
            path: generatedPath,
          });

          expect({
            key: bufferToHex(result.key, true),
            chainCode: bufferToHex(result.chainCode, true),
            address: result.address,
          }).toEqual(expected);
        },
      ),
    );
  });
});

describe('createAddress', () => {
  it('works same as library', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 1n, max: CURVE_ORDER - 1n }), (n) => {
        const hex = n.toString(16).padStart(64, '0');
        const privBuf = Buffer.from(hex, 'hex');

        const customResult = ethereumAddressFromPrivKey(privBuf);
        const wallet = new Wallet('0x' + hex);
        const libResult = wallet.address;

        expect(customResult).toEqual(libResult.toLowerCase());
      }),
    );
  });
});

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

describe('createPublicKey', () => {
  it('works same as library', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 1n, max: CURVE_ORDER - 1n }), (n) => {
        const hex = n.toString(16).padStart(64, '0');
        const privBuf = hexToUint8Array(hex);

        const P1 = createPublicKey(privBuf, true);
        const P2 = secp256k1.publicKeyCreate(privBuf, true);

        expect(P1).toEqual(P2);
      }),
    );
  });
});

describe('mnemonicToSeed', () => {
  it('should derive correct seed from static mnemonic and passphrase', () => {
    const mnemonic =
      'breeze tackle yellow jazz lion east prison multiply senior struggle celery galaxy';
    const passphrase = 'passphrase';

    const seed = mnemonicToSeed(mnemonic, passphrase);
    const libMnemonic = Mnemonic.fromPhrase(mnemonic, passphrase)
    expect(uint8ArrayToHex(seed, true)).toEqual(libMnemonic.computeSeed());
  });

  it('should derive correct seed from random mnemonic and passphrase', () => {
    const mnemonic = createMnemonic({ byteSize: 32 })
    const passphrase = 'passphrase';

    const seed = mnemonicToSeed(mnemonic, passphrase);
    const libMnemonic = Mnemonic.fromPhrase(mnemonic, passphrase)
    expect(uint8ArrayToHex(seed, true)).toEqual(libMnemonic.computeSeed());
  });
});
