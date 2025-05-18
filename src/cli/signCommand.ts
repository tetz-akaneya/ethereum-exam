import { Command } from 'commander'
import { Transaction, TransactionLike, TransactionRequest } from 'ethers'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { z } from 'zod'

import { EvmTransaction } from '../evm/transaction.js'
import { deriveKeyInfoFromMnemonic } from '../hdWalletUtils/mnemonic.js'
import { RequestFileJsonType, requestFileSchema } from './requestJson.js'

// ==============================
// 定数
// ==============================
const outputDir = 'output'
const defaultSecretFile = 'secret_params.json'
const defaultOutputFormat: OutputFormatType = 'stdout'
const defaultMode: ModeType = 'dryrun'

// ==============================
// 型定義
// ==============================
type CommandOptionType = {
  mode: ModeType
  dryrunSign: boolean
  outputFormat: OutputFormatType
  secretFile: string
  requestFile: string
}

type ModeType = 'sign' | 'dryrun'
type ModeStatus = ModeType | 'default' | 'invalid'

type OutputFormatType = 'file' | 'stdout'
export type OutputFormatStatus = OutputFormatType | 'default' | 'invalid'

type ParamsType = ReturnType<typeof fetchTypedParams>

type SecreteJsonType = {
  mnemonic: string
  derivePath: string
  passphrase: string
}

type DryrunResult = {
  txData: TransactionRequest
  signSuccess?: boolean
}

type TxValidationResultType = {
  result: 'success' | 'failure'
  errorMessage?: string
}

type ValidateSecretPathResult = 'not_found' | 'success' | 'perse_error'
type OutputSubDir = 'dryrun' | 'tx'

// ==============================
// ユーティリティ関数
// ==============================

// 日付を "YYYYMMDDHHmmss" 形式で整形
const formatDateYYYYMMDDHHmmss = (date: Date): string => {
  const yyyy = date.getFullYear()
  const MM = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const HH = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`
}

const optionSchema = z.object({
  mode: z.enum(['dryrun', 'sign']).default(defaultMode),
  requestFile: z.string(),
  dryrunSign: z.boolean().default(false),
  secretFile: z.string().default(defaultSecretFile),
  outputFormat: z.enum(['stdout', 'file']).default(defaultOutputFormat),
})

// 出力ファイルパスを構築
const outputFilepath = (subdir: OutputSubDir, unresolvedPath: string) => {
  return path.resolve(outputDir, subdir, unresolvedPath)
}

// JSON.stringifyでBigInt対応＆整形
const stringifyJson = (data: any) => {
  return JSON.stringify(
    data,
    (_, value) => (typeof value === 'bigint' ? value.toString() : value),
    2,
  )
}

// 出力先ディレクトリ名を取得
const getOutputSubDirname = (mode: ModeType) => {
  if (mode === 'dryrun') return 'dryrun'
  if (mode === 'sign') return 'tx'
  throw new Error('TS type error.')
}

// ディレクトリが存在しない場合は作成
export const createDirIfNotExists = (dirPath: string): void => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

// JSONファイルの読み込み＋パース
const readAndParseJsonPath = <T>(pathStr: string): T => {
  return JSON.parse(readFileSync(pathStr, 'utf8'))
}

// ==============================
// バリデーション関連
// ==============================
// シークレットファイルのパスを検証
const validateSecretPath = (pathStr: string): ValidateSecretPathResult => {
  const exists = existsSync(path.resolve(pathStr))
  if (!exists) return 'not_found'

  try {
    JSON.parse(readFileSync(path.resolve(pathStr), 'utf8'))
    return 'success'
  } catch {
    return 'perse_error'
  }
}

// シークレットファイルのバリデーションに失敗したら終了
const exitOnValidateSecretFile = (
  result: ReturnType<typeof validateSecretPath>,
) => {
  if (result === 'success') return
  console.log(
    result === 'not_found'
      ? 'Failed to read the secret file'
      : 'Failed to parse the secret file as JSON',
  )
  process.exit(1)
}

// トランザクションデータのバリデーション
const validateTransaction = (
  txData: TransactionRequest,
): TxValidationResultType => {
  try {
    Transaction.from(txData as TransactionLike<string>)
    return { result: 'success' }
  } catch (e: any) {
    return { result: 'failure', errorMessage: e.message }
  }
}

// ==============================
// パラメータ解析・作成
// ==============================

// 入力オプションに基づいて必要な情報を構築
const fetchTypedParams = (options: CommandOptionType) => {
  const now = new Date()

  return {
    now,
    mode: options.mode,
    outputFormat: options.outputFormat,
    scretfilePath: path.resolve(options.secretFile),
    requestFile: path.resolve(options.requestFile!),
    dryrunSign: options.dryrunSign,
    outputPath: outputFilepath(
      getOutputSubDirname(options.mode),
      formatDateYYYYMMDDHHmmss(now) + '.json',
    ),
  }
}

const readAndParseRequestFileData = (requestFile: string) => {
  const requestData = readAndParseJsonPath<RequestFileJsonType>(requestFile)

  return requestFileSchema.parse(requestData)
}

// JSONファイルからTransactionRequestを生成
export const createTxData = (
  requestData: z.infer<typeof requestFileSchema>,
): TransactionRequest => {
  return {
    maxFeePerGas: requestData.maxFeePerGas,
    maxPriorityFeePerGas: requestData.maxPriorityFeePerGas,
    gasLimit: requestData.gasLimit,
    to: requestData.to,
    from: requestData.from,
    value: requestData.value,
    chainId: requestData.chainId,
    nonce: requestData.nonce,
    type: requestData.type,
  }
}

// ==============================
// 出力処理
// ==============================

/*
 * 出力形式に応じた出力
 */
const onOutputFormat = (arg: {
  outputFormat: OutputFormatType
  params: ParamsType
  data: Object
}) => {
  if (arg.params.outputFormat === 'stdout') {
    console.log(arg.data)
  } else if (arg.params.outputFormat === 'file') {
    console.log(`Written to ${arg.params.outputPath}`)
    createDirIfNotExists(path.dirname(arg.params.outputPath))
    writeFileSync(arg.params.outputPath, stringifyJson(arg.data))
  }
}

/*
 * dryrun モード時の出力
 */
const onDryrunMode = (arg: {
  txData: TransactionRequest
  params: ParamsType
  txValidationResult: TxValidationResultType
  signSuccess?: boolean
}) => {
  const dryrunResult: DryrunResult = { txData: arg.txData }
  if (arg.signSuccess != null) dryrunResult.signSuccess = arg.signSuccess
  onOutputFormat({
    outputFormat: arg.params.outputFormat,
    params: arg.params,
    data: dryrunResult,
  })
}

/*
 * sign モード時の出力
 */
const onSignMode = (arg: {
  params: ParamsType
  signedTransaction: string
  txData: TransactionRequest
}) => {
  onOutputFormat({
    outputFormat: arg.params.outputFormat,
    params: arg.params,
    data: {
      signedTransaction: arg.signedTransaction,
      txData: arg.txData,
    },
  })
}

// ==============================
// コマンド実行処理
// ==============================

// メインの実行処理
const runAddressCommand = async (options: CommandOptionType) => {
  const result = optionSchema.safeParse(options)
  if (!result.success) {
    console.error(result.error.format())
    process.exit(1)
  }
  const params = fetchTypedParams(result.data)
  exitOnValidateSecretFile(validateSecretPath(params.scretfilePath))

  const secret = readAndParseJsonPath<SecreteJsonType>(params.scretfilePath)
  const requestData = readAndParseRequestFileData(params.requestFile)
  const txData = createTxData(requestData)

  const txValidationResult = validateTransaction(txData)

  if (params.mode === 'dryrun' && !params.dryrunSign) {
    return onDryrunMode({ txData, txValidationResult, params })
  }

  const key = deriveKeyInfoFromMnemonic({
    mnemonic: secret.mnemonic,
    passphrase: secret.passphrase,
    path: secret.derivePath,
  })

  const signedTransaction = await EvmTransaction.signTx({
    txData,
    privKey: key.privKey,
  })

  if (params.mode === 'dryrun') {
    return onDryrunMode({
      txData,
      txValidationResult,
      params,
      signSuccess: true,
    })
  }

  if (params.mode === 'sign') {
    return onSignMode({
      signedTransaction,
      txData,
      params,
    })
  }
}

// ==============================
// CLIコマンドの登録
// ==============================
export const createSignCommand = () => {
  const command = new Command('sign')

  command
    .description('Signs transaction.')
    .option('--mode <string>', `"dryrun" | "sign". Default is "${defaultMode}"`)
    .option(
      '--dryrun-sign',
      'Validate params by doing sign. Only works when mode is "dryrun"',
    )
    .option(
      '--output-format <string>',
      `"file" | "stdout". Default is "${defaultOutputFormat}".`,
    )
    .option(
      '--secret-file <string>',
      `Path to secret file. Default is "${defaultSecretFile}"`,
    )
    .option('--request-file <string>', 'Request file to sign.')
    .action(runAddressCommand)
  return command
}
