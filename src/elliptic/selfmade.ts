import { createHmac } from 'crypto';
import { ethers } from 'ethers';

// secp256k1 の有限体の素数 modP（256ビット）
const modP = 2n ** 256n - 2n ** 32n - 977n;

// 秘密鍵の上限値
export const CURVE_ORDER = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
type Point = [bigint, bigint];

// secp256k1 の生成点
export const G: Point = [
  0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
];

// 有限体 F_p の値に強制的に変換
// JSの% p は、[-p+1, p-1]の値を取るが、有限体としては[0,p-1]に収まる必要があるため
function inFinateP(n: bigint, p: bigint) {
  return ((n % p) + p) % p;
}

// Uint8Array から Hex 文字列に変換
export const uint8ArrayToHex = (arrayBuffer: Uint8Array) => {
  return Array.from(arrayBuffer)
    .map((i) => {
      return i.toString(16).padStart(2, '0');
    })
    .join('');
};

export function bigintToInt(bn: bigint): number {
  const num = Number(bn);
  if (!Number.isSafeInteger(num)) {
    throw new Error('bigint is too large to convert safely to number');
  }
  return num;
}
// Hardened index helper
// ハード化されたインデクスはここから始まる
const HARDENED_OFFSET_ARRAY = new Uint8Array([0x80, 0x00, 0x00, 0x00]);
export const HARDENED_OFFSET = bigintToInt(
  bufferToBigInt(uint8ArrayToBuffer(HARDENED_OFFSET_ARRAY)),
);

export function uint8ArrayToBuffer(arr: Uint8Array): Buffer {
  return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
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
  a = inFinateP(a, p);
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
    (lambda = 3n * x1 * x1 * inverseOfModP(2n * y1, modP)), modP;
  } else {
    // 一般加算
    (lambda = (y2 - y1) * inverseOfModP(x2 - x1, modP)), modP;
  }

  const x3 = inFinateP(lambda * lambda - x1 - x2, modP);
  const y3 = inFinateP(lambda * (x1 - x3) - y1, modP);

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

export function hexToBuffer(hex: string): Buffer {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }
  return Buffer.from(hex, 'hex');
}
export function bufferToHex(buffer: Buffer, prefix = false): string {
  let suffixStr = '';
  if (prefix) {
    suffixStr = '0x';
  }
  return suffixStr + buffer.toString('hex');
}

function bufferToBigInt(buffer: Buffer): bigint {
  return BigInt('0x' + buffer.toString('hex'));
}

export function intToBuffer(n: number, byteLength: number): Buffer {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('Only non-negative integers are supported');
  }

  const buf = Buffer.alloc(byteLength);
  buf.writeUIntBE(n, byteLength - 4, 4); // 最大4バイト（32bit）対応
  return buf;
}

function bigintToBuffer(n: bigint, byteSize: number): Buffer {
  if (n < 0n) {
    throw new Error('Only non-negative integers are supported');
  }

  const hex = n.toString(16).padStart(byteSize * 2, '0');
  if (hex.length > byteSize * 2) {
    throw new Error(`Value too large to fit in ${byteSize} bytes`);
  }

  return Buffer.from(hex, 'hex');
}

export function createMasterKeyBip32(seed: Buffer) {
  const I = createHmac('sha512', 'Bitcoin seed').update(seed).digest();
  return {
    key: I.subarray(0, 32),
    chainCode: I.subarray(32),
  };
}

export function bigintToHex(n: bigint, byteLength?: number, prefix = false): string {
  if (n < 0n) throw new Error('Only non-negative integers are supported');

  const hex = n.toString(16);
  let padStartSize: number;
  if (byteLength) {
    padStartSize = byteLength * 2;
  } else if (hex.length % 2 === 1) {
    padStartSize = hex.length + 1;
  } else {
    padStartSize = hex.length;
  }

  const paddedHex = hex.padStart(padStartSize, '0');
  const prefixStr = prefix ? '0x' : '';
  return prefixStr + paddedHex;
}

export const CKDpriv = (privKey: Buffer, chainCode: Buffer, index: number) => {
  const indexBuffer = intToBuffer(index, 4);
  let data: Buffer;
  if (HARDENED_OFFSET <= index) {
    data = Buffer.concat([Buffer.from([0x00]), privKey, indexBuffer]);
  } else {
    data = Buffer.concat([createPublicKey(privKey, true), indexBuffer]);
  }

  const I = createHmac('sha512', chainCode).update(data).digest();
  const IL = I.subarray(0, 32);
  const IR = I.subarray(32);
  const childKeyBn = inFinateP(bufferToBigInt(IL) + bufferToBigInt(privKey), CURVE_ORDER);

  if (childKeyBn === 0n) throw new Error('Derived key is invalid (zero)');
  if (modP < bufferToBigInt(IL)) throw new Error('Derived key is invalid (larger than modP)');

  return {
    key: bigintToBuffer(childKeyBn, 32),
    chainCode: IR,
  };
};

// Ethereumアドレス取得（0x付き、先頭12バイト除去）
export const ethereumAddressFromPrivKey = (privKey: Buffer): string => {
  // 非圧縮形式であることに注意
  const pubKey = createPublicKey(privKey, false).subarray(1); // 65バイト中、先頭1バイトを除去
  const address = ethers.keccak256(pubKey).slice(-40); // 下位20バイト
  return '0x' + address;
};

export function createPublicKey(privateKey: Uint8Array, compressed: boolean = true) {
  const privateKeyBignum = BigInt('0x' + uint8ArrayToHex(privateKey));
  if (privateKeyBignum >= CURVE_ORDER) {
    return new Uint8Array();
  }

  const PublicKeyPoint = multiplyPointNTimes(BigInt('0x' + uint8ArrayToHex(privateKey)), G);
  const publicKey = serializePoint(PublicKeyPoint, compressed);

  return hexToUint8Array(publicKey);
}

const serializePoint = (point: Point, compressed = true) => {
  if (compressed) {
    const isYEven = point[1] % 2n === 0n;
    const dynamicPrefix = isYEven ? '02' : '03';
    return `${dynamicPrefix}${point[0].toString(16).padStart(64, '0')}`;
  } else {
    const staticPrefix = '04';
    return `${staticPrefix}${point[0].toString(16).padStart(64, '0')}${point[1].toString(16).padStart(64, '0')}`;
  }
};

/**
 * m/44'/60'/0/2/3 -> [2147483692, 2147483708, 0, 2, 3]
 * Hardened indexは 2^31 を加算して表現
 */
export function parseDerivationPath(path: string): number[] {
  if (!path.startsWith('m/')) {
    throw new Error("Path must start with 'm/'");
  }

  return path
    .slice(2) // "m/" を取り除く
    .split('/')
    .map((component) => {
      const hardened = component.endsWith("'");
      const index = parseInt(hardened ? component.slice(0, -1) : component, 10);
      if (isNaN(index) || index < 0) {
        throw new Error(`Invalid path component: ${component}`);
      }
      return hardened ? index + HARDENED_OFFSET : index;
    });
}

export const selfmadeDeriveKey = (arg: { seed: Buffer; passphrase: string; path: string }) => {
  const parsedPath = parseDerivationPath(arg.path);
  const wallet = ethers.HDNodeWallet.fromSeed(arg.seed);
  const I = createMasterKeyBip32(arg.seed);

  const result = parsedPath.reduce((prev, index) => {
    return CKDpriv(prev.key, prev.chainCode, index);
  }, I);

  return {
    key: result.key,
    chainCode: result.chainCode,
    address: ethereumAddressFromPrivKey(result.key),
  };
};
