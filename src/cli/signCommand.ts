import { Command } from 'commander';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { deriveKey } from '../generateHdKey.js';
import { signTransaction } from '../sign.js';
import { ethers, TransactionLike, TransactionRequest } from 'ethers';

// ==============================
// 定数
// ==============================
const outputDir = 'output';
const defaultSecretFile = 'secret_params.json';
const defaultOutputFormat: OutputFormatType = 'stdout';
const defaultMode: ModeType = 'dryrun';

// ==============================
// 型定義
// ==============================
type OutputFormatType = 'file' | 'stdout';
export type OutputFormatStatus = OutputFormatType | 'default' | 'invalid';

type ModeType = 'sign' | 'dryrun';
type ModeStatus = ModeType | 'default' | 'invalid';

type ParamsType = ReturnType<typeof fetchTypedParams>;

type RequestFileJsonType = {
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

type SecreteJsonType = {
  mnemonic: string;
  derivePath: string;
  passphrase: string;
};

type CommandOptionType = {
  mode: ModeType;
  dryrunSign: boolean;
  outputFormat: OutputFormatType;
  secretFile: string;
  requestFile: string;
};

type DryrunResult = {
  txData: TransactionRequest;
  signSuccess?: boolean;
};

type TxValidationResultType = {
  result: 'success' | 'failure';
  errorMessage?: string;
};

type ValidateSecretPathResult = 'notfound' | 'success' | 'prseerror';

// ==============================
// ユーティリティ関数
// ==============================

// 日付を "YYYYMMDDHH" 形式で整形
const formatDateYYYYMMDDHH = (date: Date): string => {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  return `${yyyy}${MM}${dd}${HH}`;
};

// 出力ファイルパスを構築
const outputFilepath = (subdir: 'dryrun' | 'tx', unresolvedPath: string) => {
  return path.resolve(outputDir, subdir, unresolvedPath);
};

// JSON.stringifyでBigInt対応＆整形
const stringifyJson = (data: any) => {
  return JSON.stringify(
    data,
    (_, value) => (typeof value === 'bigint' ? value.toString() : value),
    2,
  );
};

// 出力先ディレクトリ名を取得
const getOutputSubDirname = (mode: ModeType) => {
  if (mode === 'dryrun') return 'dryrun';
  if (mode === 'sign') return 'tx';
  throw new Error('TS type error.');
};

// ディレクトリが存在しない場合は作成
export const createDirIfNotExists = (dirPath: string): void => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

// JSONファイルの読み込み＋パース
const readAndParseJsonPath = <T>(pathStr: string): T => {
  return JSON.parse(readFileSync(pathStr, 'utf8'));
};

// ==============================
// バリデーション関連
// ==============================

// --output-format を検証
export const getOutputFormatStatus = (
  outputFormat?: OutputFormatType,
): OutputFormatStatus => {
  if (outputFormat === undefined) return 'default';
  if (outputFormat === 'file' || outputFormat === 'stdout') return outputFormat;
  return 'invalid';
};

// --mode を検証
const getModeStatus = (mode?: ModeType): ModeStatus => {
  if (mode === undefined) return 'default';
  if (mode === 'sign' || mode === 'dryrun') return mode;
  return 'invalid';
};

// コマンドオプションを検証し、statusを返す
const validateArgumentFormat = (options: CommandOptionType) => {
  const outputFormatStatus = getOutputFormatStatus(options.outputFormat);
  const modeStatus = getModeStatus(options.mode);
  return { options, outputFormatStatus, modeStatus };
};

// 検証結果が invalid なら強制終了
const exitOnValidateResult = (
  arg: ReturnType<typeof validateArgumentFormat>,
) => {
  if (arg.outputFormatStatus === 'invalid') {
    console.error(
      `Invalid output-format. received: ${arg.options.outputFormat}.`,
    );
    process.exit(1);
  }
  if (arg.modeStatus === 'invalid') {
    console.error(`Invalid mode. received: ${arg.options.mode}.`);
    process.exit(1);
  }
};

// シークレットファイルのパスを検証
const validateSecretPath = (pathStr: string): ValidateSecretPathResult => {
  const exists = existsSync(path.resolve(pathStr));
  if (!exists) return 'notfound';

  try {
    JSON.parse(readFileSync(path.resolve(pathStr), 'utf8'));
    return 'success';
  } catch {
    return 'prseerror';
  }
};

// シークレットファイルのバリデーションに失敗したら終了
const exitOnValidateSecretFile = (
  result: ReturnType<typeof validateSecretPath>,
) => {
  if (result === 'success') return;
  console.log(
    result === 'notfound'
      ? 'Failed to read the secret file'
      : 'Failed to parse the secret file as JSON',
  );
  process.exit(1);
};

// トランザクションデータのバリデーション
const validateTransaction = (
  txData: TransactionRequest,
): TxValidationResultType => {
  try {
    ethers.Transaction.from(txData as TransactionLike<string>);
    return { result: 'success' };
  } catch (e: any) {
    return { result: 'failure', errorMessage: e.message };
  }
};

// ==============================
// パラメータ解析・作成
// ==============================

// 入力オプションに基づいて必要な情報を構築
const fetchTypedParams = (options: Partial<CommandOptionType>) => {
  const now = new Date();
  const outputFormat: OutputFormatType =
    getOutputFormatStatus(options.outputFormat) === 'default'
      ? defaultOutputFormat
      : options.outputFormat!;
  const mode: ModeType =
    getModeStatus(options.mode) === 'default' ? defaultMode : options.mode!;
  const secretFileOption = options.secretFile || defaultSecretFile;

  return {
    now,
    mode,
    outputFormat,
    scretfilePath: path.resolve(secretFileOption),
    requestFile: path.resolve(options.requestFile!),
    dryrunSign: !!options.dryrunSign,
    outputPath: outputFilepath(
      getOutputSubDirname(mode),
      formatDateYYYYMMDDHH(now) + '.json',
    ),
  };
};

// JSONファイルからTransactionRequestを生成
export const createTxData = (requestFile: string): TransactionRequest => {
  const requestData = readAndParseJsonPath<RequestFileJsonType>(requestFile);

  return {
    maxFeePerGas: BigInt(requestData.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(requestData.maxPriorityFeePerGas),
    gasLimit: BigInt(requestData.gasLimit),
    to: requestData.to,
    from: requestData.from,
    value: BigInt(requestData.value),
    chainId: requestData.chainId,
    nonce: requestData.nonce,
    type: requestData.type,
  };
};

// ==============================
// 出力処理
// ==============================

// 出力形式に応じた出力
const onOutputFormat = (arg: {
  outputFormat: OutputFormatType;
  params: ParamsType;
  data: Object;
}) => {
  if (arg.params.outputFormat === 'stdout') {
    console.log(arg.data);
  } else if (arg.params.outputFormat === 'file') {
    console.log(`Written to ${arg.params.outputPath}`);
    createDirIfNotExists(path.dirname(arg.params.outputPath));
    writeFileSync(arg.params.outputPath, stringifyJson(arg.data));
  }
};

// dryrun モード時の出力
const onDryrunMode = (arg: {
  txData: TransactionRequest;
  params: ParamsType;
  txValidationResult: TxValidationResultType;
  signSuccess?: boolean;
}) => {
  const dryrunResult: DryrunResult = { txData: arg.txData };
  if (arg.signSuccess != null) dryrunResult.signSuccess = arg.signSuccess;
  onOutputFormat({
    outputFormat: arg.params.outputFormat,
    params: arg.params,
    data: dryrunResult,
  });
};

// sign モード時の出力
const onSignMode = (arg: {
  params: ParamsType;
  signedTransaction: string;
  txData: TransactionRequest;
}) => {
  onOutputFormat({
    outputFormat: arg.params.outputFormat,
    params: arg.params,
    data: {
      signedTransaction: arg.signedTransaction,
      txData: arg.txData,
    },
  });
};

// ==============================
// コマンド実行処理
// ==============================

// メインの実行処理
const runAddressCommand = async (options: CommandOptionType) => {
  exitOnValidateResult(validateArgumentFormat(options));
  const params = fetchTypedParams(options);
  exitOnValidateSecretFile(validateSecretPath(params.scretfilePath));
  const secret = readAndParseJsonPath<SecreteJsonType>(params.scretfilePath);
  const txData = createTxData(params.requestFile);
  const txValidationResult = validateTransaction(txData);

  if (params.mode === 'dryrun' && !params.dryrunSign) {
    return onDryrunMode({ txData, txValidationResult, params });
  }

  const key = deriveKey({
    mnemonicString: secret.mnemonic,
    passphrase: secret.passphrase,
    path: secret.derivePath,
  });

  const signedTransaction = await signTransaction({
    txData,
    privateKey: key.privateKey,
  });

  if (params.mode === 'dryrun') {
    return onDryrunMode({
      txData,
      txValidationResult,
      params,
      signSuccess: true,
    });
  }

  if (params.mode === 'sign') {
    return onSignMode({
      signedTransaction,
      txData,
      params,
    });
  }
};

// ==============================
// CLIコマンドの登録
// ==============================
export const createSignCommand = () => {
  const command = new Command('sign');

  command
    .description('signs transaction. Defaults to dry-run.')
    .option('--mode <string>', 'dryrun | sign')
    .option('--dryrun-sign', 'Validate params by sign. Only works when dry-run')
    .option('--output-format <string>', 'file | stdout. defaults to stdout.')
    .option('--secret-file <string>', 'Path to secret file.')
    .option('--request-file <string>', 'Request file to sign.')
    .action(runAddressCommand);
  return command;
};
