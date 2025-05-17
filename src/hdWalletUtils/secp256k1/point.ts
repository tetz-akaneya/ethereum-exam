import BN from 'bn.js';
import elliptic from 'elliptic';

import { hexToUBigInt } from '../../primitive/converter.js';
import { FiniteP, Fp } from './finite.js';
import { iife } from '../../primitive/iife.js';

const EC = elliptic.ec;

/** 秘密鍵の上限値（secp256k1 の曲線次数） */
export const CURVE_ORDER =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

/** secp256k1 の有限体の素数 modP（256ビット） */
export const primeNumSecp256k1 = 2n ** 256n - 2n ** 32n - 977n;

/** 楕円曲線上の点を表す型 [x, y] */
export type Point = [bigint, bigint];

/** secp256k1 の生成点 G（base point） */
export const G: Point = [
  0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
];

/**
 * 楕円曲線上の点PとQを加算（加算/倍加とも対応）
 */
export const pointAdd = (P: Point, Q: Point): Point => {
  const [x1, y1] = P;
  const [x2, y2] = Q;
  const p = primeNumSecp256k1

  const twoFp = Fp.make({ val: 2n, p: p })
  const threeFp = Fp.make({ val: 3n, p: p })
  const x1Fp = Fp.make({ val: x1, p: p })
  const x2Fp = Fp.make({ val: x2, p: p })
  const y1Fp = Fp.make({ val: y1, p: p })
  const y2Fp = Fp.make({ val: y2, p: p })

  const lambda = iife(() => {
    if (x1 === x2 && y1 === y2) {
      // 点の倍加
      return Fp.div(Fp.mul(threeFp, Fp.mul(x1Fp, x1Fp)), Fp.mul(twoFp, y1Fp));
    } else {
      // 通常の加算
      return Fp.div(Fp.sub(y2Fp, y1Fp), Fp.sub(x2Fp, x1Fp));
    }
  });

  const x3Fp = Fp.sub(Fp.mul(lambda, lambda), Fp.add(x1Fp, x2Fp));
  const y3Fp = Fp.sub(Fp.mul(lambda, Fp.sub(x1Fp, x3Fp)), y1Fp);

  return [x3Fp.val, y3Fp.val];
}

/**
 * 楕円曲線上の点 G にスカラー k をかける（k倍演算）
 */
export const multiplyPointNTimes = (k: bigint, G: Point): Point => {
  let R: Point | null = null;
  let addend = G;

  while (k > 0n) {
    if (k & 1n) {
      R = R === null ? addend : pointAdd(R, addend);
    }
    addend = pointAdd(addend, addend);
    k >>= 1n;
  }

  return R!;
};

/*
 * bip32 path の公開鍵のシリアライズ関数
 */
export const serializePoint = (point: Point, compressed = true) => {
  if (compressed) {
    const isYEven = point[1] % 2n === 0n;
    const dynamicPrefix = isYEven ? '02' : '03';
    return `${dynamicPrefix}${point[0].toString(16).padStart(64, '0')}`;
  } else {
    const staticPrefix = '04';
    return `${staticPrefix}${point[0].toString(16).padStart(64, '0')}${point[1].toString(16).padStart(64, '0')}`;
  }
};

// test のため
export function multiplyGNTimesEc(n: bigint) {
  // secp256k1 曲線のインスタンスを作成
  const ec = new EC('secp256k1');

  // 例: 生成点 G を取得
  const G: elliptic.curve.base.BasePoint = ec.g;

  const multipliedG = G.mul(new BN(n.toString(10)));

  return [
    hexToUBigInt(multipliedG.getX().toString(16)),
    hexToUBigInt(multipliedG.getY().toString(16)),
  ];
}
