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
    address: '0xd5d66ea090D9c1D1a7663E5AB6Eab5EC38Dfa1Ca',
    privateKey: '0x45a6ff4ac5154f1e364448b8822293e859f79403eb533addaf82c85c46e9a195',
    publicKey: '0x036728137ae68a1c6efc11a1dec20e02a67d496ea0f22799f23d1bedac53fa04a1',
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

