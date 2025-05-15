// ----------------------
// Convert 関数群
// ----------------------
export const appendHexPrefix = (hex: string) => `0x${hex}`;

/**
 * Uint8Array → Hex文字列（小文字, プレフィックスなし）
 */
export const uint8ArrayToHex = (
  arrayBuffer: Uint8Array,
  prefix = false,
): string => {
  const hex = Array.from(arrayBuffer)
    .map((i) => i.toString(16).padStart(2, '0'))
    .join('');
  return prefix ? appendHexPrefix(hex) : hex;
};

/**
 * bigint → number（安全な範囲内のみ）
 */
export const ubigintToUInt = (bn: bigint): number => {
  const num = Number(bn);
  if (!Number.isSafeInteger(num)) {
    throw new Error('bigint is too large to convert safely to number');
  }
  return num;
};

/**
 * Uint8Array → Buffer（コピーなし）
 */
export const uint8ArrayToBuffer = (arr: Uint8Array): Buffer =>
  Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);

/**
 * Hex文字列 → Uint8Array
 */
export const hexToUint8Array = (hex: string): Uint8Array => {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  if (hex.length % 2 !== 0) throw new Error('Hex string must have even length');
  if (!/^[0-9a-fA-F]*$/.test(hex)) throw new Error('Invalid hex string');

  const len = hex.length / 2;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    u8[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return u8;
};

/**
 * Hex文字列 → Buffer
 */
export const hexToBuffer = (hex: string): Buffer => {
  if (hex.length % 2 !== 0) throw new Error('Hex string must have even length');
  return Buffer.from(hex, 'hex');
};

/**
 * Buffer → Hex文字列（prefix 付き指定可）
 */
export const bufferToHex = (buffer: Buffer, prefix = false): string => {
  const hex = buffer.toString('hex');
  return prefix ? appendHexPrefix(hex) : hex;
};

/**
 * Buffer → bigint（BE解釈）
 */
export const bufferToUBigInt = (buffer: Buffer): bigint =>
  BigInt(appendHexPrefix(buffer.toString('hex')));

/**
 * number → Buffer（BE, 固定長, 最大4byte）
 */
export const uIntToBuffer = (n: number, byteLength: number): Buffer => {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('Only non-negative integers are supported');
  }
  const buf = Buffer.alloc(byteLength);
  buf.writeUIntBE(n, byteLength - 4, 4); // 右詰め
  return buf;
};

/**
 * bigint → Buffer（BE, 固定長, オーバーフロー検出あり）
 */
export const uBigintToBuffer = (n: bigint, byteSize: number): Buffer => {
  if (n < 0n) throw new Error('Only non-negative integers are supported');

  const hex = n.toString(16).padStart(byteSize * 2, '0');
  if (hex.length > byteSize * 2) {
    throw new Error(`Value too large to fit in ${byteSize} bytes`);
  }

  return Buffer.from(hex, 'hex');
};

/**
 * bigint → Hex文字列（プレフィックス/ゼロ埋めあり）
 */
export const uBigIntToHex = (
  n: bigint,
  byteLength?: number,
  prefix = false,
): string => {
  if (n < 0n) throw new Error('Only non-negative integers are supported');

  const hex = n.toString(16);
  const padded = hex.padStart(
    byteLength ? byteLength * 2 : hex.length + (hex.length % 2),
    '0',
  );

  return prefix ? appendHexPrefix(padded) : padded;
};

/**
 * Buffer → Uint8Array（コピーなし）
 */
export const bufferToUint8Array = (buf: Buffer): Uint8Array =>
  new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

/**
 * Hex文字列 → bigint（0x付き可）
 */
export const hexToUBigInt = (hex: string): bigint => {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  if (!/^[0-9a-fA-F]*$/.test(hex)) throw new Error('Invalid hex string');

  return BigInt(appendHexPrefix(hex));
};

/**
 * number → bigint
 */
export const intToBigInt = (n: number): bigint => {
  return BigInt(n);
};

/**
 * Buffer → number（最大6byte, BE）
 */
export const bufferToUInt = (buf: Buffer): number => {
  if (buf.length > 6) {
    throw new Error('Too large to safely convert to number');
  }
  return buf.readUIntBE(0, buf.length);
};

