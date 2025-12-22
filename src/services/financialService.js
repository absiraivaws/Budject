import {
    getAllAccounts,
    updateAccount,
    addTransaction,
    getAllTransactions
} from './db.js';
import { addLedgerEntry } from './ledgerService.js';

/**
 * Financial Service
 * Handles interest calculation, credit card billing, and loan repayment tracking
 */

// ========================================
// INTEREST CALCULATION
// ========================================

/**
 * Calculate interest for an account based on its type and configuration
 */
export function calculateInterest(account, days = 1) {
    if (!account.interest_rate || account.interest_rate <= 0) {
        return 0;
    }

    const principal = account.balance || 0;
    const annualRate = account.interest_rate / 100; // Convert percentage to decimal
    let interest = 0;

    switch (account.interest_frequency) {
        case 'daily':
            interest = principal * (annualRate / 365) * days;
            break;
        case 'weekly':
            interest = principal * (annualRate / 52) * (days / 7);
            break;
        case 'monthly':
            interest = principal * (annualRate / 12) * (days / 30);
            break;
        case 'annually':
            interest = principal * annualRate * (days / 365);
            break;
        default:
            interest = principal * (annualRate / 12) * (days / 30); // Default to monthly
    }

    return Math.round(interest * 100) / 100; // Round to 2 decimal places
}

/**
 * Post interest to an account
 */
export async function postInterest(account, interestAmount, date = new Date()) {
    if (interestAmount <= 0) return null;

    const dateStr = date.toISOString().split('T')[0];

    // Create interest transaction
    const transaction = await addTransaction({
        type: 'income',
        amount: interestAmount,
        account_id: account.id,
        category_id: null, // Interest doesn't affect budget
        date: dateStr,
        notes: `Interest earned on ${account.name} (${account.interest_rate}% ${account.interest_frequency})`,
        tags: ['interest', 'automated'],
        is_interest: true
    });

    // Create ledger entries
    await addLedgerEntry({
        transaction_id: transaction.id,
        account_id: account.id,
        type: 'debit',
        amount: interestAmount,
        date: dateStr,
        description: `Interest earned`
    });

    // Update account balance
    await updateAccount(account.id, {
        balance: account.balance + interestAmount,
        last_interest_date: dateStr
    });

    return transaction;
}

/**
 * Process interest for all eligible accounts
 */
export async function processAllInterest() {
    const accounts = await getAllAccounts();
    const today = new Date();
    const results = [];

    for (const account of accounts) {
        // Skip accounts without interest configuration
        if (!account.interest_rate || account.interest_rate <= 0) continue;

        // Skip if interest was already posted today
        if (account.last_interest_date === today.toISOString().split('T')[0]) continue;

        // Calculate days since last interest posting
        const lastDate = account.last_interest_date
            ? new Date(account.last_interest_date)
            : new Date(account.created_at);
        const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

        if (daysSince > 0) {
            const interest = calculateInterest(account, daysSince);
            if (interest > 0) {
                const transaction = await postInterest(account, interest, today);
                results.push({ account, interest, transaction });
            }
        }
    }

    return results;
}

// ========================================
// CREDIT CARD BILLING
// ========================================

/**
 * Check if today is the billing day for a credit card
 */
export function isBillingDay(account, date = new Date()) {
    if (account.type !== 'card' || !account.billing_day) return false;
    return date.getDate() === account.billing_day;
}

/**
 * Check if today is the payment due day for a credit card
 */
export function isPaymentDueDay(account, date = new Date()) {
    if (account.type !== 'card' || !account.payment_due_day) return false;
    return date.getDate() === account.payment_due_day;
}

/**
 * Calculate credit card interest on outstanding balance
 */
export async function calculateCreditCardInterest(account, date = new Date()) {
    if (account.type !== 'card') return null;
    if (account.balance >= 0) return null; // No debt, no interest

    const outstandingBalance = Math.abs(account.balance);
    const interest = calculateInterest({ ...account, balance: outstandingBalance }, 30); // Monthly interest

    if (interest > 0) {
        const dateStr = date.toISOString().split('T')[0];

        // Create interest charge transaction
        const transaction = await addTransaction({
            type: 'expense',
            amount: interest,
            account_id: account.id,
            category_id: null, // Interest doesn't affect budget
            date: dateStr,
            notes: `Credit card interest charge (${account.interest_rate}% on ${outstandingBalance})`,
            tags: ['interest', 'credit-card', 'automated'],
            is_interest: true
        });

        // Create ledger entries
        await addLedgerEntry({
            transaction_id: transaction.id,
            account_id: account.id,
            type: 'credit',
            amount: interest,
            date: dateStr,
            description: `Credit card interest charge`
        });

        // Update account balance (increase debt)
        await updateAccount(account.id, {
            balance: account.balance - interest,
            last_billing_date: dateStr
        });

        return { transaction, interest };
    }

    return null;
}

/**
 * Process credit card billing for all credit cards
 */
export async function processCreditCardBilling() {
    const accounts = await getAllAccounts();
    const today = new Date();
    const results = [];

    for (const account of accounts) {
        if (account.type !== 'card') continue;

        // Check if it's billing day
        if (isBillingDay(account, today)) {
            const result = await calculateCreditCardInterest(account, today);
            if (result) {
                results.push({ account, ...result });
            }
        }
    }

    return results;
}

/**
 * Get credit card utilization percentage
 */
export function getCreditUtilization(account) {
    if (account.type !== 'card' || !account.credit_limit) return 0;
    const used = Math.abs(Math.min(account.balance, 0));
    return Math.round((used / account.credit_limit) * 100);
}

/**
 * Get available credit
 */
export function getAvailableCredit(account) {
    if (account.type !== 'card' || !account.credit_limit) return 0;
    const used = Math.abs(Math.min(account.balance, 0));
    return account.credit_limit - used;
}

// ========================================
// LOAN REPAYMENT TRACKING
// ========================================

/**
 * Record a loan repayment
 */
export async function recordLoanRepayment(loanAccount, paymentAmount, fromAccountId, date = new Date()) {
    if (loanAccount.type !== 'loan') {
        throw new Error('Account is not a loan account');
    }

    const dateStr = date.toISOString().split('T')[0];

    // Calculate interest and principal portions
    const monthlyInterestRate = (loanAccount.interest_rate || 0) / 100 / 12;
    const interestPortion = loanAccount.loan_outstanding * monthlyInterestRate;
    const principalPortion = paymentAmount - interestPortion;

    // Create repayment transaction
    const transaction = await addTransaction({
        type: 'expense',
        amount: paymentAmount,
        account_id: fromAccountId,
        category_id: null,
        date: dateStr,
        notes: `Loan repayment for ${loanAccount.name} (Principal: ${principalPortion.toFixed(2)}, Interest: ${interestPortion.toFixed(2)})`,
        tags: ['loan-repayment', loanAccount.loan_type],
        loan_id: loanAccount.id,
        principal_amount: principalPortion,
        interest_amount: interestPortion
    });

    // Create ledger entries
    await addLedgerEntry({
        transaction_id: transaction.id,
        account_id: fromAccountId,
        type: 'credit',
        amount: paymentAmount,
        date: dateStr,
        description: `Loan repayment`
    });

    // Update loan outstanding balance
    const newOutstanding = Math.max(0, loanAccount.loan_outstanding - principalPortion);
    await updateAccount(loanAccount.id, {
        loan_outstanding: newOutstanding,
        last_payment_date: dateStr
    });

    return {
        transaction,
        principalPortion,
        interestPortion,
        newOutstanding
    };
}

/**
 * Get loan repayment schedule
 */
export function getLoanSchedule(loanAccount) {
    if (loanAccount.type !== 'loan') return [];

    const principal = loanAccount.loan_principal || 0;
    const installment = loanAccount.loan_installment || 0;
    const annualRate = (loanAccount.interest_rate || 0) / 100;
    const monthlyRate = annualRate / 12;

    if (installment <= 0 || principal <= 0) return [];

    const schedule = [];
    let balance = loanAccount.loan_outstanding || principal;
    let month = 1;

    while (balance > 0 && month <= 360) { // Max 30 years
        const interestPayment = balance * monthlyRate;
        const principalPayment = Math.min(installment - interestPayment, balance);
        const totalPayment = principalPayment + interestPayment;

        balance -= principalPayment;

        schedule.push({
            month,
            payment: totalPayment,
            principal: principalPayment,
            interest: interestPayment,
            balance: Math.max(0, balance)
        });

        month++;

        if (principalPayment <= 0) break; // Prevent infinite loop
    }

    return schedule;
}

/**
 * Get loan summary
 */
export function getLoanSummary(loanAccount) {
    if (loanAccount.type !== 'loan') return null;

    const schedule = getLoanSchedule(loanAccount);
    const totalPayments = schedule.reduce((sum, item) => sum + item.payment, 0);
    const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
    const remainingPayments = schedule.length;

    return {
        principal: loanAccount.loan_principal || 0,
        outstanding: loanAccount.loan_outstanding || loanAccount.loan_principal || 0,
        installment: loanAccount.loan_installment || 0,
        interestRate: loanAccount.interest_rate || 0,
        totalPayments,
        totalInterest,
        remainingPayments,
        paidAmount: (loanAccount.loan_principal || 0) - (loanAccount.loan_outstanding || loanAccount.loan_principal || 0)
    };
}

// ========================================
// FIXED DEPOSIT
// ========================================

/**
 * Calculate FD maturity amount
 */
export function calculateFDMaturity(account) {
    if (account.type !== 'fixed_deposit') return null;

    const principal = account.fd_principal || 0;
    const rate = (account.interest_rate || 0) / 100;
    const startDate = new Date(account.fd_start_date);
    const maturityDate = new Date(account.fd_maturity_date);
    const years = (maturityDate - startDate) / (1000 * 60 * 60 * 24 * 365);

    const maturityAmount = principal * Math.pow(1 + rate, years);
    const interest = maturityAmount - principal;

    return {
        principal,
        maturityAmount: Math.round(maturityAmount * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        years: Math.round(years * 100) / 100
    };
}

/**
 * Check if FD has matured
 */
export function isFDMatured(account, date = new Date()) {
    if (account.type !== 'fixed_deposit' || !account.fd_maturity_date) return false;
    return new Date(account.fd_maturity_date) <= date;
}

/**
 * Process FD maturity
 */
export async function processFDMaturity(account, date = new Date()) {
    if (!isFDMatured(account, date)) return null;
    if (account.fd_matured) return null; // Already processed

    const maturityInfo = calculateFDMaturity(account);
    const dateStr = date.toISOString().split('T')[0];

    // Create maturity transaction
    const transaction = await addTransaction({
        type: 'income',
        amount: maturityInfo.interest,
        account_id: account.id,
        category_id: null,
        date: dateStr,
        notes: `Fixed Deposit maturity interest for ${account.name}`,
        tags: ['fd-maturity', 'interest', 'automated'],
        is_interest: true
    });

    // Create ledger entry
    await addLedgerEntry({
        transaction_id: transaction.id,
        account_id: account.id,
        type: 'debit',
        amount: maturityInfo.interest,
        date: dateStr,
        description: `FD maturity interest`
    });

    // Update account
    await updateAccount(account.id, {
        balance: maturityInfo.maturityAmount,
        fd_matured: true,
        maturity_date_actual: dateStr
    });

    return { transaction, maturityInfo };
}

// ========================================
// AUTOMATED PROCESSING
// ========================================

/**
 * Run all automated financial processes
 * Should be called daily (e.g., on app startup or via scheduled job)
 */
export async function runDailyFinancialProcesses() {
    const results = {
        interest: [],
        creditCards: [],
        fdMaturities: [],
        timestamp: new Date().toISOString()
    };

    try {
        // Process interest for savings accounts
        results.interest = await processAllInterest();

        // Process credit card billing
        results.creditCards = await processCreditCardBilling();

        // Process FD maturities
        const accounts = await getAllAccounts();
        for (const account of accounts) {
            if (account.type === 'fixed_deposit' && !account.fd_matured) {
                const result = await processFDMaturity(account);
                if (result) {
                    results.fdMaturities.push({ account, ...result });
                }
            }
        }

        return results;
    } catch (error) {
        console.error('Error running daily financial processes:', error);
        return { ...results, error: error.message };
    }
}
