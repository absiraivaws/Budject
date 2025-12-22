import { openDB } from 'idb';
import { DB_NAME, DB_VERSION } from '../config/constants.js';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_ACCOUNTS } from '../config/defaultData.js';

let dbInstance = null;

// Initialize IndexedDB
export async function initDB() {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            // Accounts Store
            if (!db.objectStoreNames.contains('accounts')) {
                const accountStore = db.createObjectStore('accounts', { keyPath: 'id' });
                accountStore.createIndex('type', 'type');
            }

            // Transactions Store
            if (!db.objectStoreNames.contains('transactions')) {
                const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
                txStore.createIndex('type', 'type');
                txStore.createIndex('date', 'date');
                txStore.createIndex('account_id', 'account_id');
                txStore.createIndex('category_id', 'category_id');
            }

            // Ledger Store (Double-Entry)
            if (!db.objectStoreNames.contains('ledger')) {
                const ledgerStore = db.createObjectStore('ledger', { keyPath: 'id' });
                ledgerStore.createIndex('transaction_id', 'transaction_id');
                ledgerStore.createIndex('account_id', 'account_id');
                ledgerStore.createIndex('date', 'date');
            }

            // Categories Store
            if (!db.objectStoreNames.contains('categories')) {
                const catStore = db.createObjectStore('categories', { keyPath: 'id' });
                catStore.createIndex('type', 'type');
                catStore.createIndex('parent_id', 'parent_id');
            }

            // Budgets Store
            if (!db.objectStoreNames.contains('budgets')) {
                const budgetStore = db.createObjectStore('budgets', { keyPath: 'id' });
                budgetStore.createIndex('category_id', 'category_id');
                budgetStore.createIndex('month', 'month');
            }

            // Recurring Transactions Store
            if (!db.objectStoreNames.contains('recurring')) {
                const recurringStore = db.createObjectStore('recurring', { keyPath: 'id' });
                recurringStore.createIndex('frequency', 'frequency');
                recurringStore.createIndex('next_date', 'next_date');
            }

            // Assets Store
            if (!db.objectStoreNames.contains('assets')) {
                db.createObjectStore('assets', { keyPath: 'id' });
            }

            // Liabilities Store
            if (!db.objectStoreNames.contains('liabilities')) {
                db.createObjectStore('liabilities', { keyPath: 'id' });
            }
        }
    });

    // Initialize default data on first run
    await initializeDefaultData();

    return dbInstance;
}

// Initialize default categories and accounts
async function initializeDefaultData() {
    const db = await getDB();

    // Check if categories exist
    const categoriesCount = await db.count('categories');
    if (categoriesCount === 0) {
        const tx = db.transaction('categories', 'readwrite');
        for (const category of [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]) {
            await tx.store.add(category);
        }
        await tx.done;
    }

    // Check if accounts exist
    const accountsCount = await db.count('accounts');
    if (accountsCount === 0) {
        const tx = db.transaction('accounts', 'readwrite');
        for (const account of DEFAULT_ACCOUNTS) {
            await tx.store.add(account);
        }
        await tx.done;
    }
}

// Get DB instance
export async function getDB() {
    if (!dbInstance) {
        await initDB();
    }
    return dbInstance;
}

// ========================================
// ACCOUNT OPERATIONS
// ========================================

export async function getAllAccounts() {
    const db = await getDB();
    return await db.getAll('accounts');
}

export async function getAccount(id) {
    const db = await getDB();
    return await db.get('accounts', id);
}

export async function addAccount(account) {
    const db = await getDB();
    const id = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAccount = { ...account, id, created_at: new Date().toISOString() };
    await db.add('accounts', newAccount);
    return newAccount;
}

export async function updateAccount(id, updates) {
    const db = await getDB();
    const account = await db.get('accounts', id);
    if (!account) throw new Error('Account not found');
    const updatedAccount = { ...account, ...updates, updated_at: new Date().toISOString() };
    await db.put('accounts', updatedAccount);
    return updatedAccount;
}

export async function deleteAccount(id) {
    const db = await getDB();
    await db.delete('accounts', id);
}

// ========================================
// TRANSACTION OPERATIONS
// ========================================

export async function getAllTransactions() {
    const db = await getDB();
    const transactions = await db.getAll('transactions');
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getTransaction(id) {
    const db = await getDB();
    return await db.get('transactions', id);
}

export async function getTransactionsByDateRange(startDate, endDate) {
    const db = await getDB();
    const allTransactions = await db.getAll('transactions');
    return allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
    });
}

export async function getTransactionsByAccount(accountId) {
    const db = await getDB();
    return await db.getAllFromIndex('transactions', 'account_id', accountId);
}

export async function addTransaction(transaction) {
    const db = await getDB();
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTransaction = {
        ...transaction,
        id,
        created_at: new Date().toISOString()
    };
    await db.add('transactions', newTransaction);
    return newTransaction;
}

export async function updateTransaction(id, updates) {
    const db = await getDB();
    const transaction = await db.get('transactions', id);
    if (!transaction) throw new Error('Transaction not found');
    const updatedTransaction = { ...transaction, ...updates, updated_at: new Date().toISOString() };
    await db.put('transactions', updatedTransaction);
    return updatedTransaction;
}

export async function deleteTransaction(id) {
    const db = await getDB();
    await db.delete('transactions', id);
}

// ========================================
// LEDGER OPERATIONS
// ========================================

export async function getLedgerEntries(transactionId) {
    const db = await getDB();
    return await db.getAllFromIndex('ledger', 'transaction_id', transactionId);
}

export async function addLedgerEntry(entry) {
    const db = await getDB();
    const id = `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newEntry = { ...entry, id, created_at: new Date().toISOString() };
    await db.add('ledger', newEntry);
    return newEntry;
}

export async function deleteLedgerEntries(transactionId) {
    const db = await getDB();
    const entries = await db.getAllFromIndex('ledger', 'transaction_id', transactionId);
    const tx = db.transaction('ledger', 'readwrite');
    for (const entry of entries) {
        await tx.store.delete(entry.id);
    }
    await tx.done;
}

// ========================================
// CATEGORY OPERATIONS
// ========================================

export async function getAllCategories() {
    const db = await getDB();
    return await db.getAll('categories');
}

export async function getCategoriesByType(type) {
    const db = await getDB();
    return await db.getAllFromIndex('categories', 'type', type);
}

export async function getCategory(id) {
    const db = await getDB();
    return await db.get('categories', id);
}

export async function addCategory(category) {
    const db = await getDB();
    const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newCategory = { ...category, id, created_at: new Date().toISOString() };
    await db.add('categories', newCategory);
    return newCategory;
}

export async function updateCategory(id, updates) {
    const db = await getDB();
    const category = await db.get('categories', id);
    if (!category) throw new Error('Category not found');
    const updatedCategory = { ...category, ...updates, updated_at: new Date().toISOString() };
    await db.put('categories', updatedCategory);
    return updatedCategory;
}

export async function deleteCategory(id) {
    const db = await getDB();
    await db.delete('categories', id);
}

// ========================================
// BUDGET OPERATIONS
// ========================================

export async function getAllBudgets() {
    const db = await getDB();
    return await db.getAll('budgets');
}

export async function getBudgetsByMonth(month) {
    const db = await getDB();
    return await db.getAllFromIndex('budgets', 'month', month);
}

export async function addBudget(budget) {
    const db = await getDB();
    const id = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newBudget = { ...budget, id, spent: 0, created_at: new Date().toISOString() };
    await db.add('budgets', newBudget);
    return newBudget;
}

export async function updateBudget(id, updates) {
    const db = await getDB();
    const budget = await db.get('budgets', id);
    if (!budget) throw new Error('Budget not found');
    const updatedBudget = { ...budget, ...updates, updated_at: new Date().toISOString() };
    await db.put('budgets', updatedBudget);
    return updatedBudget;
}

export async function deleteBudget(id) {
    const db = await getDB();
    await db.delete('budgets', id);
}

// ========================================
// RECURRING TRANSACTION OPERATIONS
// ========================================

export async function getAllRecurring() {
    const db = await getDB();
    return await db.getAll('recurring');
}

export async function addRecurring(recurring) {
    const db = await getDB();
    const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRecurring = { ...recurring, id, created_at: new Date().toISOString() };
    await db.add('recurring', newRecurring);
    return newRecurring;
}

export async function updateRecurring(id, updates) {
    const db = await getDB();
    const recurring = await db.get('recurring', id);
    if (!recurring) throw new Error('Recurring transaction not found');
    const updatedRecurring = { ...recurring, ...updates, updated_at: new Date().toISOString() };
    await db.put('recurring', updatedRecurring);
    return updatedRecurring;
}

export async function deleteRecurring(id) {
    const db = await getDB();
    await db.delete('recurring', id);
}

// Function aliases for consistency
export const getAllRecurringTransactions = getAllRecurring;
export const addRecurringTransaction = addRecurring;
export const updateRecurringTransaction = updateRecurring;
export const deleteRecurringTransaction = deleteRecurring;


// ========================================
// ASSET & LIABILITY OPERATIONS
// ========================================

export async function getAllAssets() {
    const db = await getDB();
    return await db.getAll('assets');
}

export async function addAsset(asset) {
    const db = await getDB();
    const id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAsset = { ...asset, id, created_at: new Date().toISOString() };
    await db.add('assets', newAsset);
    return newAsset;
}

export async function getAllLiabilities() {
    const db = await getDB();
    return await db.getAll('liabilities');
}

export async function addLiability(liability) {
    const db = await getDB();
    const id = `liability_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newLiability = { ...liability, id, created_at: new Date().toISOString() };
    await db.add('liabilities', newLiability);
    return newLiability;
}

// ========================================
// DATA MANAGEMENT
// ========================================

export async function exportAllData() {
    const db = await getDB();
    const data = {
        accounts: await db.getAll('accounts'),
        transactions: await db.getAll('transactions'),
        ledger: await db.getAll('ledger'),
        categories: await db.getAll('categories'),
        budgets: await db.getAll('budgets'),
        recurring: await db.getAll('recurring'),
        assets: await db.getAll('assets'),
        liabilities: await db.getAll('liabilities'),
        exported_at: new Date().toISOString()
    };
    return data;
}

export async function importData(data) {
    const db = await getDB();

    const stores = ['accounts', 'transactions', 'ledger', 'categories', 'budgets', 'recurring', 'assets', 'liabilities'];

    for (const storeName of stores) {
        if (data[storeName] && Array.isArray(data[storeName])) {
            const tx = db.transaction(storeName, 'readwrite');
            for (const item of data[storeName]) {
                await tx.store.put(item);
            }
            await tx.done;
        }
    }
}

export async function clearAllData() {
    const db = await getDB();
    const stores = ['accounts', 'transactions', 'ledger', 'categories', 'budgets', 'recurring', 'assets', 'liabilities'];

    for (const storeName of stores) {
        await db.clear(storeName);
    }

    // Reinitialize default data
    await initializeDefaultData();
}
