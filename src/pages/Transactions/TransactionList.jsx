import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../../components/UI/Card.jsx';
import Button from '../../components/UI/Button.jsx';
import Modal from '../../components/UI/Modal.jsx';
import TransactionForm from './TransactionForm.jsx';
import { getAllTransactions, deleteTransaction, getAllAccounts, getAllCategories, getAllRecurringTransactions } from '../../services/db.js';
import { reverseLedgerEntries } from '../../services/ledgerService.js';
import { formatCurrency } from '../../utils/currency.js';
import { formatDate, getStartOfMonth, getEndOfMonth } from '../../utils/dateUtils.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { TRANSACTION_TYPES } from '../../config/constants.js';
import './TransactionList.css';

import { useData } from '../../context/DataContext.jsx';

export default function TransactionList() {
    const { currency } = useCurrency();
    const { transactions, accounts, categories, recurringTransactions, refreshData } = useData();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // Local state for filtering results only
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [selectedTransactions, setSelectedTransactions] = useState(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    const [filters, setFilters] = useState({
        type: 'all',
        account: 'all',
        category: 'all',
        recurring: 'all',
        recurringId: '',
        search: '',
        dateFrom: getStartOfMonth().toISOString().split('T')[0],
        dateTo: getEndOfMonth().toISOString().split('T')[0]
    });

    // We don't need loadData anymore, data comes from context
    // Just apply filters when data or filters change
    useEffect(() => {
        applyFilters();
    }, [transactions, filters]);

    // Handle URL parameters for filtering
    useEffect(() => {
        const recurringId = searchParams.get('recurringId');
        if (recurringId) {
            setFilters(prev => ({ ...prev, recurringId, recurring: 'all' }));
        }
    }, [searchParams]);


    function applyFilters() {
        try {
            // Safety check for transactions array
            if (!Array.isArray(transactions)) {
                console.warn('Transactions is not an array:', transactions);
                setFilteredTransactions([]);
                return;
            }

            let filtered = [...transactions];

            // Type filter
            if (filters.type !== 'all') {
                filtered = filtered.filter(tx => tx.type === filters.type);
            }

            // Account filter
            if (filters.account !== 'all') {
                filtered = filtered.filter(tx =>
                    tx.account_id === filters.account || tx.to_account_id === filters.account
                );
            }

            // Category filter
            if (filters.category !== 'all') {
                filtered = filtered.filter(tx => tx.category_id === filters.category);
            }

            // Recurring filter
            if (filters.recurring === 'recurring') {
                filtered = filtered.filter(tx => tx.is_auto_generated === true);
            } else if (filters.recurring === 'manual') {
                filtered = filtered.filter(tx => !tx.is_auto_generated);
            }

            // Specific recurring ID filter
            if (filters.recurringId) {
                filtered = filtered.filter(tx => tx.recurring_id === filters.recurringId);
            }

            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                filtered = filtered.filter(tx =>
                    (tx.notes && tx.notes.toLowerCase().includes(searchLower)) ||
                    (tx.tags && tx.tags.toLowerCase().includes(searchLower))
                );
            }

            // Date range filter
            if (filters.dateFrom) {
                filtered = filtered.filter(tx => tx.date >= filters.dateFrom);
            }
            if (filters.dateTo) {
                filtered = filtered.filter(tx => tx.date <= filters.dateTo);
            }

            setFilteredTransactions(filtered);
        } catch (error) {
            console.error('Error applying filters:', error);
            setFilteredTransactions([]);
        }
    }

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleAdd = () => {
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        await refreshData();
        setIsModalOpen(false);
    };

    const handleDelete = async (transaction) => {
        setDeleteConfirm(transaction);
    };

    const confirmDelete = async () => {
        if (deleteConfirm) {
            // Reverse ledger entries before deleting
            await reverseLedgerEntries(deleteConfirm);
            await deleteTransaction(deleteConfirm.id);
            await refreshData();
            setDeleteConfirm(null);
        }
    };

    const toggleSelection = (txId) => {
        const newSelection = new Set(selectedTransactions);
        if (newSelection.has(txId)) {
            newSelection.delete(txId);
        } else {
            newSelection.add(txId);
        }
        setSelectedTransactions(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedTransactions.size === filteredTransactions.length) {
            setSelectedTransactions(new Set());
        } else {
            setSelectedTransactions(new Set(filteredTransactions.map(tx => tx.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedTransactions.size === 0) return;
        setShowBulkDeleteConfirm(true);
    };

    const confirmBulkDelete = async () => {
        for (const txId of selectedTransactions) {
            const tx = transactions.find(t => t.id === txId);
            if (tx) {
                await reverseLedgerEntries(tx);
                await deleteTransaction(txId);
            }
        }
        await refreshData();
        setSelectedTransactions(new Set());
        setShowBulkDeleteConfirm(false);
    };

    const getAccountName = (accountId) => {
        const account = accounts.find(a => a.id === accountId);
        return account ? `${account.icon} ${account.name}` : 'Unknown';
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? `${category.icon} ${category.name}` : 'Unknown';
    };

    // Calculate stats
    const stats = filteredTransactions.reduce((acc, tx) => {
        if (tx.type === TRANSACTION_TYPES.INCOME) acc.income += tx.amount;
        if (tx.type === TRANSACTION_TYPES.EXPENSE) acc.expense += tx.amount;
        return acc;
    }, { income: 0, expense: 0 });

    return (
        <div className="transactions-page fade-in">
            <div className="transactions-header">
                <div>
                    <h1>Transactions</h1>
                    <p className="text-secondary">Track all your income, expenses, and transfers</p>
                </div>
                <Button variant="primary" onClick={handleAdd}>
                    + Add Transaction
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3">
                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon income-icon">📈</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Income</div>
                            <div className="stat-value text-success">{formatCurrency(stats.income, currency)}</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon expense-icon">📉</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Expense</div>
                            <div className="stat-value text-danger">{formatCurrency(stats.expense, currency)}</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <div className="stat-label">Net Flow</div>
                            <div className={`stat-value ${stats.income - stats.expense >= 0 ? 'text-success' : 'text-danger'}`}>
                                {formatCurrency(stats.income - stats.expense, currency)}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card title="Filters">
                <div className="filters-grid">
                    <div className="form-group">
                        <label className="form-label">Search</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search notes or tags..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <select
                            className="form-select"
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value={TRANSACTION_TYPES.INCOME}>Income</option>
                            <option value={TRANSACTION_TYPES.EXPENSE}>Expense</option>
                            <option value={TRANSACTION_TYPES.TRANSFER}>Transfer</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Account</label>
                        <select
                            className="form-select"
                            value={filters.account}
                            onChange={(e) => handleFilterChange('account', e.target.value)}
                        >
                            <option value="all">All Accounts</option>
                            {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.icon} {account.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                            className="form-select"
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.icon} {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Source</label>
                        <select
                            className="form-select"
                            value={filters.recurring}
                            onChange={(e) => handleFilterChange('recurring', e.target.value)}
                        >
                            <option value="all">All Transactions</option>
                            <option value="recurring">🔄 Recurring Only</option>
                            <option value="manual">✍️ Manual Only</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">From Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">To Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            {/* Transactions List */}
            <Card title={`Transactions (${filteredTransactions.length})`}>
                {filteredTransactions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">💳</div>
                        <h3>No transactions found</h3>
                        <p>Add your first transaction to start tracking your finances</p>
                    </div>
                ) : (
                    <>
                        {/* Bulk Actions */}
                        <div className="bulk-actions">
                            <label className="select-all-container">
                                <input
                                    type="checkbox"
                                    className="transaction-checkbox"
                                    checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                                    onChange={toggleSelectAll}
                                />
                                <span>Select All</span>
                            </label>
                            {selectedTransactions.size > 0 && (
                                <>
                                    <span className="selected-count">
                                        {selectedTransactions.size} selected
                                    </span>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={handleBulkDelete}
                                    >
                                        🗑️ Delete Selected
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="transactions-list">
                            {filteredTransactions.map(tx => (
                                <div key={tx.id} className={`transaction-item ${tx.type}`}>
                                    <input
                                        type="checkbox"
                                        className="transaction-checkbox"
                                        checked={selectedTransactions.has(tx.id)}
                                        onChange={() => toggleSelection(tx.id)}
                                    />
                                    <div className={`transaction-type-indicator ${tx.type}`}></div>

                                    <div className="transaction-main">
                                        <div className="transaction-info">
                                            <div className="transaction-description">
                                                {tx.notes || 'No description'}
                                                {tx.is_auto_generated && (
                                                    <span
                                                        className="recurring-badge"
                                                        title="Auto-generated from recurring transaction"
                                                    >
                                                        🔄
                                                    </span>
                                                )}
                                            </div>
                                            <div className="transaction-meta">
                                                <span className="transaction-date">{formatDate(tx.date, 'medium')}</span>
                                                <span className="transaction-separator">•</span>
                                                <span className="transaction-account">{getAccountName(tx.account_id)}</span>
                                                {tx.type !== TRANSACTION_TYPES.TRANSFER && (
                                                    <>
                                                        <span className="transaction-separator">•</span>
                                                        <span className="transaction-category">{getCategoryName(tx.category_id)}</span>
                                                    </>
                                                )}
                                                {tx.type === TRANSACTION_TYPES.TRANSFER && (
                                                    <>
                                                        <span className="transaction-separator">→</span>
                                                        <span className="transaction-account">{getAccountName(tx.to_account_id)}</span>
                                                    </>
                                                )}
                                                {tx.recurring_id && (
                                                    <>
                                                        <span className="transaction-separator">•</span>
                                                        <button
                                                            className="view-recurring-link"
                                                            onClick={() => navigate(`/recurring?highlight=${tx.recurring_id}`)}
                                                            title="View recurring rule"
                                                        >
                                                            View Rule
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            {tx.tags && (
                                                <div className="transaction-tags">
                                                    {tx.tags.split(',').map((tag, i) => (
                                                        <span key={i} className="tag">{tag.trim()}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="transaction-actions">
                                            <div className={`transaction-amount ${tx.type}`}>
                                                {tx.type === TRANSACTION_TYPES.INCOME && '+'}
                                                {tx.type === TRANSACTION_TYPES.EXPENSE && '-'}
                                                {formatCurrency(tx.amount, currency)}
                                            </div>
                                            <button
                                                className="transaction-delete-btn"
                                                onClick={() => handleDelete(tx)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Card>

            {/* Add Transaction Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add Transaction"
                size="lg"
            >
                <TransactionForm
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Transaction"
                size="sm"
            >
                <div className="delete-confirm">
                    <p>Are you sure you want to delete this transaction?</p>
                    <p className="text-danger text-sm">This will reverse the ledger entries and cannot be undone.</p>
                </div>
                <div className="modal-footer">
                    <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Delete Transaction
                    </Button>
                </div>
            </Modal>

            {/* Bulk Delete Confirmation Modal */}
            <Modal
                isOpen={showBulkDeleteConfirm}
                onClose={() => setShowBulkDeleteConfirm(false)}
                title="Delete Multiple Transactions"
                size="sm"
            >
                <div className="delete-confirm">
                    <p>Are you sure you want to delete {selectedTransactions.size} transaction{selectedTransactions.size > 1 ? 's' : ''}?</p>
                    <p className="text-danger text-sm">This will reverse all ledger entries and cannot be undone.</p>
                </div>
                <div className="modal-footer">
                    <Button variant="secondary" onClick={() => setShowBulkDeleteConfirm(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmBulkDelete}>
                        Delete {selectedTransactions.size} Transaction{selectedTransactions.size > 1 ? 's' : ''}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
