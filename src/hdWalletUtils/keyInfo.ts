import type { Tagged } from 'type-fest'

import { PrivateKey } from './privateKey'

type _KeyInfo = {
  publicKey: Uint8Array
  privKey: PrivateKey
  chainCode: Uint8Array
}

/*
 * HD tree のノード情報
 */
export type KeyInfo = Tagged<_KeyInfo, 'KeyInfo'>

export const makeKeyInfo = (data: _KeyInfo): KeyInfo => {
  return data as KeyInfo
}
