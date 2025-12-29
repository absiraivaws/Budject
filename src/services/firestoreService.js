/**
 * Firestore Service Layer
 * Multi-tenant database operations with user data isolation
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { db, auth } from '../config/firebase.js';

/**
 * Get current user ID
 */
function getUserId() {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }
    return user.uid;
}

/**
 * Get user's collection reference
 */
function getUserCollection(collectionName) {
    const userId = getUserId();
    return collection(db, 'users', userId, collectionName);
}

/**
 * Get user's document reference
 */
function getUserDoc(collectionName, docId) {
    const userId = getUserId();
    return doc(db, 'users', userId, collectionName, docId);
}

// ========================================
// ACCOUNT OPERATIONS
// ========================================

export async function getAllAccounts() {
    const accountsRef = getUserCollection('accounts');
    const snapshot = await getDocs(accountsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAccount(id) {
    const docRef = getUserDoc('accounts', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function addAccount(account) {
    const accountsRef = getUserCollection('accounts');
    const docRef = await addDoc(accountsRef, {
        ...account,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
    });
    return { id: docRef.id, ...account };
}

export async function updateAccount(id, updates) {
    const docRef = getUserDoc('accounts', id);
    await updateDoc(docRef, {
        ...updates,
        updated_at: Timestamp.now()
    });
    return { id, ...updates };
}

export async function deleteAccount(id) {
    const docRef = getUserDoc('accounts', id);
    await deleteDoc(docRef);
}

// ========================================
// TRANSACTION OPERATIONS
// ========================================

export async function getAllTransactions() {
    const transactionsRef = getUserCollection('transactions');
    const q = query(transactionsRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getTransaction(id) {
    const docRef = getUserDoc('transactions', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function addTransaction(transaction) {
    const transactionsRef = getUserCollection('transactions');
    const docRef = await addDoc(transactionsRef, {
        ...transaction,
        created_at: Timestamp.now()
    });
    return { id: docRef.id, ...transaction };
}

export async function updateTransaction(id, updates) {
    const docRef = getUserDoc('transactions', id);
    await updateDoc(docRef, updates);
    return { id, ...updates };
}

export async function deleteTransaction(id) {
    const docRef = getUserDoc('transactions', id);
    await deleteDoc(docRef);
}

// ========================================
// CATEGORY OPERATIONS
// ========================================

export async function getAllCategories() {
    const categoriesRef = getUserCollection('categories');
    const snapshot = await getDocs(categoriesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getCategory(id) {
    const docRef = getUserDoc('categories', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function addCategory(category) {
    const categoriesRef = getUserCollection('categories');
    const docRef = await addDoc(categoriesRef, {
        ...category,
        created_at: Timestamp.now()
    });
    return { id: docRef.id, ...category };
}

export async function updateCategory(id, updates) {
    const docRef = getUserDoc('categories', id);
    await updateDoc(docRef, updates);
    return { id, ...updates };
}

export async function deleteCategory(id) {
    const docRef = getUserDoc('categories', id);
    await deleteDoc(docRef);
}

// ========================================
// BUDGET OPERATIONS
// ========================================

export async function getAllBudgets() {
    const budgetsRef = getUserCollection('budgets');
    const snapshot = await getDocs(budgetsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getBudget(id) {
    const docRef = getUserDoc('budgets', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function addBudget(budget) {
    const budgetsRef = getUserCollection('budgets');
    const docRef = await addDoc(budgetsRef, {
        ...budget,
        created_at: Timestamp.now()
    });
    return { id: docRef.id, ...budget };
}

export async function updateBudget(id, updates) {
    const docRef = getUserDoc('budgets', id);
    await updateDoc(docRef, updates);
    return { id, ...updates };
}

export async function deleteBudget(id) {
    const docRef = getUserDoc('budgets', id);
    await deleteDoc(docRef);
}

// ========================================
// RECURRING TRANSACTION OPERATIONS
// ========================================

export async function getAllRecurringTransactions() {
    const recurringRef = getUserCollection('recurring');
    const snapshot = await getDocs(recurringRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getRecurringTransaction(id) {
    const docRef = getUserDoc('recurring', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function addRecurringTransaction(recurring) {
    const recurringRef = getUserCollection('recurring');
    const docRef = await addDoc(recurringRef, {
        ...recurring,
        created_at: Timestamp.now()
    });
    return { id: docRef.id, ...recurring };
}

export async function updateRecurringTransaction(id, updates) {
    const docRef = getUserDoc('recurring', id);
    await updateDoc(docRef, updates);
    return { id, ...updates };
}

export async function deleteRecurringTransaction(id) {
    const docRef = getUserDoc('recurring', id);
    await deleteDoc(docRef);
}

// ========================================
// ASSET OPERATIONS
// ========================================

export async function getAllAssets() {
    const assetsRef = getUserCollection('assets');
    const snapshot = await getDocs(assetsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAsset(id) {
    const docRef = getUserDoc('assets', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function addAsset(asset) {
    const assetsRef = getUserCollection('assets');
    const docRef = await addDoc(assetsRef, {
        ...asset,
        created_at: Timestamp.now()
    });
    return { id: docRef.id, ...asset };
}

export async function updateAsset(id, updates) {
    const docRef = getUserDoc('assets', id);
    await updateDoc(docRef, updates);
    return { id, ...updates };
}

export async function deleteAsset(id) {
    const docRef = getUserDoc('assets', id);
    await deleteDoc(docRef);
}

// ========================================
// LIABILITY OPERATIONS
// ========================================

export async function getAllLiabilities() {
    const liabilitiesRef = getUserCollection('liabilities');
    const snapshot = await getDocs(liabilitiesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getLiability(id) {
    const docRef = getUserDoc('liabilities', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function addLiability(liability) {
    const liabilitiesRef = getUserCollection('liabilities');
    const docRef = await addDoc(liabilitiesRef, {
        ...liability,
        created_at: Timestamp.now()
    });
    return { id: docRef.id, ...liability };
}

export async function updateLiability(id, updates) {
    const docRef = getUserDoc('liabilities', id);
    await updateDoc(docRef, updates);
    return { id, ...updates };
}

export async function deleteLiability(id) {
    const docRef = getUserDoc('liabilities', id);
    await deleteDoc(docRef);
}

// ========================================
// FRIEND OPERATIONS
// ========================================

export async function getAllFriends() {
    const friendsRef = getUserCollection('friends');
    const snapshot = await getDocs(friendsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getFriend(id) {
    const docRef = getUserDoc('friends', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function addFriend(friend) {
    const friendsRef = getUserCollection('friends');
    const docRef = await addDoc(friendsRef, {
        ...friend,
        created_at: Timestamp.now()
    });
    return { id: docRef.id, ...friend };
}

export async function updateFriend(id, updates) {
    const docRef = getUserDoc('friends', id);
    await updateDoc(docRef, updates);
    return { id, ...updates };
}

export async function deleteFriend(id) {
    const docRef = getUserDoc('friends', id);
    await deleteDoc(docRef);
}

// ========================================
// LEDGER OPERATIONS
// ========================================

export async function addLedgerEntry(entry) {
    const ledgerRef = getUserCollection('ledger');
    const docRef = await addDoc(ledgerRef, {
        ...entry,
        created_at: Timestamp.now()
    });
    return { id: docRef.id, ...entry };
}

export async function getLedgerEntries(transactionId) {
    const ledgerRef = getUserCollection('ledger');
    const q = query(ledgerRef, where('transaction_id', '==', transactionId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteLedgerEntries(transactionId) {
    const entries = await getLedgerEntries(transactionId);
    const batch = writeBatch(db);
    entries.forEach(entry => {
        const docRef = getUserDoc('ledger', entry.id);
        batch.delete(docRef);
    });
    await batch.commit();
}

// ========================================
// INITIALIZATION
// ========================================

export async function initializeDefaultData() {
    // Check if user already has data
    const accounts = await getAllAccounts();
    if (accounts.length > 0) {
        return; // User already has data
    }

    // Import default data
    const { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_ACCOUNTS } = await import('../config/defaultData.js');

    // Add default categories
    for (const category of [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]) {
        await addCategory(category);
    }

    // Add default accounts
    for (const account of DEFAULT_ACCOUNTS) {
        await addAccount(account);
    }
}
