import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import * as fs from 'fs';
import { deriveKey } from '../generateHdKey.js';
import { signTransaction } from '../sign.js';
import { ethers, TransactionLike, TransactionRequest } from 'ethers';



const formatDateYYYYMMDDHH = (date: Date): string => {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0'); // 月は0-indexed
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  return `${yyyy}${MM}${dd}${HH}`;
};

const outputDir = 'output';
const outputFilepath = (subdir: 'dryrun' | 'tx', unresolvedPath: string) => {
  return path.resolve(outputDir, subdir, unresolvedPath)
}
type OutputFormatType = 'file' | 'stdout'
type OutputFormatStatus = OutputFormatType | 'default' | 'invalid'

const getOutputFormatStatus = (outputFormat?: OutputFormatType): OutputFormatStatus => {
  if (outputFormat === undefined) {
    return 'default'
  } else if (outputFormat === 'file') {
    return outputFormat
  } else if (outputFormat === 'stdout') {
    return outputFormat
  } else {
    return 'invalid'
  }
}

type ModeType = 'sign' | 'dryrun'
type ModeStatus = ModeType | 'default' | 'invalid'
const getModeStatus = (mode?: ModeType): ModeStatus => {
  if (mode === undefined) {
    return 'default'
  } else if (mode === 'sign') {
    return mode
  } else if (mode === 'dryrun') {
    return mode
  } else {
    return 'invalid'
  }
}

const stringifyJson = (data: any) => {
  return JSON.stringify(
    data,
    (_, value) =>
      typeof value === 'bigint' ? value.toString() + 'n' : value,
    2
  )
}

const getOutputSubDirname = (mode: ModeType) => {
  if (mode === 'dryrun') {
    return 'dryrun'
  } else if (mode === 'sign') {
    return 'tx'
  } else {
    throw new Error('TS type error.')
  }
}


const defaultSecretFile = 'secret_params.json';
const defaultOutputFormat: OutputFormatType = 'stdout'
const validateArgumentFormat = (options: CommandOptionType) => {
  const outputFormatStatus = getOutputFormatStatus(options.outputFormat)
  const modeStatus = getModeStatus(options.mode)

  return {
    options,
    outputFormatStatus,
    modeStatus,
  }
}

const exitOnValidateResult = (arg: ReturnType<typeof validateArgumentFormat>) => {
  if (arg.outputFormatStatus === 'invalid') {
    console.error(`Invalid output-format. received: ${arg.options.outputFormat}.`)
    process.exit(1)
  } else if (arg.modeStatus === 'invalid') {
    console.error(`Invalid mode. received: ${arg.options.mode}.`)
    process.exit(1)
  }
}

const defaultMode: ModeType = 'dryrun'
type ParamsType = ReturnType<typeof fetchTypedPramas>
const fetchTypedPramas = (options: Partial<CommandOptionType>) => {
  const now = new Date()
  const outputFormat: OutputFormatType = getOutputFormatStatus(options.outputFormat) === 'default' ? defaultOutputFormat : options.outputFormat!
  const mode: ModeType = getModeStatus(options.mode) === 'default' ? defaultMode : options.mode!
  const secretFileOption = options.secretFile || defaultSecretFile

  const scretfilePath = path.resolve(secretFileOption)
  const filename = formatDateYYYYMMDDHH(now);
  const outputSubDirname = getOutputSubDirname(mode)
  const outputPath = outputFilepath(outputSubDirname, filename)
  const dryrunSign = !!options.dryRunSign

  const requestFile = path.resolve(options.requestFile!)

  return {
    now,
    mode,
    outputFormat,
    scretfilePath,
    requestFile,
    dryrunSign,
    outputPath,
  }
}

const readAndParseJsonPath = <T>(pathStr: string): T => {
  return JSON.parse(
    readFileSync(pathStr, 'utf8'),
  );
}

type RequestFileJsonType = {
  maxFeePerGas: string,
  maxPriorityFeePerGas: string,
  gasLimit: string,
  from: string,
  to: string,
  value: string,
  chainId: number,
  nonce: number,
  type: number
}

const validateSecretPath = (pathStr: string) => {
  const exists = fs.existsSync(path.resolve(pathStr))
  if (!exists) {
    return 'notfound'
  }

  try {
    JSON.parse(
      readFileSync(path.resolve(pathStr), 'utf8'),
    );
  } catch (e: any) {
    return 'parseerror';
  }
}

const validateTransaction = (txData: TransactionRequest): TxValidationResultType => {
  try {
    ethers.Transaction.from(txData as TransactionLike<string>)

    return {
      result: 'success',
    }
  } catch (e: any) {
    return {
      result: 'failure',
      errorMessage: e.message,
    }
  }
}

const exitOnValidateSecretFile = (error: ReturnType<typeof validateSecretPath>) => {
  if (!error) {
    return
  }
  if (error === 'notfound') {
    console.log('Secret fileの読み取りに失敗しました')
  } else if (error === 'parseerror') {
    console.log('Secret fileのJSON parseに失敗しました')
  }

  process.exit(1)
}

type SecreteJsonType = {
  mnemonic: string
  derivePath: string
  passphrase: string
}

type CommandOptionType = {
  mode: ModeType
  dryRunSign: boolean
  outputFormat: OutputFormatType
  secretFile: string
  requestFile: string
}

type DryrunResult = {
  txData: TransactionRequest
  signSuccess?: boolean
}
type TxValidationResultType = {
  result: 'success' | 'failure'
  errorMessage?: string
}

const createTxData = (requestFile: string): TransactionRequest => {
  const requestData = readAndParseJsonPath<RequestFileJsonType>(requestFile)

  return {
    maxFeePerGas: BigInt(requestData.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(requestData.maxPriorityFeePerGas),
    gasLimit: BigInt(requestData.gasLimit),
    to: requestData.to,
    from: requestData.from,
    value: BigInt(requestData.value),
    chainId: requestData.chainId,
    nonce: requestData.nonce,
    type: requestData.type
  }
}


const onOutputFormat = (arg: {
  outputFormat: OutputFormatType,
  params: ParamsType
  data: string,
}) => {
  if (arg.params.outputFormat === 'stdout') {
    console.log(arg.data)
  } else if (arg.params.outputFormat === 'file') {
    console.log(`Written to ${arg.params.outputPath}`)
    writeFileSync(arg.params.outputPath, stringifyJson(arg.data))
  }
}

const onDryrunMode = (arg: {
  txData: TransactionRequest,
  params: ParamsType
  txValidationResult: TxValidationResultType
  signSuccess?: boolean
}) => {
  const dryrunResult: DryrunResult = { txData: arg.txData }
  if (arg.signSuccess != null) {
    dryrunResult.signSuccess = arg.signSuccess
  }

  onOutputFormat({
    outputFormat: arg.params.outputFormat,
    params: arg.params,
    data: stringifyJson(dryrunResult)
  })
}


const onSignMode = (arg: {
  params: ParamsType
  signedTransaction: string,
}) => {
  onOutputFormat({
    outputFormat: arg.params.outputFormat,
    params: arg.params,
    data: arg.signedTransaction,
  })
}

export const createAddressCommand = () => {
  const command = new Command('address');
  command
    .command('sign')
    .description('signs transaction. Defaults to dry-run.')
    .option('--mode <string>', 'dryrun | sign')
    .option('--validate-by-sign', 'Validate params by sign. Only works when dry-run')
    .option('--output-format <string>', 'file | stdout. defaults to stdout.')
    .option('--secret-file <string>', 'Path to secret file.')
    .option('--request-file <string>', 'Request file to sign.')
    .action(runAddressCommand);
  return command;
};

const runAddressCommand = async (options: CommandOptionType) => {
  exitOnValidateResult(validateArgumentFormat(options))
  const params = fetchTypedPramas(options)

  exitOnValidateSecretFile(validateSecretPath(params.scretfilePath))
  const secret = readAndParseJsonPath<SecreteJsonType>(params.scretfilePath)

  const txData = createTxData(params.requestFile)
  const txValidationResult = validateTransaction(txData)

  // 署名なしdryrunの場合はここまで
  if (params.mode === 'dryrun' && !params.dryrunSign) {
    return onDryrunMode({
      txData,
      txValidationResult,
      params,
    })
  }

  // 実際に署名まで行う
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
    onDryrunMode({
      txData,
      params,
      txValidationResult,
      signSuccess: true
    })
  } else if (params.mode === 'sign') {
    onSignMode({
      signedTransaction,
      params,
    })
  }
}
