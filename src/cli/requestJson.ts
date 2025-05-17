import { z } from 'zod';

import { EvmAddress } from '../evm/address.js';
import { hexToUint8Array } from '../primitive/converter.js';

export type RequestFileJsonType = {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  gasLimit: string;
  from: string;
  to: string;
  value: string;
  chainId: number;
  nonce: number;
  type: number;
};

/**
 * 文字列を非負bigintに変換して返すZodスキーマ
 *
 * @param opts - オプション。例えば allowZero: false にすると 0n を不許可にできる
 */
export const createBigintStringSchema = (opts?: { allowZero?: boolean }) =>
  z.string().transform((val, ctx) => {
    try {
      const num = BigInt(val);
      const isValid = opts?.allowZero ? num >= 0n : num > 0n;

      if (!isValid) throw new Error();

      return num;
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must be a string representing a ${opts?.allowZero ? 'non-negative' : 'positive'} integer (bigint)`,
      });
      return z.NEVER;
    }
  });

const NonNegativeBigintString = createBigintStringSchema({ allowZero: true });
const createEvmAddressSchema = (message: string) =>
  z.string().refine(
    (fromAddress: string) => {
      try {
        EvmAddress.make(hexToUint8Array(fromAddress));
      } catch {
        return false;
      }
      return true;
    },
    { message: message },
  );

export const requestFileSchema = z.object({
  maxFeePerGas: NonNegativeBigintString,
  maxPriorityFeePerGas: NonNegativeBigintString,
  gasLimit: NonNegativeBigintString,
  from: createEvmAddressSchema('From Address Format is invalid.'),
  to: createEvmAddressSchema('To Address Format is invalid.'),
  value: NonNegativeBigintString,
  chainId: z.number().gte(0),
  nonce: z.number().gte(0),
  type: z.literal(2),
});
