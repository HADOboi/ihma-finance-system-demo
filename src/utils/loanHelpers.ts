/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Helper functions for Internal Loans calculation, filtering, and metric aggregation.
 */

import { HeadType, Transaction } from "../types";

export interface LoanSummaryMetrics {
  totalGiven: number;
  repaymentsReceived: number;
  outstandingGiven: number;
  totalReceived: number;
  repaymentsMade: number;
  outstandingReceived: number;
}

/**
 * Checks if a chapter matches the lender ID or name.
 * Lender is defined by chapterIdInput / chapterId / chapterNameInput / chapterName.
 */
export function isChapterLender(tx: Transaction, chapterId: string, chapterName?: string): boolean {
  const cId = (chapterId || "").trim().toLowerCase();
  const cName = (chapterName || "").trim().toLowerCase();

  const lenderId = (tx.chapterIdInput || tx.chapterId || "").trim().toLowerCase();
  const lenderName = (tx.chapterNameInput || tx.chapterName || "").trim().toLowerCase();

  if (cId && lenderId && lenderId === cId) return true;
  if (cName && lenderName && lenderName === cName) return true;

  return false;
}

/**
 * Checks if a chapter matches the borrower ID or name.
 * Borrower is defined by paidToId / paidToName / paidTo.
 */
export function isChapterBorrower(tx: Transaction, chapterId: string, chapterName?: string): boolean {
  const cId = (chapterId || "").trim().toLowerCase();
  const cName = (chapterName || "").trim().toLowerCase();

  const borrowerId = (tx.paidToId || "").trim().toLowerCase();
  const borrowerName = (tx.paidToName || tx.paidTo || "").trim().toLowerCase();

  if (cId && borrowerId && borrowerId === cId) return true;
  if (cName && borrowerName && borrowerName === cName) return true;

  return false;
}

/**
 * Checks if a chapter is involved in a loan (either as lender or borrower).
 */
export function isChapterInvolvedInLoan(tx: Transaction, chapterId: string, chapterName?: string): boolean {
  return isChapterLender(tx, chapterId, chapterName) || isChapterBorrower(tx, chapterId, chapterName);
}

/**
 * Returns true if the transaction is an original Loan disbursement (not a Repayment row).
 */
export function isOriginalLoan(tx: Transaction): boolean {
  if (tx.type !== HeadType.Loan) return false;
  const tType = (tx.transactionType || "").trim().toLowerCase();
  return tType !== "repayment";
}

/**
 * Returns true if the transaction is a Repayment row.
 */
export function isLoanRepayment(tx: Transaction): boolean {
  if (tx.type !== HeadType.Loan) return false;
  const tType = (tx.transactionType || "").trim().toLowerCase();
  return tType === "repayment";
}

/**
 * Returns all repayment records belonging to a given original loan.
 */
export function getRepaymentsForLoan(parentLoan: Transaction, allTransactions: Transaction[]): Transaction[] {
  if (!isOriginalLoan(parentLoan)) return [];

  const parentVoucher = (parentLoan.voucherNumber || "").trim().toLowerCase();
  const parentId = (parentLoan.id || "").trim().toLowerCase();

  return allTransactions.filter((tx) => {
    if (!isLoanRepayment(tx)) return false;

    const repVoucher = (tx.voucherNumber || "").trim().toLowerCase();
    const repDesc = (tx.description || tx.particulars || tx.remarks || "").toLowerCase();

    if (parentVoucher && repVoucher === parentVoucher) return true;
    if (parentId && repDesc.includes(parentId)) return true;
    if (parentVoucher && repDesc.includes(parentVoucher)) return true;

    // Check if lender and borrower match and voucher numbers match
    const sameLender = (tx.chapterIdInput || tx.chapterId) === (parentLoan.chapterIdInput || parentLoan.chapterId);
    const sameBorrower = tx.paidToId === parentLoan.paidToId;
    if (sameLender && sameBorrower && parentVoucher && repVoucher === parentVoucher) {
      return true;
    }

    return false;
  });
}

/**
 * Calculates total repayments made against an original loan.
 */
export function getTotalRepaidForLoan(parentLoan: Transaction, allTransactions: Transaction[]): number {
  if (!isOriginalLoan(parentLoan)) return 0;

  const repayments = getRepaymentsForLoan(parentLoan, allTransactions);
  const sumRepayments = repayments.reduce((sum, r) => sum + (r.amount || 0), 0);

  // Fallback to parentLoan.amountReturned for legacy single-row repayments
  return Math.max(sumRepayments, parentLoan.amountReturned || 0);
}

/**
 * Calculates remaining outstanding balance for an original loan.
 */
export function getLoanBalance(parentLoan: Transaction, allTransactions: Transaction[]): number {
  if (!isOriginalLoan(parentLoan)) return 0;

  const totalRepaid = getTotalRepaidForLoan(parentLoan, allTransactions);
  return Math.max(0, parentLoan.amount - totalRepaid);
}

/**
 * Calculates the exact 6-metric loan summary for a given chapter:
 *
 * GIVEN / LENDER:
 * - Total Loans Given
 * - Total Repayments Received
 * - Outstanding Amount Given
 *
 * RECEIVED / BORROWER:
 * - Total Loans Received
 * - Total Repayments Made
 * - Outstanding Amount Received
 */
export function calculateChapterLoanMetrics(
  chapterId: string,
  chapterName: string | undefined,
  allTransactions: Transaction[]
): LoanSummaryMetrics {
  const loanTxs = allTransactions.filter((tx) => tx.type === HeadType.Loan);
  const originalLoans = loanTxs.filter(isOriginalLoan);

  let totalGiven = 0;
  let repaymentsReceived = 0;
  let totalReceived = 0;
  let repaymentsMade = 0;

  originalLoans.forEach((loan) => {
    const isLender = isChapterLender(loan, chapterId, chapterName);
    const isBorrower = isChapterBorrower(loan, chapterId, chapterName);

    const repaid = getTotalRepaidForLoan(loan, allTransactions);

    if (isLender) {
      totalGiven += loan.amount;
      repaymentsReceived += repaid;
    }

    if (isBorrower) {
      totalReceived += loan.amount;
      repaymentsMade += repaid;
    }
  });

  const outstandingGiven = Math.max(0, totalGiven - repaymentsReceived);
  const outstandingReceived = Math.max(0, totalReceived - repaymentsMade);

  return {
    totalGiven,
    repaymentsReceived,
    outstandingGiven,
    totalReceived,
    repaymentsMade,
    outstandingReceived,
  };
}
