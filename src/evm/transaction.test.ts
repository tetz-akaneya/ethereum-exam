import { parseEther, parseUnits, TransactionRequest } from 'ethers'

import { EvmTransaction } from './transaction'
import { makePrivateKey } from '../hdWalletUtils/privateKey'
import { hexToUint8Array } from '../primitive/converter'

// トランザクションデータ（オンライン側から取得し、オフラインに持ち込む）
const testTxData: TransactionRequest = {
  from: '0x597bbFDAAe7De1CEC6F9a237d129B8A640a66505',
  to: '0x663DC15D3C1aC63ff12E45Ab68FeA3F0a883C251',
  value: parseEther('0.01'),
  nonce: 0,
  gasLimit: 21000,
  maxPriorityFeePerGas: parseUnits('2', 'gwei'),
  maxFeePerGas: parseUnits('50', 'gwei'),
  data: '0x',
  // 1 for mainnet
  // https://eips.ethereum.org/EIPS/eip-155
  // https://chainid.network/
  chainId: 1,
  // 型。https://eips.ethereum.org/EIPS/eip-2718
  // 2: EIP-1559
  type: 2,
}

const testPrivKey =
  makePrivateKey(hexToUint8Array('0xebce77fe4c7df7c3795e6a51b37d5d6ebf21c844d0ed4da8861b0fa7f48f0d1a'))

test('signs without error', async () => {
  const signedTx = await EvmTransaction.signTx({
    txData: testTxData,
    privKey: testPrivKey,
  })

  expect(signedTx.startsWith('0x')).toBe(true)
})

test('decodes to correct value', async () => {
  const signedTx = await EvmTransaction.signTx({
    txData: testTxData,
    privKey: testPrivKey,
  })
  const decodedTx = EvmTransaction.decodeTx(signedTx)

  expect(decodedTx).toStrictEqual({
    chainId: BigInt(testTxData.chainId!),
    data: testTxData.data,
    from: testTxData.from,
    gasLimit: BigInt(testTxData.gasLimit!),
    maxPriorityFeePerGas: BigInt(testTxData.maxPriorityFeePerGas!),
    maxFeePerGas: BigInt(testTxData.maxFeePerGas!),
    nonce: testTxData.nonce,
    to: testTxData.to,
    type: testTxData.type,
    value: BigInt(10 ** 16),
  })
})
