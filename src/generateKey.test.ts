import { changePathDict, createMnemonic, deriveKey, genPath, coinTypeDict, defaultPurpose } from "./generateKey";

const passphrase = 'passphrase'

test('static mnemonic derives to key', () => {
  const key = deriveKey({
    mnemonicString: 'breeze tackle yellow jazz lion east prison multiply senior struggle celery galaxy',
    passphrase,
    path: genPath({
      purpose: defaultPurpose,
      coinType: coinTypeDict.Ethereum,
      account: 0,
      change: changePathDict.external,
      index: 0
    }),
  })

  expect(key).toEqual({
    address: '0xe3c8468a41B17cCFB37324CcA0577b9463aD860B',
    privateKey: '0x27e3b75b734ef80adfcddc1e94ba99000cb11fe7b3c4c0efd8e1defba158042f',
    publicKey: '0x03045fae61d46c406f0d6638e336b44bdf3ca2cd25f1691aed99d63983e904d5bc',
  })
})

test('random mnemonic derives to key', () => {
  const mnemonicString = createMnemonic({ byteSize: 32 })
  const key = deriveKey({
    mnemonicString,
    passphrase,
    path: genPath({
      purpose: defaultPurpose,
      coinType: coinTypeDict.Ethereum,
      account: 0,
      change: changePathDict.external,
      index: 0
    }),
  })

  expect(key.address.length).toEqual(42)
  expect(key.publicKey.length).toEqual(68)
  expect(key.privateKey.length).toEqual(66)
})

test('genPath example', () => {
  expect(genPath({
    purpose: defaultPurpose,
    coinType: coinTypeDict.Ethereum,
    account: 0,
    change: changePathDict.external,
    index: 0,
  })).toEqual("m/44'/60'/0'/0/0")
})

test('createMnemonic example', () => {
  expect(
    createMnemonic({ byteSize: 32 }).split(' ').length
  ).toEqual(24)
})

