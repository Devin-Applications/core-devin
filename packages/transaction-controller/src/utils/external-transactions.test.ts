import { rpcErrors } from '@metamask/rpc-errors';

import type { TransactionMeta } from '../types';
import { TransactionStatus } from '../types';
import { validateConfirmedExternalTransaction } from './external-transactions';

describe('validateConfirmedExternalTransaction', () => {
  const mockTransactionMeta = (status: TransactionStatus, nonce: string) => {
    const meta = {
      status,
      txParams: { nonce },
    } as TransactionMeta;
    return meta;
  };

  it('throws if transactionMeta or txParams is missing', () => {
    expect(() =>
      validateConfirmedExternalTransaction(undefined, [], []),
    ).toThrow(
      rpcErrors.invalidParams(
        '"transactionMeta" or "transactionMeta.txParams" is missing',
      ),
    );

    expect(() =>
      validateConfirmedExternalTransaction({} as TransactionMeta, [], []),
    ).toThrow(
      rpcErrors.invalidParams(
        '"transactionMeta" or "transactionMeta.txParams" is missing',
      ),
    );
  });

  it('throws if transaction status is not confirmed', () => {
    const transactionMeta = mockTransactionMeta(
      TransactionStatus.submitted,
      '123',
    );
    expect(() => validateConfirmedExternalTransaction(transactionMeta)).toThrow(
      rpcErrors.invalidParams(
        'External transaction status must be "confirmed"',
      ),
    );
  });

  it('throws if external transaction nonce is in pending txs', () => {
    const externalTxNonce = '123';
    const transactionMeta = mockTransactionMeta(
      TransactionStatus.confirmed,
      externalTxNonce,
    );
    const pendingTxs = [
      mockTransactionMeta(TransactionStatus.submitted, externalTxNonce),
    ];

    expect(() =>
      validateConfirmedExternalTransaction(transactionMeta, [], pendingTxs),
    ).toThrow(
      rpcErrors.invalidParams(
        'External transaction nonce must not be in pending txs',
      ),
    );
  });

  it('throws if external transaction nonce is in confirmed txs', () => {
    const externalTxNonce = '123';
    const transactionMeta = mockTransactionMeta(
      TransactionStatus.confirmed,
      externalTxNonce,
    );
    const confirmedTxs = [
      mockTransactionMeta(TransactionStatus.confirmed, externalTxNonce),
    ];

    expect(() =>
      validateConfirmedExternalTransaction(transactionMeta, confirmedTxs, []),
    ).toThrow(
      rpcErrors.invalidParams(
        'External transaction nonce must not be in confirmed txs',
      ),
    );
  });

  it('does not throw if all validations pass', () => {
    const externalTxNonce = '123';
    const transactionMeta = mockTransactionMeta(
      TransactionStatus.confirmed,
      externalTxNonce,
    );

    expect(() =>
      validateConfirmedExternalTransaction(transactionMeta, [], []),
    ).not.toThrow();
  });
});
