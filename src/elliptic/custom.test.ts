import { createHmac, generateKey, } from 'crypto';
import { createPublicKey, deriveHardened, deriveNormal, ethereumAddressFromPrivKey, G, scalarMult } from './custom';
import { createMnemonic } from '../generateKey';
import { Mnemonic } from 'ethers';
const secp256k1 = require('secp256k1');

test('ethereum address', () => {
  // マスターシードからm/44'/60'/0'/0/0を導出
  const seed = Mnemonic.fromPhrase('breeze tackle yellow jazz lion east prison multiply senior struggle celery galaxy').computeSeed()
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
})

test('k = 1n', () => {
  const P = scalarMult(1n, G);

  expect(P).toEqual([
    0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
    0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
  ])
})

test('createPublicKey', () => {
  const privBuf = new Uint8Array(32)
  privBuf[30] = 0x12
  privBuf[31] = 7
  const P1 = createPublicKey(privBuf, true);
  const P2 = secp256k1.publicKeyCreate(privBuf, true)

  expect(P1).toEqual(P2)
})
