import BN from 'bn.js';
import { curve, ec as EC } from 'elliptic';

import { appendHexPrefix } from '../primitiveConvert';

// test のため
export function multiplyGNTimesEc(n: bigint) {
  // secp256k1 曲線のインスタンスを作成
  const ec = new EC('secp256k1');

  // 例: 生成点 G を取得
  const G: curve.base.BasePoint = ec.g;

  const multipliedG = G.mul(new BN(n.toString(10)));

  return [
    BigInt(appendHexPrefix(multipliedG.getX().toString(16))),
    BigInt(appendHexPrefix(multipliedG.getY().toString(16))),
  ];
}
