import { createHmac, } from 'crypto';
import { ethers, HDNodeWallet, Mnemonic, Wallet } from 'ethers';
import * as fc from 'fast-check';
import { createPublicKey, deriveHardened, deriveNormal, ethereumAddressFromPrivKey, G, hexToUint8Array, maxPrivateKey, multiplyPointNTimes } from './custom';
import { multiplyGNTimesEc } from './test/library_imp';
import { changePathDict, coinTypeDict, defaultPurpose, deriveKey, genPath } from '../generateKey';
const secp256k1 = require('secp256k1');

test.skip('ethereum address', () => {
  // マスターシードからm/44'/60'/0'/0/0を導出
  const mnemonic = 'breeze tackle yellow jazz lion east prison multiply senior struggle celery galaxy'
  const seed = Mnemonic.fromPhrase(mnemonic).computeSeed()
  const I = createHmac('sha512', 'Bitcoin seed').update(seed).digest();
  let privKey = I.subarray(0, 32);
  let chainCode = I.subarray(32);

  // m/44'
  ({ key: privKey, chainCode } = deriveHardened(privKey, chainCode, 44));
  // m/44'/60'
  ({ key: privKey, chainCode } = deriveHardened(privKey, chainCode, 60));
  // m/44'/60'/0'
  ({ key: privKey, chainCode } = deriveHardened(privKey, chainCode, 0));
  // m/44'/60'/0'/0
  const pubKey1 = secp256k1.publicKeyCreate(privKey, true);
  const pubKey3 = createPublicKey(privKey, true);

  console.log({ pubKey1 });
  console.log({ pubKey3 });

  ({ key: privKey, chainCode } = deriveNormal(pubKey1, chainCode, 0));
  // m/44'/60'/0'/0/0
  const pubKey2 = secp256k1.publicKeyCreate(privKey, true);
  ({ key: privKey, chainCode } = deriveNormal(pubKey2, chainCode, 0));

  // 最終秘密鍵でアドレス導出
  const address = ethereumAddressFromPrivKey(privKey);
  console.log('Ethereum Address (m/44\'/60\'/0\'/0/0):', address);
  // f784bf9d25e05e93eb12309ee90bfcbf53a78af04d6d2a73735a15eb39101a26
  console.log('Private Key:', privKey.toString('hex'));
  console.log(deriveKey({
    mnemonicString: mnemonic,
    passphrase: 'Bitcoin seed',
    path: genPath({
      purpose: defaultPurpose,
      coinType: coinTypeDict.Ethereum,
      account: 0,
      change: changePathDict.external,
      index: 0,
    })
  }))
})

test('createAddress', () => {
  const arb = fc.bigInt({ min: 1n, max: maxPrivateKey });
  fc.sample(arb, 5).forEach((n) => {
    const customReuslt = ethereumAddressFromPrivKey(Buffer.from(n.toString(16).padStart(64, '0'), 'hex'))
    const wallet = new Wallet('0x' + n.toString(16).padStart(64, '0'))
    const libResult = wallet.address

    expect(customReuslt).toEqual(libResult.toLowerCase())
  })
})

test('compare multiplyPointNTimes to library', () => {
  const arb = fc.bigInt({ min: 1n, max: 2n ** 256n });
  fc.sample(arb, 5).forEach((n) => {
    const customResult = multiplyPointNTimes(n, G)
    const libReusult = multiplyGNTimesEc(n)

    expect(customResult).toEqual(libReusult)
  });
})

test('compare createPublicKey to library', () => {
  const arb = fc.bigInt({ min: 1n, max: maxPrivateKey });
  fc.sample(arb, 5).forEach((n) => {
    const privBuf = hexToUint8Array(n.toString(16).padStart(64, '0'))
    const P1 = createPublicKey(privBuf, true);
    const P2 = secp256k1.publicKeyCreate(privBuf, true)

    expect(P1).toEqual(P2)
  });

})

