import { ethers, Wallet } from 'ethers';
import fc from 'fast-check';
import secp256k1 from 'secp256k1';

import { HARDENED_OFFSET } from './bip32Path';
import { CKDpriv, getEthereumAddress, getPublicKey } from './privateKey';
import { CURVE_ORDER } from './secp256k1/point';
import { createMasterKey } from './seed';
import { appendHexPrefix, hexToUint8Array, hexToBuffer, bufferToHex } from '../converter/primitive';

describe('createAddress', () => {
  it('works same as library', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 1n, max: CURVE_ORDER - 1n }), (n) => {
        const hex = n.toString(16).padStart(64, '0');
        const privBuf = Buffer.from(hex, 'hex');

        const customResult = getEthereumAddress(privBuf);
        const wallet = new Wallet(appendHexPrefix(hex));
        const libResult = wallet.address;

        expect(customResult).toEqual(libResult.toLowerCase());
      }),
    );
  });
});

describe('createPublicKey', () => {
  it('works same as library', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 1n, max: CURVE_ORDER - 1n }), (n) => {
        const hex = n.toString(16).padStart(64, '0');
        const privBuf = hexToUint8Array(hex);

        const P1 = getPublicKey(privBuf, true);
        const P2 = secp256k1.publicKeyCreate(privBuf, true);

        expect(P1).toEqual(P2);
      }),
    );
  });
});

describe('selfmadeCKDpriv', () => {
  it('works same as library', () => {
    const seed = '000102030405060708090a0b0c0d0e0f';
    const seedBuf = hexToBuffer(seed);
    const wallet = ethers.HDNodeWallet.fromSeed(seedBuf);
    const I = createMasterKey(seedBuf);

    const child1 = CKDpriv(I.privKey, I.chainCode, HARDENED_OFFSET + 0);
    expect(bufferToHex(child1.privKey, true)).toEqual(
      wallet.derivePath("m/0'").privateKey,
    );
    expect(bufferToHex(child1.chainCode, true)).toEqual(
      wallet.derivePath("m/0'").chainCode,
    );

    const child2 = CKDpriv(
      child1.privKey,
      child1.chainCode,
      HARDENED_OFFSET + 0,
    );
    expect(bufferToHex(child2.chainCode, true)).toEqual(
      wallet.derivePath("m/0'/0'").chainCode,
    );
    expect(bufferToHex(child2.privKey, true)).toEqual(
      wallet.derivePath("m/0'/0'").privateKey,
    );

    const child3 = CKDpriv(child2.privKey, child2.chainCode, 0);
    expect(bufferToHex(child3.chainCode, true)).toEqual(
      wallet.derivePath("m/0'/0'/0").chainCode,
    );
    expect(bufferToHex(child3.privKey, true)).toEqual(
      wallet.derivePath("m/0'/0'/0").privateKey,
    );
  });
});
