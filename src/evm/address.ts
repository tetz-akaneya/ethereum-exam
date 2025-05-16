import { ethers } from 'ethers';
import { Tagged } from 'type-fest';

import { KeyInfo } from '../hdWalletUtils/keyInfo';
import {
  getPublicKeyCompressed,
  PrivateKey,
} from '../hdWalletUtils/privateKey';
import { hexToUint8Array } from '../primitive/converter';

type _EvmAddress = Uint8Array;
export type EvmAddress = Tagged<_EvmAddress, 'Address'>;

export const makeEvmAddress = (data: _EvmAddress) => {
  return data as EvmAddress;
};

export const fromKeyInfo = (keyInfo: KeyInfo): EvmAddress => {
  return getEvmAddress(keyInfo.privKey);
};

// Ethereumアドレス取得（0x付き、先頭12バイト除去）
export const getEvmAddress = (privKey: PrivateKey): EvmAddress => {
  // 非圧縮形式であることに注意
  const pubKey = getPublicKeyCompressed(privKey, false).subarray(1); // 65バイト中、先頭1バイトを除去
  const address = ethers.keccak256(pubKey).slice(-40); // 下位20バイト

  return makeEvmAddress(hexToUint8Array(address));
};
