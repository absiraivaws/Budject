import { useState, useEffect } from 'react';
import Card from '../../components/UI/Card.jsx';
import Button from '../../components/UI/Button.jsx';
import Modal from '../../components/UI/Modal.jsx';
import {
    getAllRecurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    getAllAccounts,
    getAllCategories
} from '../../services/db.js';
import { formatCurrency } from '../../utils/currency.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { TRANSACTION_TYPES, RECURRING_FREQUENCIES } from '../../config/constants.js';
import './RecurringManager.css';

export default function RecurringManager() {
    const { currency } = useCurrency();
    const [recurringTransactions, setRecurringTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecurring, setEditingRecurring] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        type: TRANSACTION_TYPES.EXPENSE,
        amount: '',
        frequency: 'monthly',
        account_id: '',
        to_account_id: '',
        category_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: '',
        is_active: true
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [recurringData, accountsData, categoriesData] = await Promise.all([
            getAllRecurringTransactions(),
            getAllAccounts(),
            getAllCategories()
        ]);

        setRecurringTransactions(recurringData);
        setAccounts(accountsData);
        setCategories(categoriesData);
    }

    const handleAdd = () => {
        setEditingRecurring(null);
        setFormData({
            name: '',
            type: TRANSACTION_TYPES.EXPENSE,
            amount: '',
            frequency: 'monthly',
            account_id: accounts[0]?.id || '',
            to_account_id: '',
            category_id: '',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            notes: '',
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleEdit = (recurring) => {
        setEditingRecurring(recurring);
        setFormData({
            name: recurring.name,
            type: recurring.type,
            amount: recurring.amount,
            frequency: recurring.frequency,
            account_id: recurring.account_id,
            to_account_id: recurring.to_account_id || '',
            category_id: recurring.category_id || '',
            start_date: recurring.start_date,
            end_date: recurring.end_date || '',
            notes: recurring.notes || '',
            is_active: recurring.is_active
        });
        setIsModalOpen(true);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

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

        if (!formData.start_date) {
            newErrors.start_date = 'Start date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        const recurringData = {
            ...formData,
            amount: parseFloat(formData.amount)
        };

        if (editingRecurring) {
            await updateRecurringTransaction(editingRecurring.id, recurringData);
        } else {
            await addRecurringTransaction(recurringData);
        }

        await loadData();
        setIsModalOpen(false);
        setEditingRecurring(null);
    };

    const handleToggleActive = async (recurring) => {
        await updateRecurringTransaction(recurring.id, {
            ...recurring,
            is_active: !recurring.is_active
        });
        await loadData();
    };

    const handleDelete = (recurring) => {
        setDeleteConfirm(recurring);
    };

    const confirmDelete = async () => {
        if (deleteConfirm) {
            await deleteRecurringTransaction(deleteConfirm.id);
            await loadData();
            setDeleteConfirm(null);
        }
    };

    const getAccountName = (accountId) => {
        const account = accounts.find(a => a.id === accountId);
        return account ? `${account.icon} ${account.name}` : 'Unknown';
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? `${category.icon} ${category.name}` : 'Unknown';
    };

    const getFrequencyLabel = (frequency) => {
        const freq = RECURRING_FREQUENCIES.find(f => f.id === frequency);
        return freq ? freq.label : frequency;
    };

    const filteredCategories = categories.filter(cat => {
        if (formData.type === TRANSACTION_TYPES.INCOME) return cat.type === 'income';
        if (formData.type === TRANSACTION_TYPES.EXPENSE) return cat.type === 'expense';
        return false;
    });

    const activeRecurring = recurringTransactions.filter(r => r.is_active);
    const inactiveRecurring = recurringTransactions.filter(r => !r.is_active);

    return (
        <div className="recurring-page fade-in">
            <div className="recurring-header">
                <div>
                    <h1>Recurring Transactions</h1>
                    <p className="text-secondary">Automate your regular income and expenses</p>
                </div>
                <Button variant="primary" onClick={handleAdd}>
                    + Add Recurring
                </Button>
            </div>

            {/* Active Recurring Transactions */}
            <Card title={`Active Recurring (${activeRecurring.length})`}>
                {activeRecurring.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔄</div>
                        <h3>No active recurring transactions</h3>
                        <p>Create recurring transactions for regular income and expenses</p>
                    </div>
                ) : (
                    <div className="recurring-list">
                        {activeRecurring.map(recurring => (
                            <div key={recurring.id} className={`recurring-item ${recurring.type}`}>
                                <div className={`recurring-type-indicator ${recurring.type}`}></div>

                                <div className="recurring-main">
                                    <div className="recurring-info">
                                        <div className="recurring-name">{recurring.name}</div>
                                        <div className="recurring-meta">
                                            <span className="recurring-frequency">
                                                🔄 {getFrequencyLabel(recurring.frequency)}
                                            </span>
                                            <span className="recurring-separator">•</span>
                                            <span className="recurring-account">{getAccountName(recurring.account_id)}</span>
                                            {recurring.type !== TRANSACTION_TYPES.TRANSFER && (
                                                <>
                                                    <span className="recurring-separator">•</span>
                                                    <span className="recurring-category">{getCategoryName(recurring.category_id)}</span>
                                                </>
                                            )}
                                            {recurring.type === TRANSACTION_TYPES.TRANSFER && (
                                                <>
                                                    <span className="recurring-separator">→</span>
                                                    <span className="recurring-account">{getAccountName(recurring.to_account_id)}</span>
                                                </>
                                            )}
                                        </div>
                                        {recurring.notes && (
                                            <div className="recurring-notes">{recurring.notes}</div>
                                        )}
                                    </div>

                                    <div className="recurring-right">
                                        <div className={`recurring-amount ${recurring.type}`}>
                                            {recurring.type === TRANSACTION_TYPES.INCOME && '+'}
                                            {recurring.type === TRANSACTION_TYPES.EXPENSE && '-'}
                                            {formatCurrency(recurring.amount, currency)}
                                        </div>
                                        <div className="recurring-actions">
                                            <button
                                                className="recurring-action-btn"
                                                onClick={() => handleToggleActive(recurring)}
                                                title="Pause"
                                            >
                                                ⏸️
                                            </button>
                                            <button
                                                className="recurring-action-btn"
                                                onClick={() => handleEdit(recurring)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="recurring-action-btn"
                                                onClick={() => handleDelete(recurring)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Inactive Recurring Transactions */}
            {inactiveRecurring.length > 0 && (
                <Card title={`Paused Recurring (${inactiveRecurring.length})`}>
                    <div className="recurring-list">
                        {inactiveRecurring.map(recurring => (
                            <div key={recurring.id} className={`recurring-item ${recurring.type} inactive`}>
                                <div className={`recurring-type-indicator ${recurring.type}`}></div>

                                <div className="recurring-main">
                                    <div className="recurring-info">
                                        <div className="recurring-name">{recurring.name}</div>
                                        <div className="recurring-meta">
                                            <span className="recurring-frequency">
                                                🔄 {getFrequencyLabel(recurring.frequency)}
                                            </span>
                                            <span className="recurring-separator">•</span>
                                            <span className="recurring-account">{getAccountName(recurring.account_id)}</span>
                                        </div>
                                    </div>

                                    <div className="recurring-right">
                                        <div className={`recurring-amount ${recurring.type}`}>
                                            {formatCurrency(recurring.amount, currency)}
                                        </div>
                                        <div className="recurring-actions">
                                            <button
                                                className="recurring-action-btn"
                                                onClick={() => handleToggleActive(recurring)}
                                                title="Resume"
                                            >
                                                ▶️
                                            </button>
                                            <button
                                                className="recurring-action-btn"
                                                onClick={() => handleEdit(recurring)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="recurring-action-btn"
                                                onClick={() => handleDelete(recurring)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingRecurring(null);
                }}
                title={editingRecurring ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
                size="md"
            >
                <div className="recurring-form">
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

                    <div className="form-group">
                        <label className="form-label">Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="e.g., Monthly Rent, Weekly Groceries"
                        />
                        {errors.name && <div className="form-error">{errors.name}</div>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Amount *</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                value={formData.amount}
                                onChange={(e) => handleChange('amount', e.target.value)}
                                placeholder="0.00"
                            />
                            {errors.amount && <div className="form-error">{errors.amount}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Frequency *</label>
                            <select
                                className="form-select"
                                value={formData.frequency}
                                onChange={(e) => handleChange('frequency', e.target.value)}
                            >
                                {RECURRING_FREQUENCIES.map(freq => (
                                    <option key={freq.id} value={freq.id}>
                                        {freq.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

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
                                    {account.icon} {account.name}
                                </option>
                            ))}
                        </select>
                        {errors.account_id && <div className="form-error">{errors.account_id}</div>}
                    </div>

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
                                            {account.icon} {account.name}
                                        </option>
                                    ))}
                            </select>
                            {errors.to_account_id && <div className="form-error">{errors.to_account_id}</div>}
                        </div>
                    )}

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

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Start Date *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.start_date}
                                onChange={(e) => handleChange('start_date', e.target.value)}
                            />
                            {errors.start_date && <div className="form-error">{errors.start_date}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">End Date (Optional)</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.end_date}
                                onChange={(e) => handleChange('end_date', e.target.value)}
                            />
                        </div>
                    </div>

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

                    <div className="modal-footer">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingRecurring(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            {editingRecurring ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Recurring Transaction"
                size="sm"
            >
                <div className="delete-confirm">
                    <p>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?</p>
                    <p className="text-danger text-sm">This will not delete past transactions created by this recurring rule.</p>
                </div>
                <div className="modal-footer">
                    <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Delete Recurring
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
