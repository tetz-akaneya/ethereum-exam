import BN from 'bn.js';

import { ec as EC, curve } from 'elliptic';

// ライブラリバージョンのpublicKey
function getPublicKeyFromPrivateKeyEllip(n: bigint) {
  // secp256k1 曲線のインスタンスを作成
  const ec = new EC('secp256k1');

  // 例: 生成点 G を取得
  const G: curve.base.BasePoint = ec.g;

  const multipliedG = G.mul(new BN(n.toString(10)));

  return [multipliedG.getX().toString(16), multipliedG.getX().toString(16)];
}

test('scalarMult', () => {
  getPublicKeyFromPrivateKeyEllip(7n);
});
