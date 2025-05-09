import { generateKey } from "./generateKey";

// ex:
// Address: 0x597bbFDAAe7De1CEC6F9a237d129B8A640a66505
// Private Key: 0xebce77fe4c7df7c3795e6a51b37d5d6ebf21c844d0ed4da8861b0fa7f48f0d1a
// Mnemonic: breeze tackle yellow jazz lion east prison multiply senior struggle celery galaxy
test('returns valid object', () => {
  const result = generateKey()
  expect(typeof result.address == 'string').toBe(true)
  expect(typeof result.privateKey == 'string').toBe(true)
  expect(typeof result.mnemonicPhrase == 'string').toBe(true)
})
