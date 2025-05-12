import { createHmac } from 'crypto';
import { ethers } from 'ethers';
// const secp256k1 = require('secp256k1');

// secp256k1 の有限体の素数 modP（256ビット）
const modP = 2n ** 256n - 2n ** 32n - 977n;

type Point = [bigint, bigint]

// secp256k1 の生成点
export const G: Point = [
  0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
];

// Hardened index helper
// ハード化されたインデクスはここから始まる
const HARDENED_OFFSET_ARRAY = new Uint8Array([0x80, 0x00, 0x00, 0x00])
const HARDENED_OFFSET = parseInt(uint8ArrayToHex(HARDENED_OFFSET_ARRAY), 16)

// 有限体 F_p の値に強制的に変換
// JSの% p は、[-p+1, p-1]の値を取るが、有限体としては[0,p-1]に収まる必要があるため
function inModP(n: bigint, p: bigint) {
  return ((n % p) + p) % p
}

// Uint8Array から Hex 文字列に変換
function uint8ArrayToHex(arrayBuffer: Uint8Array) {
  return Array.from(arrayBuffer).map((i) => {
    return i.toString(16).padStart(2, '0')
  }).join('')
}

// Hex 文字列からUint8Arrayに変換
export function hexToUint8Array(hex: string): Uint8Array {
  // remove 0x prefix if present
  if (hex.startsWith('0x')) {
    hex = hex.slice(2);
  }

  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }

  if (!/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error('Invalid hex string: contains non-hex characters');
  }

  const len = hex.length / 2;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    u8[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return u8;
}
/**
 * inverseOfModP: a の mod p における逆元（a⁻¹ ≡ a⁻¹ mod p）を計算する
 * 拡張ユークリッドの互除法を使う
 */
export function inverseOfModP(a: bigint, p: bigint): bigint {
  a = inModP(a, p)
  let [t, newT] = [0n, 1n];
  let [r, newR] = [p, a];

  while (newR !== 0n) {
    const q = r / newR;
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }

  return t < 0n ? t + p : t;
}

/**
 * 楕円曲線上の2点 P, Q を加算する（P = Q の場合もOK）
 */
export function pointAdd(P: Point, Q: Point): Point {
  const [x1, y1] = P;
  const [x2, y2] = Q;

  let lambda: bigint;

  if (x1 === x2 && y1 === y2) {
    // 倍加（doubling）
    lambda = (3n * x1 * x1) * inverseOfModP(2n * y1, modP), modP
  } else {
    // 一般加算
    lambda = (y2 - y1) * inverseOfModP(x2 - x1, modP), modP
  }

  const x3 = inModP(lambda * lambda - x1 - x2, modP);
  const y3 = inModP(lambda * (x1 - x3) - y1, modP);

  return [x3, y3];
}

/**
 * scalarMult: 楕円曲線上の点 G にスカラー k を掛ける（k·G）
 */
export function multiplyPointNTimes(k: bigint, G: Point): Point {
  let R: Point | null = null;
  let addend = G;

  while (k > 0n) {
    if (k & 1n) {
      // Rが無限遠点(null)の場合は、0として計算
      R = R === null ? addend : pointAdd(R, addend);
    }
    addend = pointAdd(addend, addend);
    k >>= 1n;
  }

  return R!;
}

// ハード化されたBIP32子鍵導出
export const deriveHardened = (
  privKey: Buffer,
  chainCode: Buffer,
  index: number
): {
  key: Buffer,
  chainCode: Buffer
} => {
  const indexBuffer = Buffer.alloc(4);
  indexBuffer.writeUInt32BE(index + HARDENED_OFFSET, 0);
  // privKey を 33byteにするため、00を先頭に追加する
  // Note: The 0x00 pads the private key to make it 33 bytes long
  const data = Buffer.concat([Buffer.from([0x00]), privKey, indexBuffer]);

  const I = createHmac('sha512', chainCode).update(data).digest();
  const ILbn = inModP(BigInt('0x' + I.subarray(0, 32).toString('hex')) + BigInt('0x' + privKey.toString('hex')), modP);
  const IR = I.subarray(32);

  return {
    key: Buffer.from(ILbn.toString(16).padStart(64, '0'), 'hex'),
    chainCode: IR
  };
}

// 通常のBIP32子鍵導出
export const deriveNormal = (
  pubKey: Buffer,
  chainCode: Buffer,
  index: number
): {
  key: Buffer,
  chainCode: Buffer
} => {
  const indexBuffer = new Uint8Array([0, 0, 0, index])
  const data = Buffer.concat([pubKey, indexBuffer]);

  const I = createHmac('sha512', chainCode).update(data).digest();
  const IL = I.subarray(0, 32);
  const IR = I.subarray(32);

  return {
    key: IL,
    chainCode: IR
  };
}

// Ethereumアドレス取得（0x付き、先頭12バイト除去）
export const ethereumAddressFromPrivKey = (
  privKey: Buffer
): string => {
  // 非圧縮形式であることに注意
  const pubKey = createPublicKey(privKey, false).subarray(1); // 65バイト中、先頭1バイトを除去
  const address = ethers.keccak256(pubKey).slice(-40); // 下位20バイト
  return '0x' + address
}

export const maxPrivateKey = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n
export function createPublicKey(privateKey: Uint8Array, compressed: boolean = true) {
  let publicKey: string;
  const privateKeyBignum = BigInt('0x' + uint8ArrayToHex(privateKey))
  if (privateKeyBignum >= maxPrivateKey) {
    return new Uint8Array()
  }

  const PublicKeyPoint = multiplyPointNTimes(BigInt('0x' + uint8ArrayToHex(privateKey)), G)

  if (compressed) {
    const isYEven = PublicKeyPoint[1] % 2n === 0n
    const dynamicPrefix = isYEven ? '02' : '03'
    publicKey = `${dynamicPrefix}${PublicKeyPoint[0].toString(16).padStart(64, '0')}`
  } else {
    const staticPrefix = '04'
    publicKey = `${staticPrefix}${PublicKeyPoint[0].toString(16).padStart(64, '0')}${PublicKeyPoint[1].toString(16).padStart(64, '0')}`
  }

  return hexToUint8Array(publicKey)
}

