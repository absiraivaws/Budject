import { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card from '../../components/UI/Card.jsx';
import Button from '../../components/UI/Button.jsx';
import Modal from '../../components/UI/Modal.jsx';
import AccountForm from './AccountForm.jsx';
import { getAllAccounts, addAccount, updateAccount, deleteAccount } from '../../services/db.js';
import { formatCurrency } from '../../utils/currency.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { ACCOUNT_TYPES } from '../../config/constants.js';
import { useDragDropOrder } from '../../hooks/useDragDropOrder.js';
import './AccountList.css';

// Sortable Account Card Component
function SortableAccountCard({ account, currency, onEdit, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: account.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const accountType = ACCOUNT_TYPES.find(t => t.id === account.type);

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card className="account-card">
                <div className="account-card-content">
                    <div
                        className="account-card-icon"
                        style={{ background: account.color }}
                    >
                        {account.icon}
                    </div>
                    <div className="account-card-info">
                        <h3 className="account-card-name">{account.name}</h3>
                        <div className="account-card-type">
                            {accountType?.icon} {accountType?.label}
                        </div>
                    </div>
                    <div className="account-card-balance">
                        {formatCurrency(account.balance || 0, currency)}
                    </div>
                </div>
                <div className="account-card-actions">
                    <button
                        className="account-action-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(account);
                        }}
                        title="Edit"
                    >
                        ✏️
                    </button>
                    <button
                        className="account-action-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(account);
                        }}
                        title="Delete"
                    >
                        🗑️
                    </button>
                </div>
            </Card>
        </div>
    );
}

export default function AccountList() {
    const { currency } = useCurrency();
    const [accounts, setAccounts] = useState([]);
    const { orderedItems: orderedAccounts, handleDragEnd } = useDragDropOrder(accounts, 'accounts-order');
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        loadAccounts();
    }, []);

    async function loadAccounts() {
        const data = await getAllAccounts();
        setAccounts(data);
    }

    const handleAdd = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleSave = async (accountData) => {
        if (editingAccount) {
            await updateAccount(editingAccount.id, accountData);
        } else {
            await addAccount(accountData);
        }
        await loadAccounts();
        setIsModalOpen(false);
        setEditingAccount(null);
    };

    const handleDelete = async (account) => {
        setDeleteConfirm(account);
    };

    const confirmDelete = async () => {
        if (deleteConfirm) {
            await deleteAccount(deleteConfirm.id);
            await loadAccounts();
            setDeleteConfirm(null);
        }
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    return (
        <div className="accounts-page fade-in">
            <div className="accounts-header">
                <div>
                    <h1>Accounts</h1>
                    <p className="text-secondary">Manage your cash, bank accounts, cards, and more</p>
                </div>
                <Button variant="primary" onClick={handleAdd}>
                    + Add Account
                </Button>
            </div>

            {/* Summary Card */}
            <Card glass className="accounts-summary">
                <div className="summary-content">
                    <div className="summary-icon">💰</div>
                    <div className="summary-info">
                        <div className="summary-label">Total Balance</div>
                        <div className="summary-value">{formatCurrency(totalBalance, currency)}</div>
                    </div>
                    <div className="summary-count">
                        <span className="count-number">{accounts.length}</span>
                        <span className="count-label">Account{accounts.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </Card>

            {/* Accounts Grid */}
            {accounts.length === 0 ? (
                <Card>
                    <div className="empty-state">
                        <div className="empty-icon">🏦</div>
                        <h3>No accounts yet</h3>
                        <p>Create your first account to start tracking your finances</p>
                        <Button variant="primary" onClick={handleAdd}>
                            Create Account
                        </Button>
                    </div>
                </Card>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={orderedAccounts.map(a => a.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="accounts-grid">
                            {orderedAccounts.map(account => (
                                <SortableAccountCard
                                    key={account.id}
                                    account={account}
                                    currency={currency}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAccount(null);
                }}
                title={editingAccount ? 'Edit Account' : 'Add New Account'}
                size="md"
            >
                <AccountForm
                    account={editingAccount}
                    onSave={handleSave}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingAccount(null);
                    }}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Account"
                size="sm"
            >
                <div className="delete-confirm">
                    <p>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?</p>
                    <p className="text-danger text-sm">This action cannot be undone.</p>
                </div>
                <div className="modal-footer">
                    <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Delete Account
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
