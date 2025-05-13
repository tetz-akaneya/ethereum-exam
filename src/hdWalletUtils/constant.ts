// ----------------------
// 定数
// ----------------------
// secp256k1 の有限体の素数 modP（256ビット）
export const modP = 2n ** 256n - 2n ** 32n - 977n;

// 秘密鍵の上限値
export const CURVE_ORDER =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

export const HARDENED_OFFSET = 2 ** 31;
export type Point = [bigint, bigint];

// secp256k1 の生成点
export const G: Point = [
  0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
];
