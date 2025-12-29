import {
    getAllRecurringTransactions,
    updateRecurringTransaction,
    addTransaction,
    addLedgerEntry
} from './db.js';

/**
 * Process all due recurring transactions and create actual transactions
 * @param {string} upToDate - Process recurring transactions up to this date (default: today)
 * @returns {Promise<Array>} Array of created transactions
 */
export async function processRecurringTransactions(upToDate = null) {
    const targetDate = upToDate || new Date().toISOString().split('T')[0];
    const recurring = await getAllRecurringTransactions();
    const createdTransactions = [];

    for (const rec of recurring) {
        // Skip inactive recurring transactions
        if (!rec.is_active) continue;

        // Skip if no next_date set
        if (!rec.next_date) continue;

        // Skip if next_date is in the future
        if (rec.next_date > targetDate) continue;

        // Skip if end_date has passed
        if (rec.end_date && rec.end_date < rec.next_date) {
            // Deactivate expired recurring transaction
            await updateRecurringTransaction(rec.id, {
                ...rec,
                is_active: false
            });
            continue;
        }

        try {
            // Create transaction from recurring rule
            const transaction = await createTransactionFromRecurring(rec, rec.next_date);
            createdTransactions.push(transaction);

            // Calculate next execution date
            const nextDate = calculateNextDate(rec.next_date, rec.frequency);

            // Update recurring transaction
            await updateRecurringTransaction(rec.id, {
                ...rec,
                next_date: nextDate,
                last_processed: targetDate
            });
        } catch (error) {
            console.error(`Error processing recurring transaction ${rec.id}:`, error);
        }
    }

    return createdTransactions;
}

/**
 * Process a single recurring transaction immediately
 * @param {Object} recurring - The recurring transaction to process
 * @param {string} date - The date to use for the transaction (default: today)
 * @returns {Promise<Object>} The created transaction
 */
export async function processSingleRecurring(recurring, date = null) {
    const transactionDate = date || new Date().toISOString().split('T')[0];

    // Create transaction
    const transaction = await createTransactionFromRecurring(recurring, transactionDate);

    // Calculate next execution date
    const nextDate = calculateNextDate(transactionDate, recurring.frequency);

    // Update recurring transaction
    await updateRecurringTransaction(recurring.id, {
        ...recurring,
        next_date: nextDate,
        last_processed: transactionDate
    });

    return transaction;
}

/**
 * Create an actual transaction from a recurring transaction rule
 * @param {Object} recurring - The recurring transaction template
 * @param {string} date - The date for the transaction
 * @returns {Promise<Object>} The created transaction
 */
async function createTransactionFromRecurring(recurring, date) {
    // Create the transaction
    const transaction = await addTransaction({
        type: recurring.type,
        amount: recurring.amount,
        account_id: recurring.account_id,
        to_account_id: recurring.to_account_id || null,
        category_id: recurring.category_id || null,
        date: date,
        notes: recurring.notes ? `${recurring.notes} (Auto-generated)` : `${recurring.name} (Auto-generated)`,
        tags: recurring.tags || ['auto-generated', 'recurring'],
        recurring_id: recurring.id,
        is_auto_generated: true,
        friend_id: recurring.friend_id || null
    });

    // Create ledger entries based on transaction type
    await createLedgerEntriesForTransaction(transaction);

    return transaction;
}

/**
 * Create appropriate ledger entries for a transaction
 * @param {Object} transaction - The transaction to create ledger entries for
 */
async function createLedgerEntriesForTransaction(transaction) {
    const { id, type, amount, account_id, to_account_id, date, notes } = transaction;

    if (type === 'transfer') {
        // Transfer: Debit destination, Credit source
        await addLedgerEntry({
            transaction_id: id,
            account_id: to_account_id,
            type: 'debit',
            amount: amount,
            date: date,
            description: notes || 'Transfer'
        });

        await addLedgerEntry({
            transaction_id: id,
            account_id: account_id,
            type: 'credit',
            amount: amount,
            date: date,
            description: notes || 'Transfer'
        });
    } else if (type === 'income') {
        // Income: Debit account (asset increases)
        await addLedgerEntry({
            transaction_id: id,
            account_id: account_id,
            type: 'debit',
            amount: amount,
            date: date,
            description: notes || 'Income'
        });

        // Credit: Revenue (we could track this separately, but for now just one entry)
        await addLedgerEntry({
            transaction_id: id,
            account_id: account_id,
            type: 'credit',
            amount: amount,
            date: date,
            description: notes || 'Income'
        });
    } else if (type === 'expense') {
        // Expense: Credit account (asset decreases)
        await addLedgerEntry({
            transaction_id: id,
            account_id: account_id,
            type: 'credit',
            amount: amount,
            date: date,
            description: notes || 'Expense'
        });

        // Debit: Expense (we could track this separately, but for now just one entry)
        await addLedgerEntry({
            transaction_id: id,
            account_id: account_id,
            type: 'debit',
            amount: amount,
            date: date,
            description: notes || 'Expense'
        });
    }
}

/**
 * Calculate the next execution date based on frequency
 * @param {string} currentDate - Current date in YYYY-MM-DD format
 * @param {string} frequency - Frequency type (daily, weekly, monthly, etc.)
 * @returns {string} Next date in YYYY-MM-DD format
 */
export function calculateNextDate(currentDate, frequency) {
    const date = new Date(currentDate);

    switch (frequency) {
        case 'daily':
            date.setDate(date.getDate() + 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'biweekly':
            date.setDate(date.getDate() + 14);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'quarterly':
            date.setMonth(date.getMonth() + 3);
            break;
        case 'semiannually':
            date.setMonth(date.getMonth() + 6);
            break;
        case 'yearly':
            date.setFullYear(date.getFullYear() + 1);
            break;
        default:
            // Default to monthly if unknown frequency
            date.setMonth(date.getMonth() + 1);
    }

    return date.toISOString().split('T')[0];
}

/**
 * Get all transactions created from a specific recurring rule
 * @param {string} recurringId - The recurring transaction ID
 * @returns {Promise<Array>} Array of transactions
 */
export async function getTransactionsFromRecurring(recurringId) {
    const { getAllTransactions } = await import('./db.js');
    const transactions = await getAllTransactions();
    return transactions.filter(t => t.recurring_id === recurringId);
}

/**
 * Count transactions created from a specific recurring rule
 * @param {string} recurringId - The recurring transaction ID
 * @returns {Promise<number>} Count of transactions
 */
export async function countTransactionsFromRecurring(recurringId) {
    const transactions = await getTransactionsFromRecurring(recurringId);
    return transactions.length;
}
