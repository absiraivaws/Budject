import { useState, useEffect } from 'react';
import Card from '../../components/UI/Card.jsx';
import Button from '../../components/UI/Button.jsx';
import Modal from '../../components/UI/Modal.jsx';
import {
    getAllFriends,
    addFriend,
    updateFriend,
    deleteFriend,
    getAllTransactions,
    addTransaction,
    getAllAccounts,
    addLedgerEntry
} from '../../services/db.js';
import { formatCurrency } from '../../utils/currency.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { formatDate } from '../../utils/dateUtils.js';
import './FriendManager.css';

export default function FriendManager() {
    const { currency } = useCurrency();
    const [friends, setFriends] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [editingFriend, setEditingFriend] = useState(null);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        notes: ''
    });

    const [transactionData, setTransactionData] = useState({
        type: 'lend',
        amount: '',
        account_id: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        due_date: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [friendsData, accountsData] = await Promise.all([
            getAllFriends(),
            getAllAccounts()
        ]);

        setFriends(friendsData);
        setAccounts(accountsData);
    }

    const handleAdd = () => {
        setEditingFriend(null);
        setFormData({
            name: '',
            contact: '',
            notes: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (friend) => {
        setEditingFriend(friend);
        setFormData({
            name: friend.name,
            contact: friend.contact || '',
            notes: friend.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleTransactionChange = (field, value) => {
        setTransactionData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateTransaction = () => {
        const newErrors = {};

        if (!transactionData.amount || parseFloat(transactionData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }

        if (!transactionData.account_id) {
            newErrors.account_id = 'Please select an account';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        if (editingFriend) {
            await updateFriend(editingFriend.id, formData);
        } else {
            await addFriend(formData);
        }

        await loadData();
        setIsModalOpen(false);
        setEditingFriend(null);
    };

    const handleAddTransaction = (friend) => {
        setSelectedFriend(friend);
        setTransactionData({
            type: 'lend',
            amount: '',
            account_id: accounts[0]?.id || '',
            date: new Date().toISOString().split('T')[0],
            notes: '',
            due_date: ''
        });
        setIsTransactionModalOpen(true);
    };

    const handleSaveTransaction = async () => {
        if (!validateTransaction()) return;

        const amount = parseFloat(transactionData.amount);
        const isLending = transactionData.type === 'lend';

        // Create transaction
        const transaction = await addTransaction({
            type: isLending ? 'expense' : 'income',
            amount: amount,
            account_id: transactionData.account_id,
            date: transactionData.date,
            notes: `${isLending ? 'Lent to' : 'Borrowed from'} ${selectedFriend.name}${transactionData.notes ? ': ' + transactionData.notes : ''} `,
            tags: [`friend:${selectedFriend.id} `, isLending ? 'lending' : 'borrowing'],
            friend_id: selectedFriend.id,
            due_date: transactionData.due_date || null
        });

        // Create ledger entries
        if (isLending) {
            // Debit: Friend (asset increases)
            await addLedgerEntry({
                transaction_id: transaction.id,
                account_id: transactionData.account_id,
                type: 'debit',
                amount: amount,
                date: transactionData.date,
                description: `Lent to ${selectedFriend.name} `
            });

            // Credit: Cash/Bank (asset decreases)
            await addLedgerEntry({
                transaction_id: transaction.id,
                account_id: transactionData.account_id,
                type: 'credit',
                amount: amount,
                date: transactionData.date,
                description: `Lent to ${selectedFriend.name} `
            });
        } else {
            // Debit: Cash/Bank (asset increases)
            await addLedgerEntry({
                transaction_id: transaction.id,
                account_id: transactionData.account_id,
                type: 'debit',
                amount: amount,
                date: transactionData.date,
                description: `Borrowed from ${selectedFriend.name} `
            });

            // Credit: Friend (liability increases)
            await addLedgerEntry({
                transaction_id: transaction.id,
                account_id: transactionData.account_id,
                type: 'credit',
                amount: amount,
                date: transactionData.date,
                description: `Borrowed from ${selectedFriend.name} `
            });
        }

        // Update friend totals
        const updatedFriend = {
            ...selectedFriend,
            total_lent: isLending ? selectedFriend.total_lent + amount : selectedFriend.total_lent,
            total_borrowed: !isLending ? selectedFriend.total_borrowed + amount : selectedFriend.total_borrowed,
            balance: isLending
                ? selectedFriend.balance + amount
                : selectedFriend.balance - amount
        };

        await updateFriend(selectedFriend.id, updatedFriend);

        await loadData();
        setIsTransactionModalOpen(false);
        setSelectedFriend(null);
    };

    const handleDelete = (friend) => {
        setDeleteConfirm(friend);
    };

    const confirmDelete = async () => {
        if (deleteConfirm) {
            await deleteFriend(deleteConfirm.id);
            await loadData();
            setDeleteConfirm(null);
        }
    };

    const getAccountName = (accountId) => {
        const account = accounts.find(a => a.id === accountId);
        return account ? `${account.icon} ${account.name} ` : 'Unknown';
    };

    const totalLent = friends.reduce((sum, f) => sum + (f.total_lent || 0), 0);
    const totalBorrowed = friends.reduce((sum, f) => sum + (f.total_borrowed || 0), 0);
    const netBalance = totalLent - totalBorrowed;

    return (
        <div className="friend-page fade-in">
            <div className="friend-header">
                <div>
                    <h1>Friend Fund Manager</h1>
                    <p className="text-secondary">Track lending and borrowing with friends</p>
                </div>
                <Button variant="primary" onClick={handleAdd}>
                    + Add Friend
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3">
                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon lent-icon">📤</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Lent</div>
                            <div className="stat-value text-warning">{formatCurrency(totalLent, currency)}</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon borrowed-icon">📥</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Borrowed</div>
                            <div className="stat-value text-danger">{formatCurrency(totalBorrowed, currency)}</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <div className="stat-label">Net Balance</div>
                            <div className={`stat - value ${netBalance >= 0 ? 'text-success' : 'text-danger'} `}>
                                {formatCurrency(netBalance, currency)}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Friends List */}
            <Card title={`Friends(${friends.length})`}>
                {friends.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <h3>No friends added yet</h3>
                        <p>Start tracking lending and borrowing with your friends</p>
                        <Button variant="primary" onClick={handleAdd}>
                            Add Your First Friend
                        </Button>
                    </div>
                ) : (
                    <div className="friend-grid">
                        {friends.map(friend => (
                            <div key={friend.id} className="friend-item">
                                <div className="friend-avatar">
                                    {friend.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="friend-content">
                                    <div className="friend-name">{friend.name}</div>
                                    {friend.contact && (
                                        <div className="friend-contact">{friend.contact}</div>
                                    )}
                                    <div className="friend-stats">
                                        <div className="friend-stat">
                                            <span className="friend-stat-label">Lent:</span>
                                            <span className="friend-stat-value text-warning">
                                                {formatCurrency(friend.total_lent || 0, currency)}
                                            </span>
                                        </div>
                                        <div className="friend-stat">
                                            <span className="friend-stat-label">Borrowed:</span>
                                            <span className="friend-stat-value text-danger">
                                                {formatCurrency(friend.total_borrowed || 0, currency)}
                                            </span>
                                        </div>
                                        <div className="friend-stat">
                                            <span className="friend-stat-label">Balance:</span>
                                            <span className={`friend - stat - value ${(friend.balance || 0) >= 0 ? 'text-success' : 'text-danger'} `}>
                                                {formatCurrency(friend.balance || 0, currency)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="friend-actions">
                                    <Button variant="primary" size="sm" onClick={() => handleAddTransaction(friend)}>
                                        💸 Transaction
                                    </Button>
                                    <button
                                        className="friend-action-btn"
                                        onClick={() => handleEdit(friend)}
                                        title="Edit"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="friend-action-btn"
                                        onClick={() => handleDelete(friend)}
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Add/Edit Friend Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingFriend(null);
                }}
                title={editingFriend ? 'Edit Friend' : 'Add Friend'}
                size="md"
            >
                <div className="friend-form">
                    <div className="form-group">
                        <label className="form-label">Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Friend's name"
                        />
                        {errors.name && <div className="form-error">{errors.name}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Contact (Optional)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.contact}
                            onChange={(e) => handleChange('contact', e.target.value)}
                            placeholder="Phone or email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea
                            className="form-textarea"
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Additional information..."
                            rows="3"
                        />
                    </div>

                    <div className="modal-footer">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingFriend(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            {editingFriend ? 'Update' : 'Add Friend'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Add Transaction Modal */}
            <Modal
                isOpen={isTransactionModalOpen}
                onClose={() => {
                    setIsTransactionModalOpen(false);
                    setSelectedFriend(null);
                }}
                title={`Transaction with ${selectedFriend?.name} `}
                size="md"
            >
                <div className="friend-form">
                    <div className="transaction-type-tabs">
                        <button
                            type="button"
                            className={`type - tab ${transactionData.type === 'lend' ? 'active lend' : ''} `}
                            onClick={() => handleTransactionChange('type', 'lend')}
                        >
                            📤 I Lent
                        </button>
                        <button
                            type="button"
                            className={`type - tab ${transactionData.type === 'borrow' ? 'active borrow' : ''} `}
                            onClick={() => handleTransactionChange('type', 'borrow')}
                        >
                            📥 I Borrowed
                        </button>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Amount *</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={transactionData.amount}
                            onChange={(e) => handleTransactionChange('amount', e.target.value)}
                            placeholder="0.00"
                        />
                        {errors.amount && <div className="form-error">{errors.amount}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Account *</label>
                        <select
                            className="form-select"
                            value={transactionData.account_id}
                            onChange={(e) => handleTransactionChange('account_id', e.target.value)}
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

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Date *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={transactionData.date}
                                onChange={(e) => handleTransactionChange('date', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Due Date (Optional)</label>
                            <input
                                type="date"
                                className="form-input"
                                value={transactionData.due_date}
                                onChange={(e) => handleTransactionChange('due_date', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea
                            className="form-textarea"
                            value={transactionData.notes}
                            onChange={(e) => handleTransactionChange('notes', e.target.value)}
                            placeholder="Purpose or additional details..."
                            rows="3"
                        />
                    </div>

                    <div className="modal-footer">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsTransactionModalOpen(false);
                                setSelectedFriend(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSaveTransaction}>
                            Record Transaction
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Friend"
                size="sm"
            >
                <div className="delete-confirm">
                    <p>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?</p>
                    <p className="text-warning text-sm">
                        This will not delete transactions, but you won't be able to track this friend anymore.
                    </p>
                </div>
                <div className="modal-footer">
                    <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Delete Friend
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
