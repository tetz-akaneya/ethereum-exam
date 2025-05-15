import { createHmac } from 'crypto';

import { parseDerivationPath } from './bip32Path.js';
import { CKDpriv, getEthereumAddress, getPublicKey } from './privateKey.js';

export const createMasterKey = (seed: Buffer) => {
  const I = createHmac('sha512', 'Bitcoin seed').update(seed).digest();

  return {
    privKey: I.subarray(0, 32),
    chainCode: I.subarray(32),
  };
};

export const deriveKeyInfoFromSeed = (arg: {
  seed: Buffer;
  passphrase: string;
  path: string;
}) => {
  const parsedPath = parseDerivationPath(arg.path);
  const I = createMasterKey(arg.seed);

  const keysForPath = parsedPath.reduce((prev, index) => {
    return CKDpriv(prev.privKey, prev.chainCode, index);
  }, I);

  const publicKey = getPublicKey(keysForPath.privKey, true);

  return {
    publicKey,
    privKey: keysForPath.privKey,
    chainCode: keysForPath.chainCode,
    address: getEthereumAddress(keysForPath.privKey),
  };
};
