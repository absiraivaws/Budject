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
    addLedgerEntry,
    addAsset,
    addLiability,
    addRecurring
} from '../../services/db.js';
import { formatCurrency } from '../../utils/currency.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { formatDate } from '../../utils/dateUtils.js';
import {
    generateLendingReminderMessage,
    generateBorrowingReminderMessage,
    openWhatsAppLink,
    isValidPhoneNumber
} from '../../services/whatsappLinkService.js';
import { getWhatsAppSettings } from '../../services/storageService.js';
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
        whatsapp_number: '',
        notes: '',
        // Financial fields
        initial_amount: '',
        initial_type: 'lend',
        initial_account_id: '',
        return_date: '',
        // Installment fields
        has_installments: false,
        installment_frequency: 'monthly',
        installment_count: ''
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
            whatsapp_number: '',
            notes: '',
            initial_amount: '',
            initial_type: 'lend',
            initial_account_id: accounts[0]?.id || '',
            return_date: '',
            has_installments: false,
            installment_frequency: 'monthly',
            installment_count: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (friend) => {
        setEditingFriend(friend);
        setFormData({
            name: friend.name,
            contact: friend.contact || '',
            whatsapp_number: friend.whatsapp_number || '',
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

        // Validate financial fields if amount is provided
        if (formData.initial_amount && parseFloat(formData.initial_amount) > 0) {
            if (!formData.initial_account_id) {
                newErrors.initial_account_id = 'Please select an account';
            }

            if (formData.has_installments) {
                if (!formData.installment_count || parseInt(formData.installment_count) <= 0) {
                    newErrors.installment_count = 'Number of installments must be greater than 0';
                }
            }
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
            await updateFriend(editingFriend.id, {
                name: formData.name,
                contact: formData.contact,
                whatsapp_number: formData.whatsapp_number,
                notes: formData.notes
            });
        } else {
            // Create friend with initial transaction if amount provided
            const amount = parseFloat(formData.initial_amount);
            const hasInitialAmount = amount && amount > 0;

            // Calculate installment amount if applicable
            const installmentAmount = formData.has_installments && formData.installment_count
                ? amount / parseInt(formData.installment_count)
                : 0;

            // Create friend record
            const newFriend = await addFriend({
                name: formData.name,
                contact: formData.contact,
                whatsapp_number: formData.whatsapp_number,
                notes: formData.notes,
                initial_amount: hasInitialAmount ? amount : 0,
                initial_type: formData.initial_type,
                initial_account_id: formData.initial_account_id,
                return_date: formData.return_date || null,
                has_installments: formData.has_installments,
                installment_frequency: formData.installment_frequency,
                installment_count: formData.has_installments ? parseInt(formData.installment_count) : 0,
                installment_amount: installmentAmount,
                installments_paid: 0
            });

            // If initial amount provided, create transaction and asset/liability
            if (hasInitialAmount) {
                const isLending = formData.initial_type === 'lend';
                const today = new Date().toISOString().split('T')[0];

                // Create transaction
                const transaction = await addTransaction({
                    type: isLending ? 'expense' : 'income',
                    amount: amount,
                    account_id: formData.initial_account_id,
                    date: today,
                    notes: `${isLending ? 'Lent to' : 'Borrowed from'} ${formData.name}${formData.notes ? ': ' + formData.notes : ''}`,
                    tags: [`friend:${newFriend.id}`, isLending ? 'lending' : 'borrowing'],
                    friend_id: newFriend.id,
                    due_date: formData.return_date || null
                });

                // Create ledger entries
                if (isLending) {
                    // Debit: Receivable (asset increases)
                    await addLedgerEntry({
                        transaction_id: transaction.id,
                        account_id: formData.initial_account_id,
                        type: 'debit',
                        amount: amount,
                        date: today,
                        description: `Lent to ${formData.name}`
                    });

                    // Credit: Cash/Bank (asset decreases)
                    await addLedgerEntry({
                        transaction_id: transaction.id,
                        account_id: formData.initial_account_id,
                        type: 'credit',
                        amount: amount,
                        date: today,
                        description: `Lent to ${formData.name}`
                    });

                    // Create asset (receivable)
                    await addAsset({
                        name: `Loan to ${formData.name}`,
                        type: 'receivable',
                        value: amount,
                        friend_id: newFriend.id,
                        return_date: formData.return_date || null,
                        description: formData.notes || `Money lent to ${formData.name}`
                    });
                } else {
                    // Debit: Cash/Bank (asset increases)
                    await addLedgerEntry({
                        transaction_id: transaction.id,
                        account_id: formData.initial_account_id,
                        type: 'debit',
                        amount: amount,
                        date: today,
                        description: `Borrowed from ${formData.name}`
                    });

                    // Credit: Payable (liability increases)
                    await addLedgerEntry({
                        transaction_id: transaction.id,
                        account_id: formData.initial_account_id,
                        type: 'credit',
                        amount: amount,
                        date: today,
                        description: `Borrowed from ${formData.name}`
                    });

                    // Create liability (payable)
                    await addLiability({
                        name: `Loan from ${formData.name}`,
                        type: 'payable',
                        value: amount,
                        friend_id: newFriend.id,
                        due_date: formData.return_date || null,
                        description: formData.notes || `Money borrowed from ${formData.name}`
                    });
                }

                // Update friend totals
                await updateFriend(newFriend.id, {
                    total_lent: isLending ? amount : 0,
                    total_borrowed: !isLending ? amount : 0,
                    balance: isLending ? amount : -amount
                });

                // Create recurring transaction if installments enabled
                if (formData.has_installments && formData.installment_count) {
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    nextMonth.setDate(1);
                    const nextDate = nextMonth.toISOString().split('T')[0];

                    await addRecurring({
                        name: `${isLending ? 'Installment from' : 'Installment to'} ${formData.name}`,
                        type: isLending ? 'income' : 'expense',
                        amount: installmentAmount,
                        account_id: formData.initial_account_id,
                        category_id: null,
                        frequency: formData.installment_frequency,
                        start_date: nextDate,
                        end_date: formData.return_date || null,
                        notes: `${isLending ? 'Installment from' : 'Installment to'} ${formData.name}`,
                        tags: [`friend:${newFriend.id}`, 'installment'],
                        next_date: nextDate,
                        last_processed: null,
                        is_active: true,
                        friend_id: newFriend.id
                    });
                }
            }
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

    // WhatsApp Contact Picker
    const handlePickContact = async () => {
        if ('contacts' in navigator && 'ContactsManager' in window) {
            try {
                const props = ['tel'];
                const opts = { multiple: false };
                const contacts = await navigator.contacts.select(props, opts);

                if (contacts.length > 0 && contacts[0].tel.length > 0) {
                    handleChange('whatsapp_number', contacts[0].tel[0]);
                }
            } catch (error) {
                console.error('Contact picker error:', error);
                alert('Contact picker not available. Please enter number manually.');
            }
        } else {
            alert('Contact picker not supported on this device. Please enter number manually.');
        }
    };

    // Send WhatsApp Reminder
    const handleSendWhatsAppReminder = async (friend) => {
        if (!friend.whatsapp_number) {
            alert('No WhatsApp number saved for this friend. Please add their WhatsApp number first.');
            return;
        }

        if (!isValidPhoneNumber(friend.whatsapp_number)) {
            alert('Invalid WhatsApp number. Please update the friend\'s WhatsApp number.');
            return;
        }

        const isLending = friend.balance > 0; // Positive balance means friend owes money
        const amount = Math.abs(friend.balance);

        if (amount === 0) {
            alert('No outstanding balance with this friend.');
            return;
        }

        let message;
        if (isLending) {
            // Friend owes money to user
            message = generateLendingReminderMessage(
                friend.name,
                amount,
                friend.return_date,
                currency
            );
        } else {
            // User owes money to friend
            message = generateBorrowingReminderMessage(
                friend.name,
                amount,
                friend.return_date,
                currency
            );
        }

        // Update last reminder sent timestamp
        await updateFriend(friend.id, {
            ...friend,
            last_reminder_sent: new Date().toISOString()
        });

        // Open WhatsApp with pre-filled message
        openWhatsAppLink(friend.whatsapp_number, message);

        // Reload data to update UI
        await loadData();
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
                                    {friend.whatsapp_number && friend.balance !== 0 && (
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={() => handleSendWhatsAppReminder(friend)}
                                            title="Send WhatsApp Reminder"
                                        >
                                            📱 Remind
                                        </Button>
                                    )}
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
                size="lg"
            >
                <div className="friend-form">
                    {/* Basic Information Section */}
                    <div className="form-section">
                        <h3 className="form-section-title">Basic Information</h3>

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
                            <label className="form-label">WhatsApp Number (Optional)</label>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.whatsapp_number}
                                    onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                                    placeholder="+94771234567"
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handlePickContact}
                                    title="Pick from contacts"
                                    type="button"
                                >
                                    📇
                                </Button>
                            </div>
                            <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                Format: +[country code][number] (e.g., +94771234567)
                            </small>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea
                                className="form-textarea"
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder="Additional information..."
                                rows="2"
                            />
                        </div>
                    </div>

                    {/* Financial Details Section - Only show when adding new friend */}
                    {!editingFriend && (
                        <>
                            <div className="form-divider"></div>

                            <div className="form-section">
                                <h3 className="form-section-title">Initial Transaction (Optional)</h3>
                                <p className="form-section-subtitle">Add initial lending or borrowing details</p>

                                {/* Lent/Borrow Toggle */}
                                <div className="transaction-type-tabs">
                                    <button
                                        type="button"
                                        className={`type-tab ${formData.initial_type === 'lend' ? 'active lend' : ''}`}
                                        onClick={() => handleChange('initial_type', 'lend')}
                                    >
                                        📤 I Lent
                                    </button>
                                    <button
                                        type="button"
                                        className={`type-tab ${formData.initial_type === 'borrow' ? 'active borrow' : ''}`}
                                        onClick={() => handleChange('initial_type', 'borrow')}
                                    >
                                        📥 I Borrowed
                                    </button>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Amount</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.initial_amount}
                                            onChange={(e) => handleChange('initial_amount', e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Account</label>
                                        <select
                                            className="form-select"
                                            value={formData.initial_account_id}
                                            onChange={(e) => handleChange('initial_account_id', e.target.value)}
                                        >
                                            <option value="">Select account</option>
                                            {accounts.map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.icon} {account.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.initial_account_id && <div className="form-error">{errors.initial_account_id}</div>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Return Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.return_date}
                                        onChange={(e) => handleChange('return_date', e.target.value)}
                                    />
                                </div>

                                {/* Installment Options */}
                                {formData.initial_amount && parseFloat(formData.initial_amount) > 0 && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.has_installments}
                                                    onChange={(e) => handleChange('has_installments', e.target.checked)}
                                                />
                                                <span>Enable Installment Payments</span>
                                            </label>
                                        </div>

                                        {formData.has_installments && (
                                            <div className="installment-details">
                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label className="form-label">Frequency</label>
                                                        <select
                                                            className="form-select"
                                                            value={formData.installment_frequency}
                                                            onChange={(e) => handleChange('installment_frequency', e.target.value)}
                                                        >
                                                            <option value="weekly">Weekly</option>
                                                            <option value="monthly">Monthly</option>
                                                            <option value="quarterly">Quarterly</option>
                                                        </select>
                                                    </div>

                                                    <div className="form-group">
                                                        <label className="form-label">Number of Installments</label>
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            value={formData.installment_count}
                                                            onChange={(e) => handleChange('installment_count', e.target.value)}
                                                            placeholder="e.g., 10"
                                                            min="1"
                                                        />
                                                        {errors.installment_count && <div className="form-error">{errors.installment_count}</div>}
                                                    </div>
                                                </div>

                                                {formData.installment_count && parseInt(formData.installment_count) > 0 && (
                                                    <div className="installment-summary">
                                                        <span className="installment-label">Amount per installment:</span>
                                                        <span className="installment-value">
                                                            {formatCurrency(
                                                                parseFloat(formData.initial_amount) / parseInt(formData.installment_count),
                                                                currency
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}

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
