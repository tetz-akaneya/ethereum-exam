import { Mnemonic } from 'ethers'

import { uint8ArrayToHex } from '../primitive/converter'
import {
  changePathDict,
  coinTypeDict,
  genBip44Path,
  purposeDict,
} from './derivePath'
import { createMnemonic, deriveKeyInfoFromMnemonic, toSeed } from './mnemonic'

const passphrase = 'passphrase'

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
    })

    expect(uint8ArrayToHex(actual.privKey, true)).toEqual(
      '0x27e3b75b734ef80adfcddc1e94ba99000cb11fe7b3c4c0efd8e1defba158042f',
    )
    expect(actual.publicKey).toEqual(
      '0x03045fae61d46c406f0d6638e336b44bdf3ca2cd25f1691aed99d63983e904d5bc',
    )
  })

  it('should derive key from randomly generated mnemonic', () => {
    const mnemonic = createMnemonic({ byteSize: 32 })
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
    })

    expect(key.publicKey.length).toEqual(68)
    expect(key.privKey.length).toEqual(32)
  })
})

describe('createMnemonic', () => {
  it('should generate 24-word mnemonic when byteSize is 32', () => {
    const actual = createMnemonic({ byteSize: 32 }).split(' ').length
    const expected = 24

    expect(actual).toEqual(expected)
  })
})

describe('toSeed', () => {
  it('should derive correct seed from static mnemonic and passphrase', () => {
    const mnemonic =
      'breeze tackle yellow jazz lion east prison multiply senior struggle celery galaxy'

    const seed = toSeed(mnemonic, passphrase)
    const libMnemonic = Mnemonic.fromPhrase(mnemonic, passphrase)
    const actual = uint8ArrayToHex(seed, true)
    const expected = libMnemonic.computeSeed()

    expect(actual).toEqual(expected)
  })

  it('should derive correct seed from random mnemonic and passphrase', () => {
    const mnemonic = createMnemonic({ byteSize: 32 })

    const seed = toSeed(mnemonic, passphrase)
    const libMnemonic = Mnemonic.fromPhrase(mnemonic, passphrase)
    const actual = uint8ArrayToHex(seed, true)
    const expected = libMnemonic.computeSeed()

    expect(actual).toEqual(expected)
  })
})
