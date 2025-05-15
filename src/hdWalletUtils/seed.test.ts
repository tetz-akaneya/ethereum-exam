import { ethers } from 'ethers';
import fc from 'fast-check';

import {
  changePathDict,
  coinTypeDict,
  genBip44Path,
  purposeDict,
  typedKeys,
} from './bip32Path';
import { createMasterKey, deriveKeyInfoFromSeed } from './seed';
import { hexToBuffer, uBigIntToHex, bufferToHex } from '../primitive/converter';

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
          const generatedPath = genBip44Path({
            purpose: purposeDict[purposeKey],
            coinType: coinTypeDict[coinTypeKey],
            account,
            change: changePathDict[changeKey],
            index,
          });
          const seed = hexToBuffer(uBigIntToHex(seedNum));
          const wallet =
            ethers.HDNodeWallet.fromSeed(seed).derivePath(generatedPath);
          const expected = {
            key: wallet.privateKey,
            chainCode: wallet.chainCode,
            address: wallet.address.toLowerCase(),
          };
          const result = deriveKeyInfoFromSeed({
            seed,
            passphrase: '',
            path: generatedPath,
          });

          expect({
            key: bufferToHex(result.privKey, true),
            chainCode: bufferToHex(result.chainCode, true),
            address: result.address,
          }).toEqual(expected);
        },
      ),
    );
  });
});

describe('createMasterKeyBip32', () => {
  it('works same as library', () => {
    const seed = '000102030405060708090a0b0c0d0e0f';
    const seedBuf = hexToBuffer(seed);
    const wallet = ethers.HDNodeWallet.fromSeed(seedBuf);
    const actual = createMasterKey(seedBuf);

    // buffer での比較が不慣れだったので文字列にして比較
    expect(bufferToHex(actual.privKey, true)).toEqual(wallet.privateKey);
    expect(bufferToHex(actual.chainCode, true)).toEqual(wallet.chainCode);
  });
});
