import { useState, useEffect } from 'react';
import Button from '../../components/UI/Button.jsx';
import Calculator from './Calculator.jsx';
import SMSImportModal from '../../components/SMSParser/SMSImportModal.jsx';
import { TRANSACTION_TYPES } from '../../config/constants.js';
import { getAllAccounts, getAllCategories, addTransaction } from '../../services/db.js';
import { createLedgerEntries } from '../../services/ledgerService.js';
import { formatCurrency } from '../../utils/currency.js';
import { getDateString } from '../../utils/dateUtils.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import './TransactionForm.css';

export default function TransactionForm({ transaction, onSave, onCancel }) {
    const { currency } = useCurrency();
    const [showCalculator, setShowCalculator] = useState(false);
    const [showSMSImport, setShowSMSImport] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        type: transaction?.type || TRANSACTION_TYPES.EXPENSE,
        amount: transaction?.amount || '',
        date: transaction?.date || getDateString(),
        account_id: transaction?.account_id || '',
        to_account_id: transaction?.to_account_id || '',
        category_id: transaction?.category_id || '',
        notes: transaction?.notes || '',
        tags: transaction?.tags || ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // Reset fields when transaction type changes
        if (formData.type === TRANSACTION_TYPES.TRANSFER) {
            setFormData(prev => ({ ...prev, category_id: '' }));
        } else {
            setFormData(prev => ({ ...prev, to_account_id: '' }));
        }
    }, [formData.type]);

    async function loadData() {
        const [accountsData, categoriesData] = await Promise.all([
            getAllAccounts(),
            getAllCategories()
        ]);

        setAccounts(accountsData);
        setCategories(categoriesData);

        // Set default account if available
        if (!formData.account_id && accountsData.length > 0) {
            setFormData(prev => ({ ...prev, account_id: accountsData[0].id }));
        }
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleAmountFromCalculator = (value) => {
        handleChange('amount', value);
        setShowCalculator(false);
    };

    const handleSMSImport = (transactionData) => {
        // Pre-fill form with imported data
        setFormData(prev => ({
            ...prev,
            amount: transactionData.amount || prev.amount,
            type: transactionData.type || prev.type,
            date: transactionData.date || prev.date,
            account_id: transactionData.accountId || prev.account_id,
            notes: transactionData.notes || prev.notes
        }));
        setShowSMSImport(false);
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }

        if (!formData.account_id) {
            newErrors.account_id = 'Please select an account';
        }

        if (formData.type === TRANSACTION_TYPES.TRANSFER && !formData.to_account_id) {
            newErrors.to_account_id = 'Please select destination account';
        }

        if (formData.type !== TRANSACTION_TYPES.TRANSFER && !formData.category_id) {
            newErrors.category_id = 'Please select a category';
        }

        if (!formData.date) {
            newErrors.date = 'Date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // Create transaction
            const newTransaction = await addTransaction({
                ...formData,
                amount: parseFloat(formData.amount)
            });

            // Create ledger entries (double-entry bookkeeping)
            await createLedgerEntries(newTransaction);

            onSave(newTransaction);
        } catch (error) {
            console.error('Error creating transaction:', error);
            setErrors({ submit: 'Failed to create transaction. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCategories = categories.filter(cat => {
        if (formData.type === TRANSACTION_TYPES.INCOME) return cat.type === 'income';
        if (formData.type === TRANSACTION_TYPES.EXPENSE) return cat.type === 'expense';
        return false;
    });

    return (
        <form className="transaction-form" onSubmit={handleSubmit}>
            {/* Transaction Type Tabs */}
            <div className="transaction-type-tabs">
                <button
                    type="button"
                    className={`type-tab ${formData.type === TRANSACTION_TYPES.EXPENSE ? 'active expense' : ''}`}
                    onClick={() => handleChange('type', TRANSACTION_TYPES.EXPENSE)}
                >
                    📉 Expense
                </button>
                <button
                    type="button"
                    className={`type-tab ${formData.type === TRANSACTION_TYPES.INCOME ? 'active income' : ''}`}
                    onClick={() => handleChange('type', TRANSACTION_TYPES.INCOME)}
                >
                    📈 Income
                </button>
                <button
                    type="button"
                    className={`type-tab ${formData.type === TRANSACTION_TYPES.TRANSFER ? 'active transfer' : ''}`}
                    onClick={() => handleChange('type', TRANSACTION_TYPES.TRANSFER)}
                >
                    🔄 Transfer
                </button>
            </div>

            {/* SMS Import Button */}
            <div className="sms-import-banner">
                <button
                    type="button"
                    className="sms-import-btn"
                    onClick={() => setShowSMSImport(true)}
                >
                    📱 Import from SMS
                </button>
                <span className="sms-import-hint">Paste bank SMS to auto-fill</span>
            </div>

            {/* SMS Import Modal */}
            <SMSImportModal
                isOpen={showSMSImport}
                onClose={() => setShowSMSImport(false)}
                onImport={handleSMSImport}
            />

            {/* Amount Input */}
            <div className="form-group">
                <label className="form-label">Amount *</label>
                <div className="amount-input-group">
                    <input
                        type="number"
                        className="form-input amount-input"
                        value={formData.amount}
                        onChange={(e) => handleChange('amount', e.target.value)}
                        placeholder="0.00"
                    />
                    <button
                        type="button"
                        className="calculator-toggle-btn"
                        onClick={() => setShowCalculator(!showCalculator)}
                    >
                        🔢
                    </button>
                </div>
                {formData.amount && parseFloat(formData.amount) > 0 && (
                    <div className="amount-preview">
                        {formatCurrency(parseFloat(formData.amount), currency)}
                    </div>
                )}
                {errors.amount && <div className="form-error">{errors.amount}</div>}
            </div>

            {/* Calculator */}
            {showCalculator && (
                <div className="calculator-container">
                    <Calculator
                        value={formData.amount}
                        onChange={handleAmountFromCalculator}
                    />
                </div>
            )}

            {/* Date */}
            <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                />
                {errors.date && <div className="form-error">{errors.date}</div>}
            </div>

            {/* Account Selection */}
            <div className="form-group">
                <label className="form-label">
                    {formData.type === TRANSACTION_TYPES.TRANSFER ? 'From Account *' : 'Account *'}
                </label>
                <select
                    className="form-select"
                    value={formData.account_id}
                    onChange={(e) => handleChange('account_id', e.target.value)}
                >
                    <option value="">Select account</option>
                    {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                            {account.icon} {account.name} ({formatCurrency(account.balance || 0, currency)})
                        </option>
                    ))}
                </select>
                {errors.account_id && <div className="form-error">{errors.account_id}</div>}
            </div>

            {/* Transfer To Account */}
            {formData.type === TRANSACTION_TYPES.TRANSFER && (
                <div className="form-group">
                    <label className="form-label">To Account *</label>
                    <select
                        className="form-select"
                        value={formData.to_account_id}
                        onChange={(e) => handleChange('to_account_id', e.target.value)}
                    >
                        <option value="">Select destination account</option>
                        {accounts
                            .filter(acc => acc.id !== formData.account_id)
                            .map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.icon} {account.name} ({formatCurrency(account.balance || 0, currency)})
                                </option>
                            ))}
                    </select>
                    {errors.to_account_id && <div className="form-error">{errors.to_account_id}</div>}
                </div>
            )}

            {/* Category Selection */}
            {formData.type !== TRANSACTION_TYPES.TRANSFER && (
                <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                        className="form-select"
                        value={formData.category_id}
                        onChange={(e) => handleChange('category_id', e.target.value)}
                    >
                        <option value="">Select category</option>
                        {filteredCategories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.icon} {category.name}
                            </option>
                        ))}
                    </select>
                    {errors.category_id && <div className="form-error">{errors.category_id}</div>}
                </div>
            )}

            {/* Notes */}
            <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                    className="form-textarea"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Add description..."
                    rows="3"
                />
            </div>

            {/* Tags */}
            <div className="form-group">
                <label className="form-label">Tags</label>
                <input
                    type="text"
                    className="form-input"
                    value={formData.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    placeholder="e.g., groceries, monthly, urgent"
                />
                <small className="text-secondary">Separate tags with commas</small>
            </div>

            {errors.submit && <div className="form-error">{errors.submit}</div>}

            {/* Form Actions */}
            <div className="form-actions">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting
                        ? (transaction ? 'Updating...' : 'Adding...')
                        : (transaction ? 'Update Transaction' : 'Add Transaction')}
                </Button>
            </div>
        </form>
    );
}
