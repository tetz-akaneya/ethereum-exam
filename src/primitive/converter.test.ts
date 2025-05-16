import * as fc from 'fast-check';

import {
  bufferToHex,
  bufferToUint8Array,
  concatUint8Arrays,
  hexToBuffer,
  hexToUBigInt,
  hexToUint8Array,
  intToBigInt,
  uBigIntToHex,
  ubigintToUInt,
  uBigintToUint8Array,
  uint8ArrayToBuffer,
  uint8ArrayToHex,
  uIntToUint8Array,
} from './converter.js'; // パスを適宜修正

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
            expect(ubigintToUInt(b)).toBe(n);
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

  describe('bigintToHex', () => {
    it('should return correct padded hex string for byteLength=32', () => {
      fc.assert(
        fc.property(fc.bigInt({ min: 0n, max: 2n ** 256n - 1n }), (bn) => {
          const hex = uBigIntToHex(bn, 32);
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
          const hex = uBigIntToHex(bn, undefined, true); // 0x-prefixed
          const parsed = hexToUBigInt(hex);
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


  describe('uIntToUint8Array', () => {
    it('should correctly convert uint to Uint8Array and back', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
          fc.constantFrom(1, 2, 3, 4, 6, 8),
          (n, byteLength) => {
            const arr = uIntToUint8Array(n, byteLength);
            expect(arr.length).toBe(byteLength);


            let decoded = 0n;
            for (let i = 0; i < byteLength; i++) {
              decoded = (decoded << 8n) | BigInt(arr[i]);
            }

            const truncated = BigInt(n) % (1n << BigInt(8 * byteLength));
            expect(decoded).toBe(truncated);

          }
        )
      );
    });

    it('should throw on negative or unsafe input', () => {
      expect(() => uIntToUint8Array(-1)).toThrow();
      expect(() => uIntToUint8Array(Number.MAX_SAFE_INTEGER + 1)).toThrow();
      expect(() => uIntToUint8Array(NaN)).toThrow();
    });
  });

  describe('uBigintToUint8Array', () => {
    it('should convert bigint to Uint8Array and back', () => {
      fc.assert(
        fc.property(
          fc.bigInt({
            min: 0n,
            max: (1n << 256n) - 1n,
          }),
          fc.constantFrom(undefined, 1, 2, 4, 8, 16, 32),
          (n, byteLength) => {
            let arr: Uint8Array;
            try {
              arr = uBigintToUint8Array(n, byteLength);
            } catch (e) {
              // byteLengthが足りずに例外が出た場合、それでOK
              if (byteLength !== undefined) {
                const max = 1n << BigInt(8 * byteLength);
                expect(n >= max).toBe(true);
                return;
              }
              throw e;
            }

            if (byteLength !== undefined) {
              expect(arr.length).toBe(byteLength);
            }

            let decoded = 0n;
            for (const byte of arr) {
              decoded = (decoded << 8n) | BigInt(byte);
            }

            expect(decoded).toBe(n);
          }
        )
      );
    });

    it('should throw on negative bigint', () => {
      expect(() => uBigintToUint8Array(-1n)).toThrow();
    });

    it('should throw if byteLength is too small', () => {
      const big = 2n ** 64n;
      expect(() => uBigintToUint8Array(big, 4)).toThrow();
    });
  });

  describe('concatUint8Arrays', () => {
    it('should concatenate arrays preserving order and contents', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uint8Array(), { minLength: 0, maxLength: 100 }),
          (arrays) => {
            const result = concatUint8Arrays(arrays);

            // 長さチェック
            const expectedLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
            expect(result.length).toBe(expectedLength);

            // 内容チェック
            let offset = 0;
            for (const arr of arrays) {
              for (let i = 0; i < arr.length; i++) {
                expect(result[offset + i]).toBe(arr[i]);
              }
              offset += arr.length;
            }
          }
        )
      );
    });
  });
});

