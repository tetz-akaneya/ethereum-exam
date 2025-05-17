import { ethers } from 'ethers';
import { Tagged } from 'type-fest';

import { KeyInfo } from '../hdWalletUtils/keyInfo.js';
import {
  getPublicKeyCompressed,
  PrivateKey,
} from '../hdWalletUtils/privateKey.js';
import { hexToUint8Array } from '../primitive/converter.js';

type _EvmAddress = Uint8Array;
export type EvmAddressType = Tagged<_EvmAddress, 'Address'>;

const make = (data: _EvmAddress) => {
  if (!isValidEvmAddressBytes(data)) {
    throw new Error('invalid address');
  }

  return data as EvmAddressType;
};

const isValidEvmAddressBytes = (data: Uint8Array): boolean => {
  return data.length === 20;
};

const fromKeyInfo = (keyInfo: KeyInfo): EvmAddressType => {
  return createEvmAddress(keyInfo.privKey);
};

// Ethereumアドレス取得（0x付き、先頭12バイト除去）
const createEvmAddress = (privKey: PrivateKey): EvmAddressType => {
  // 非圧縮形式であることに注意
  const pubKey = getPublicKeyCompressed(privKey, false).subarray(1); // 65バイト中、先頭1バイトを除去
  const address = ethers.keccak256(pubKey).slice(-40); // 下位20バイト

  return make(hexToUint8Array(address));
};

export const EvmAddress = {
  createEvmAddress: createEvmAddress,
  fromKeyInfo,
  make: make,
};
