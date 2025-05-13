import * as fc from 'fast-check';
import {
  uint8ArrayToHex,
  bigintToInt,
  uint8ArrayToBuffer,
  hexToUint8Array,
  hexToBuffer,
  bufferToHex,
  bufferToBigInt,
  intToBuffer,
  bigintToBuffer,
  bigintToHex,
  bufferToInt,
  bufferToUint8Array,
  hexToBigInt,
  intToBigInt,
} from './convert'; // パスを適宜修正

describe('Conversion functions', () => {
  describe('uint8ArrayToHex and hexToUint8Array', () => {
    it('should round-trip correctly', () => {
      fc.assert(
        fc.property(fc.uint8Array(), (arr) => {
          const hex = uint8ArrayToHex(arr);
          const restored = hexToUint8Array(hex);
          expect(Array.from(restored)).toEqual(Array.from(arr));
        }),
      );
    });
  });

  describe('bigintToInt', () => {
    it('should convert safe BigInt to number correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
          (n) => {
            const b = BigInt(n);
            expect(bigintToInt(b)).toBe(n);
          },
        ),
      );
    });
  });

  describe('uint8ArrayToBuffer', () => {
    it('should produce same contents as original Uint8Array', () => {
      fc.assert(
        fc.property(fc.uint8Array(), (arr) => {
          const buf = uint8ArrayToBuffer(arr);
          expect([...buf]).toEqual([...arr]);
        }),
      );
    });
  });

  describe('hexToBuffer and bufferToHex', () => {
    it('should round-trip correctly', () => {
      fc.assert(
        fc.property(fc.uint8Array(), (arr) => {
          const hex = uint8ArrayToHex(arr);
          const buf = hexToBuffer(hex);
          const roundHex = bufferToHex(buf);
          expect(roundHex).toBe(hex);
        }),
      );
    });
  });

  describe('bufferToBigInt and bigintToBuffer', () => {
    it('should round-trip correctly for 256-bit values', () => {
      fc.assert(
        fc.property(fc.bigInt({ min: 0n, max: 2n ** 256n - 1n }), (bn) => {
          const buf = bigintToBuffer(bn, 32);
          const back = bufferToBigInt(buf);
          expect(back).toBe(bn);
        }),
      );
    });
  });

  describe('intToBuffer', () => {
    it('should encode and decode 4-byte integers correctly', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 0xffffffff }), (n) => {
          const buf = intToBuffer(n, 4);
          const decoded = buf.readUIntBE(0, 4);
          expect(decoded).toBe(n);
        }),
      );
    });
  });

  describe('bigintToHex', () => {
    it('should return correct padded hex string for byteLength=32', () => {
      fc.assert(
        fc.property(fc.bigInt({ min: 0n, max: 2n ** 256n - 1n }), (bn) => {
          const hex = bigintToHex(bn, 32);
          expect(hex.length).toBe(64); // 32 bytes * 2
          expect(/^[0-9a-f]+$/i.test(hex)).toBe(true);
        }),
      );
    });
  });

  describe('bufferToUint8Array', () => {
    it('should preserve byte contents from Uint8Array → Buffer → Uint8Array', () => {
      fc.assert(
        fc.property(fc.uint8Array(), (arr) => {
          const buf = uint8ArrayToBuffer(arr);
          const restored = bufferToUint8Array(buf);
          expect([...restored]).toEqual([...arr]);
        }),
      );
    });
  });

  describe('hexToBigInt', () => {
    it('should parse back from bigintToHex (round-trip)', () => {
      fc.assert(
        fc.property(fc.bigInt({ min: 0n, max: 2n ** 256n - 1n }), (bn) => {
          const hex = bigintToHex(bn, undefined, true); // 0x-prefixed
          const parsed = hexToBigInt(hex);
          expect(parsed).toBe(bn);
        }),
      );
    });
  });

  describe('intToBigInt', () => {
    it('should match BigInt(n) for integers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
          (n) => {
            const result = intToBigInt(n);
            expect(result).toBe(BigInt(n));
          },
        ),
      );
    });
  });

  describe('bufferToInt', () => {
    it('should correctly decode intToBuffer results', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 0xffffffff }), (n) => {
          const buf = intToBuffer(n, 4);
          const result = bufferToInt(buf);
          expect(result).toBe(n);
        }),
      );
    });
  });
});
