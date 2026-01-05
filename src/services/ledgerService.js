import { addLedgerEntry, deleteLedgerEntries, getLedgerEntries, updateAccount, getAccount } from './db.js';
import { TRANSACTION_TYPES } from '../config/constants.js';

/**
 * Double-Entry Ledger Service
 * 
 * Implements double-entry bookkeeping principles:
 * - Every transaction creates two ledger entries (debit and credit)
 * - Total debits always equal total credits
 * - Ensures balance accuracy and audit trail
 */

/**
 * Create ledger entries for a transaction
 * @param {Object} transaction - Transaction object
 * @returns {Promise<Array>} Created ledger entries
 */
export async function createLedgerEntries(transaction) {
    const { id, type, amount, account_id, to_account_id, category_id, date } = transaction;
    const entries = [];

    switch (type) {
        case TRANSACTION_TYPES.EXPENSE:
            // Expense: Debit Expense Category, Credit Account
            entries.push(
                await addLedgerEntry({
                    transaction_id: id,
                    account_id: category_id, // Expense category
                    debit: amount,
                    credit: 0,
                    amount: amount,
                    date: date,
                    type: 'expense'
                }),
                await addLedgerEntry({
                    transaction_id: id,
                    account_id: account_id, // Account (cash/bank)
                    debit: 0,
                    credit: amount,
                    amount: amount,
                    date: date,
                    type: 'expense'
                })
            );

            // Update account balance (decrease)
            await updateAccountBalance(account_id, -amount);
            break;

        case TRANSACTION_TYPES.INCOME:
            // Income: Debit Account, Credit Income Category
            entries.push(
                await addLedgerEntry({
                    transaction_id: id,
                    account_id: account_id, // Account (cash/bank)
                    debit: amount,
                    credit: 0,
                    amount: amount,
                    date: date,
                    type: 'income'
                }),
                await addLedgerEntry({
                    transaction_id: id,
                    account_id: category_id, // Income category
                    debit: 0,
                    credit: amount,
                    amount: amount,
                    date: date,
                    type: 'income'
                })
            );

            // Update account balance (increase)
            await updateAccountBalance(account_id, amount);
            break;

        case TRANSACTION_TYPES.TRANSFER:
            // Transfer: Debit To Account, Credit From Account
            entries.push(
                await addLedgerEntry({
                    transaction_id: id,
                    account_id: to_account_id, // To Account
                    debit: amount,
                    credit: 0,
                    amount: amount,
                    date: date,
                    type: 'transfer'
                }),
                await addLedgerEntry({
                    transaction_id: id,
                    account_id: account_id, // From Account
                    debit: 0,
                    credit: amount,
                    amount: amount,
                    date: date,
                    type: 'transfer'
                })
            );

            // Update both account balances
            await updateAccountBalance(account_id, -amount); // From account (decrease)
            await updateAccountBalance(to_account_id, amount); // To account (increase)
            break;

        default:
            throw new Error(`Unknown transaction type: ${type}`);
    }

    return entries;
}

/**
 * Reverse ledger entries for a transaction (when deleting)
 * @param {Object} transaction - Transaction object
 */
export async function reverseLedgerEntries(transaction) {
    const { id, type, amount, account_id, to_account_id } = transaction;

    // Delete ledger entries
    await deleteLedgerEntries(id);

    // Reverse account balance updates
    switch (type) {
        case TRANSACTION_TYPES.EXPENSE:
            await updateAccountBalance(account_id, amount); // Restore balance
            break;

        case TRANSACTION_TYPES.INCOME:
            await updateAccountBalance(account_id, -amount); // Reverse income
            break;

        case TRANSACTION_TYPES.TRANSFER:
            await updateAccountBalance(account_id, amount); // Restore from account
            await updateAccountBalance(to_account_id, -amount); // Reverse to account
            break;
    }
}

/**
 * Update account balance
 * @param {string} accountId - Account ID
 * @param {number} amount - Amount to add (positive) or subtract (negative)
 */
async function updateAccountBalance(accountId, amount) {
    const account = await getAccount(accountId);
    if (!account) {
        console.warn(`Account ${accountId} not found, skipping balance update`);
        return;
    }

    const newBalance = (account.balance || 0) + amount;
    await updateAccount(accountId, { balance: newBalance });
}

/**
 * Validate ledger balance (for debugging/auditing)
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<boolean>} True if balanced
 */
export async function validateLedgerBalance(transactionId) {
    const entries = await getLedgerEntries(transactionId);

    const totalDebits = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredits = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);

    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01; // Allow for floating point errors

    if (!isBalanced) {
        console.error(`Ledger imbalance for transaction ${transactionId}:`, {
            totalDebits,
            totalCredits,
            difference: totalDebits - totalCredits
        });
    }

    return isBalanced;
}

/**
 * Get account balance from ledger (for verification)
 * @param {string} accountId - Account ID
 * @returns {Promise<number>} Calculated balance
 */
export async function getAccountBalanceFromLedger(accountId) {
    const { getLedgerEntriesByAccount } = await import('./firestoreService.js');
    const entries = await getLedgerEntriesByAccount(accountId);

    const balance = entries.reduce((sum, entry) => {
        return sum + (entry.debit || 0) - (entry.credit || 0);
    }, 0);

    return balance;
}
