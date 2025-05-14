import { TransactionRequest } from 'ethers';
import path from 'path';
import {
  createTxData,
  getOutputFormatStatus,
  OutputFormatStatus,
} from './signCommand.js';

describe('createTxData (with real file)', () => {
  it('creates transaction from actual JSON file', () => {
    const jsonPath = path.resolve(__dirname, '../../fixtures/txRequest.json');

    const tx = createTxData(jsonPath);

    expect(tx).toEqual<TransactionRequest>({
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 2000000000n,
      gasLimit: 21000n,
      to: '0xabc123abc123abc123abc123abc123abc123abcd',
      from: '0xdef456def456def456def456def456def456def0',
      value: 1000000000000000000n,
      chainId: 1,
      nonce: 5,
      type: 2,
    });
  });
});

describe('getOutputFormatStatus', () => {
  it('returns "default" when undefined is passed', () => {
    expect(getOutputFormatStatus(undefined)).toBe<OutputFormatStatus>(
      'default',
    );
  });

  it('returns "file" when "file" is passed', () => {
    expect(getOutputFormatStatus('file')).toBe<OutputFormatStatus>('file');
  });

  it('returns "stdout" when "stdout" is passed', () => {
    expect(getOutputFormatStatus('stdout')).toBe<OutputFormatStatus>('stdout');
  });

  it('returns "invalid" when an unknown string is passed', () => {
    expect(getOutputFormatStatus('' as any)).toBe<OutputFormatStatus>(
      'invalid',
    );
  });
});
