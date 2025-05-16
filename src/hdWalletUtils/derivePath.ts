type AllowedCoinType = 'Ethereum';
type AllowedPurpose = 'BIP44';

export const purposeDict: Record<AllowedPurpose, number> = {
  BIP44: 44,
};

export const coinTypeDict: Record<AllowedCoinType, number> = {
  Ethereum: 60,
};

export const changePathDict = {
  external: 0,
  internal: 1,
};

/*
 * BIP32 path をハード化
 */
const hardenPath = (index: string | number) => {
  return index + "'";
};

/*
 * bip44 pathを生成
 * アポストロフィ付きのpathは、[0, 2**31) の範囲
 */
export const genBip44Path = (arg: {
  purpose: number;
  coinType: number;
  account: number;
  change: number;
  index: number;
}): string => {
  return [
    'm',
    hardenPath(arg.purpose),
    hardenPath(arg.coinType),
    hardenPath(arg.account),
    arg.change,
    arg.index,
  ].join('/');
};

/**
 * m/44'/60'/0/2/3 -> [2147483692, 2147483708, 0, 2, 3]
 * Hardened indexは 2^31 を加算して表現
 */
export const parseDerivationPath = (arg: { path: string }): number[] => {
  if (!arg.path.startsWith('m/')) {
    throw new Error("Path must start with 'm/'");
  }

  return arg.path
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
};

/** BIP32 における hardened key offset 値（2^31） */
export const HARDENED_OFFSET = 2 ** 31;

export const typedKeys = <T extends object>(obj: T): (keyof T)[] => {
  return Object.keys(obj) as (keyof T)[];
};
