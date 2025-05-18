import { ethers } from 'ethers'
import fc from 'fast-check'

import {
  hexToUint8Array,
  uBigIntToHex,
  uint8ArrayToBuffer,
} from '../primitive/converter'
import {
  changePathDict,
  coinTypeDict,
  genBip44Path,
  purposeDict,
  typedKeys,
} from './derivePath.js'
import { PrivateKey } from './privateKey'
import { createMasterKey, deriveKeyInfoFromSeed, makeSeed } from './seed'

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
          })
          const seed = makeSeed(hexToUint8Array(uBigIntToHex(seedNum)))
          const libWallet =
            ethers.HDNodeWallet.fromSeed(seed).derivePath(generatedPath)
          const actual = deriveKeyInfoFromSeed({
            seed,
            passphrase: '',
            path: generatedPath,
          })

          const expected = {
            key: hexToUint8Array(libWallet.privateKey),
            chainCode: hexToUint8Array(libWallet.chainCode),
          }
          expect({
            key: actual.privKey,
            chainCode: actual.chainCode,
          }).toEqual(expected)
        },
      ),
    )
  })
})

describe('createMasterKey', () => {
  it('works same as library', () => {
    const seed = '000102030405060708090a0b0c0d0e0f'
    const libWallet = ethers.HDNodeWallet.fromSeed(
      uint8ArrayToBuffer(hexToUint8Array(seed)),
    )
    const actual = createMasterKey(makeSeed(hexToUint8Array(seed)))

    // buffer での比較が不慣れだったので文字列にして比較
    expect(actual.privKey).toEqual(hexToUint8Array(libWallet.privateKey))
    expect(actual.chainCode).toEqual(hexToUint8Array(libWallet.chainCode))
  })
})
function getPrivateKeyData(privKey: PrivateKey) {
  throw new Error('Function not implemented.')
}
