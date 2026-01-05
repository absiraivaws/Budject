import { openDB } from 'idb';
import { DB_NAME, DB_VERSION } from '../config/constants.js';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_ACCOUNTS } from '../config/defaultData.js';
import * as firestore from './firestoreService.js';

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

            // Friends Store (for friend fund management)
            if (!db.objectStoreNames.contains('friends')) {
                const friendsStore = db.createObjectStore('friends', { keyPath: 'id' });
                friendsStore.createIndex('name', 'name');
            }

            // Users Store (for authentication)
            if (!db.objectStoreNames.contains('users')) {
                const usersStore = db.createObjectStore('users', { keyPath: 'id' });
                usersStore.createIndex('email', 'email', { unique: true });
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
    return await firestore.getAllAccounts();
}

export async function getAccount(id) {
    return await firestore.getAccount(id);
}

export async function addAccount(account) {
    return await firestore.addAccount(account);
}

export async function updateAccount(id, updates) {
    return await firestore.updateAccount(id, updates);
}

export async function deleteAccount(id) {
    return await firestore.deleteAccount(id);
}

// ========================================
// TRANSACTION OPERATIONS (Redirected to Firestore)
// ========================================

export async function getAllTransactions() {
    try {
        return await firestore.getAllTransactions();
    } catch (error) {
        console.error('Error fetching transactions from Firestore:', error);
        // Fallback to local for safety or just throw
        const db = await getDB();
        return await db.getAll('transactions');
    }
}

export async function getTransaction(id) {
    return await firestore.getTransaction(id);
}

export async function getTransactionsByDateRange(startDate, endDate) {
    return await firestore.getTransactionsByDateRange(startDate, endDate);
}

export async function getTransactionsByAccount(accountId) {
    return await firestore.getTransactionsByAccount(accountId);
}

export async function addTransaction(transaction) {
    return await firestore.addTransaction(transaction);
}

export async function updateTransaction(id, updates) {
    return await firestore.updateTransaction(id, updates);
}

export async function deleteTransaction(id) {
    return await firestore.deleteTransaction(id);
}

// ========================================
// LEDGER OPERATIONS (Redirected to Firestore)
// ========================================

export async function getLedgerEntries(transactionId) {
    return await firestore.getLedgerEntries(transactionId);
}

export async function addLedgerEntry(entry) {
    return await firestore.addLedgerEntry(entry);
}

export async function deleteLedgerEntries(transactionId) {
    return await firestore.deleteLedgerEntries(transactionId);
}

// ========================================
// CATEGORY OPERATIONS
// ========================================

export async function getAllCategories() {
    return await firestore.getAllCategories();
}

export async function getCategoriesByType(type) {
    return await firestore.getCategoriesByType(type);
}

export async function getCategory(id) {
    return await firestore.getCategory(id);
}

export async function addCategory(category) {
    return await firestore.addCategory(category);
}

export async function updateCategory(id, updates) {
    return await firestore.updateCategory(id, updates);
}

export async function deleteCategory(id) {
    return await firestore.deleteCategory(id);
}

// ========================================
// BUDGET OPERATIONS (Redirected to Firestore)
// ========================================

export async function getAllBudgets() {
    return await firestore.getAllBudgets();
}

export async function getBudgetsByMonth(month) {
    return await firestore.getBudgetsByMonth(month);
}

export async function addBudget(budget) {
    return await firestore.addBudget(budget);
}

export async function updateBudget(id, updates) {
    return await firestore.updateBudget(id, updates);
}

export async function deleteBudget(id) {
    return await firestore.deleteBudget(id);
}

// ========================================
// RECURRING TRANSACTION OPERATIONS (Redirected to Firestore)
// ========================================

export async function getAllRecurring() {
    return await firestore.getAllRecurringTransactions();
}

export async function addRecurring(recurring) {
    return await firestore.addRecurringTransaction(recurring);
}

export async function updateRecurring(id, updates) {
    return await firestore.updateRecurringTransaction(id, updates);
}

export async function deleteRecurring(id) {
    return await firestore.deleteRecurringTransaction(id);
}

// Function aliases for consistency
export const getAllRecurringTransactions = getAllRecurring;
export const addRecurringTransaction = addRecurring;
export const updateRecurringTransaction = updateRecurring;
export const deleteRecurringTransaction = deleteRecurring;


// ========================================
// ASSET & LIABILITY OPERATIONS (Redirected to Firestore)
// ========================================

export async function getAllAssets() {
    return await firestore.getAllAssets();
}

export async function addAsset(asset) {
    return await firestore.addAsset(asset);
}

export async function getAllLiabilities() {
    return await firestore.getAllLiabilities();
}

export async function addLiability(liability) {
    return await firestore.addLiability(liability);
}

// ========================================
// FRIEND FUND OPERATIONS (Redirected to Firestore)
// ========================================

export async function getAllFriends() {
    return await firestore.getAllFriends();
}

export async function getFriend(id) {
    return await firestore.getFriend(id);
}

export async function addFriend(friend) {
    return await firestore.addFriend(friend);
}

export async function updateFriend(id, updates) {
    return await firestore.updateFriend(id, updates);
}

export async function deleteFriend(id) {
    return await firestore.deleteFriend(id);
}

// ========================================
// USER OPERATIONS (Authentication)
// ========================================

export async function getAllUsers() {
    const db = await getDB();
    return await db.getAll('users');
}

export async function getUser(id) {
    const db = await getDB();
    return await db.get('users', id);
}

export async function getUserByEmail(email) {
    const db = await getDB();
    const users = await db.getAllFromIndex('users', 'email', email);
    return users[0] || null;
}

export async function addUser(user) {
    const db = await getDB();
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser = {
        ...user,
        id,
        created_at: new Date().toISOString(),
        last_login: null
    };
    await db.add('users', newUser);
    return newUser;
}

export async function updateUser(id, updates) {
    const db = await getDB();
    const user = await db.get('users', id);
    if (!user) throw new Error('User not found');
    const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() };
    await db.put('users', updatedUser);
    return updatedUser;
}

export async function deleteUser(id) {
    const db = await getDB();
    await db.delete('users', id);
}

// ========================================
// DATA MANAGEMENT (Redirected to Firestore)
// ========================================

export async function exportAllData() {
    const data = {
        accounts: await firestore.getAllAccounts(),
        transactions: await firestore.getAllTransactions(),
        ledger: await firestore.getAllLedgerEntries(),
        categories: await firestore.getAllCategories(),
        budgets: await firestore.getAllBudgets(),
        recurring: await firestore.getAllRecurringTransactions(),
        assets: await firestore.getAllAssets(),
        liabilities: await firestore.getAllLiabilities(),
        friends: await firestore.getAllFriends(),
        exported_at: new Date().toISOString()
    };
    return data;
}

export async function importData(data) {
    // Note: Batch import for Firestore is complex. 
    // This is a simplified version.
    const stores = {
        accounts: firestore.addAccount,
        transactions: firestore.addTransaction,
        categories: firestore.addCategory,
        budgets: firestore.addBudget,
        recurring: firestore.addRecurringTransaction,
        assets: firestore.addAsset,
        liabilities: firestore.addLiability,
        friends: firestore.addFriend
    };

    for (const [storeName, addFn] of Object.entries(stores)) {
        if (data[storeName] && Array.isArray(data[storeName])) {
            for (const item of data[storeName]) {
                await addFn(item);
            }
        }
    }
}

export async function clearAllData() {
    // Clearing Firestore data is complex and usually requires a cloud function 
    // or deleting documents one by one. For now, we'll focus on the core request.
    console.warn('clearAllData for Firestore not fully implemented');
    // We can at least clear local storage/DB if any
    const db = await getDB();
    const stores = ['accounts', 'transactions', 'ledger', 'categories', 'budgets', 'recurring', 'assets', 'liabilities', 'friends'];
    for (const storeName of stores) {
        await db.clear(storeName);
    }
}
