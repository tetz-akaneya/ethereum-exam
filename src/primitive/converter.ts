// ----------------------
// Convert 関数群
// ----------------------
export const appendHexPrefix = (hex: string) => `0x${hex}`

/**
 * Uint8Array → Hex文字列（小文字, プレフィックスなし）
 */
export const uint8ArrayToHex = (
  arrayBuffer: Uint8Array,
  prefix = false,
): string => {
  const hex = Array.from(arrayBuffer)
    .map((i) => i.toString(16).padStart(2, '0'))
    .join('')
  return prefix ? appendHexPrefix(hex) : hex
}

/**
 * bigint → number（安全な範囲内のみ）
 */
export const ubigintToUInt = (bn: bigint): number => {
  const num = Number(bn)
  if (!Number.isSafeInteger(num)) {
    throw new Error('bigint is too large to convert safely to number')
  }
  return num
}

/**
 * Uint8Array → Buffer（コピーなし）
 */
export const uint8ArrayToBuffer = (arr: Uint8Array): Buffer =>
  Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength)

/**
 * Hex文字列 → Uint8Array
 */
export const hexToUint8Array = (hex: string): Uint8Array => {
  if (hex.startsWith('0x')) hex = hex.slice(2)
  if (hex.length % 2 !== 0) throw new Error('Hex string must have even length')
  if (!/^[0-9a-fA-F]*$/.test(hex)) throw new Error('Invalid hex string')

  const len = hex.length / 2
  const u8 = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    u8[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return u8
}

/**
 * 符号なし number を Uint8Array に変換（ビッグエンディアン）
 */
export const uIntToUint8Array = (n: number, byteLength = 4): Uint8Array => {
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new Error('Input must be a non-negative safe integer')
  }

  const arr = new Uint8Array(byteLength)
  let x = n
  for (let i = byteLength - 1; i >= 0; i--) {
    arr[i] = x % 256
    x = Math.floor(x / 256)
  }
  return arr
}
/**
 * 符号なし bigint を Uint8Array に変換（ビッグエンディアン）
 */
export const uBigintToUint8Array = (
  n: bigint,
  byteLength?: number,
): Uint8Array => {
  if (n < 0n) throw new Error('Cannot convert negative bigint to Uint8Array')

  const hex = n.toString(16).padStart(2, '0')
  const hexPadded = hex.length % 2 === 0 ? hex : '0' + hex
  const arr = new Uint8Array(hexPadded.length / 2)

  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hexPadded.slice(i * 2, i * 2 + 2), 16)
  }

  if (byteLength === undefined) return arr

  if (arr.length > byteLength) {
    throw new Error(`Input too large to fit in ${byteLength} bytes`)
  }

  const padded = new Uint8Array(byteLength)
  padded.set(arr, byteLength - arr.length) // 右詰め
  return padded
}

/**
 * bigint → Hex文字列（プレフィックス/ゼロ埋めあり）
 */
export const uBigIntToHex = (
  n: bigint,
  byteLength?: number,
  prefix = false,
): string => {
  if (n < 0n) throw new Error('Only non-negative integers are supported')

  const hex = n.toString(16)
  const padded = hex.padStart(
    byteLength ? byteLength * 2 : hex.length + (hex.length % 2),
    '0',
  )

  return prefix ? appendHexPrefix(padded) : padded
}

/**
 * Buffer → Uint8Array（コピーなし）
 */
export const bufferToUint8Array = (buf: Buffer): Uint8Array =>
  new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)

/**
 * Uint8Array（ビッグエンディアン）を符号なし bigint に変換
 */
export const uint8ArrayToUBigInt = (bytes: Uint8Array): bigint => {
  let result = 0n
  for (const byte of bytes) {
    result = (result << 8n) + BigInt(byte)
  }

  return result
}
/**
 * Hex文字列 → bigint（0x付き可）
 */
export const hexToUBigInt = (hex: string): bigint => {
  if (hex.startsWith('0x')) hex = hex.slice(2)
  if (!/^[0-9a-fA-F]*$/.test(hex)) throw new Error('Invalid hex string')

  return BigInt(appendHexPrefix(hex))
}

/**
 * number → bigint
 */
export const intToBigInt = (n: number): bigint => {
  return BigInt(n)
}

export const concatUint8Arrays = (arrays: Uint8Array[]): Uint8Array => {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }

  return result
}
