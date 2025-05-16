import { ethers, Wallet } from 'ethers';
import fc from 'fast-check';
import secp256k1 from 'secp256k1';

import {
  appendHexPrefix,
  hexToUint8Array,
  uint8ArrayToHex,
} from '../primitive/converter';
import { HARDENED_OFFSET } from './derivePath.js';
import {
  CKDpriv,
  getEthereumAddress,
  getPublicKeyCompressed,
  makePrivateKey,
} from './privateKey';
import { CURVE_ORDER } from './secp256k1/point';
import { createMasterKey, makeSeed } from './seed';

describe('createAddress', () => {
  it('works same as library', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 1n, max: CURVE_ORDER - 1n }), (n) => {
        const hex = n.toString(16).padStart(64, '0');
        const privBuf = makePrivateKey(hexToUint8Array(hex));

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
        const privKey = makePrivateKey(hexToUint8Array(hex));

        const P1 = getPublicKeyCompressed(privKey, true);
        const P2 = secp256k1.publicKeyCreate(privKey, true);

        expect(P1).toEqual(P2);
      }),
    );
  });
});

describe('CKDpriv', () => {
  it('works same as library', () => {
    const seedHex = '000102030405060708090a0b0c0d0e0f';
    const seed = makeSeed(hexToUint8Array(seedHex));
    const libWallet = ethers.HDNodeWallet.fromSeed(seed);
    const I = createMasterKey(seed);

    const child1 = CKDpriv({
      privKey: I.privKey,
      chainCode: I.chainCode,
      index: HARDENED_OFFSET + 0,
    });
    expect(
      uint8ArrayToHex(child1.privKey, true),
    ).toEqual(libWallet.derivePath("m/0'").privateKey);
    expect(uint8ArrayToHex(child1.chainCode, true)).toEqual(
      libWallet.derivePath("m/0'").chainCode,
    );

    const child2 = CKDpriv({
      privKey: child1.privKey,
      chainCode: child1.chainCode,
      index: HARDENED_OFFSET + 0,
    });
    expect(
      uint8ArrayToHex(child2.privKey, true),
    ).toEqual(libWallet.derivePath("m/0'/0'").privateKey);
    expect(uint8ArrayToHex(child2.chainCode, true)).toEqual(
      libWallet.derivePath("m/0'/0'").chainCode,
    );

    const child3 = CKDpriv({
      privKey: child2.privKey,
      chainCode: child2.chainCode,
      index: 0,
    });
    expect(
      uint8ArrayToHex(child3.privKey, true),
    ).toEqual(libWallet.derivePath("m/0'/0'/0").privateKey);
    expect(uint8ArrayToHex(child3.chainCode, true)).toEqual(
      libWallet.derivePath("m/0'/0'/0").chainCode,
    );
  });
});
