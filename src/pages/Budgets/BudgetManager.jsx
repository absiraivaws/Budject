import { useState, useEffect } from 'react';
import Card from '../../components/UI/Card.jsx';
import Button from '../../components/UI/Button.jsx';
import Modal from '../../components/UI/Modal.jsx';
import { getAllBudgets, addBudget, updateBudget, deleteBudget, getAllCategories, getAllTransactions } from '../../services/db.js';
import { formatCurrency } from '../../utils/currency.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { getStartOfMonth, getEndOfMonth, formatDate } from '../../utils/dateUtils.js';
import { TRANSACTION_TYPES } from '../../config/constants.js';
import './BudgetManager.css';

export default function BudgetManager() {
    const { currency } = useCurrency();
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const [formData, setFormData] = useState({
        category_id: '',
        amount: '',
        month: new Date().toISOString().slice(0, 7)
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadData();
    }, [selectedMonth]);

    async function loadData() {
        const [budgetsData, categoriesData, transactionsData] = await Promise.all([
            getAllBudgets(),
            getAllCategories(),
            getAllTransactions()
        ]);

        setBudgets(budgetsData);
        setCategories(categoriesData);
        setTransactions(transactionsData);
    }

    const handleAdd = () => {
        setEditingBudget(null);
        setFormData({
            category_id: '',
            amount: '',
            month: selectedMonth
        });
        setIsModalOpen(true);
    };

    const handleEdit = (budget) => {
        setEditingBudget(budget);
        setFormData({
            category_id: budget.category_id,
            amount: budget.amount,
            month: budget.month
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

        if (!formData.category_id) {
            newErrors.category_id = 'Please select a category';
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Budget amount must be greater than 0';
        }

        if (!formData.month) {
            newErrors.month = 'Please select a month';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        const budgetData = {
            ...formData,
            amount: parseFloat(formData.amount)
        };

        if (editingBudget) {
            await updateBudget(editingBudget.id, budgetData);
        } else {
            await addBudget(budgetData);
        }

        await loadData();
        setIsModalOpen(false);
        setEditingBudget(null);
    };

    const handleDelete = (budget) => {
        setDeleteConfirm(budget);
    };

    const confirmDelete = async () => {
        if (deleteConfirm) {
            await deleteBudget(deleteConfirm.id);
            await loadData();
            setDeleteConfirm(null);
        }
    };

    // Calculate spending for a category in the selected month
    const getSpending = (categoryId) => {
        const monthStart = new Date(selectedMonth + '-01');
        const monthEnd = getEndOfMonth(monthStart);

        return transactions
            .filter(tx =>
                tx.type === TRANSACTION_TYPES.EXPENSE &&
                tx.category_id === categoryId &&
                tx.date >= monthStart.toISOString().split('T')[0] &&
                tx.date <= monthEnd.toISOString().split('T')[0]
            )
            .reduce((sum, tx) => sum + tx.amount, 0);
    };

    // Get budgets for selected month
    const monthBudgets = budgets.filter(b => b.month === selectedMonth);

    // Calculate total budget and spending
    const totalBudget = monthBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpending = monthBudgets.reduce((sum, b) => sum + getSpending(b.category_id), 0);

    // Get categories that don't have budgets yet
    const availableCategories = categories.filter(cat =>
        cat.type === 'expense' &&
        !monthBudgets.some(b => b.category_id === cat.id)
    );

    return (
        <div className="budgets-page fade-in">
            <div className="budgets-header">
                <div>
                    <h1>Budgets</h1>
                    <p className="text-secondary">Set monthly spending limits and track your progress</p>
                </div>
                <Button variant="primary" onClick={handleAdd}>
                    + Add Budget
                </Button>
            </div>

            {/* Month Selector */}
            <Card>
                <div className="month-selector">
                    <label className="form-label">Select Month</label>
                    <input
                        type="month"
                        className="form-input"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>
            </Card>

            {/* Summary Card */}
            <Card glass className="budget-summary">
                <div className="summary-content">
                    <div className="summary-section">
                        <div className="summary-label">Total Budget</div>
                        <div className="summary-value">{formatCurrency(totalBudget, currency)}</div>
                    </div>
                    <div className="summary-section">
                        <div className="summary-label">Total Spent</div>
                        <div className={`summary-value ${totalSpending > totalBudget ? 'text-danger' : 'text-success'}`}>
                            {formatCurrency(totalSpending, currency)}
                        </div>
                    </div>
                    <div className="summary-section">
                        <div className="summary-label">Remaining</div>
                        <div className={`summary-value ${totalBudget - totalSpending < 0 ? 'text-danger' : 'text-success'}`}>
                            {formatCurrency(totalBudget - totalSpending, currency)}
                        </div>
                    </div>
                </div>
                <div className="budget-progress-bar">
                    <div
                        className={`budget-progress-fill ${totalSpending > totalBudget ? 'over-budget' : ''}`}
                        style={{ width: `${Math.min((totalSpending / totalBudget) * 100, 100)}%` }}
                    ></div>
                </div>
                <div className="budget-percentage">
                    {totalBudget > 0 ? Math.round((totalSpending / totalBudget) * 100) : 0}% used
                </div>
            </Card>

            {/* Budget List */}
            <Card title={`Budgets for ${formatDate(selectedMonth + '-01', 'monthYear')}`}>
                {monthBudgets.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">💰</div>
                        <h3>No budgets for this month</h3>
                        <p>Create your first budget to start tracking your spending</p>
                        <Button variant="primary" onClick={handleAdd}>
                            Create Budget
                        </Button>
                    </div>
                ) : (
                    <div className="budgets-list">
                        {monthBudgets.map(budget => {
                            const category = categories.find(c => c.id === budget.category_id);
                            const spent = getSpending(budget.category_id);
                            const percentage = (spent / budget.amount) * 100;
                            const isOverBudget = spent > budget.amount;

                            return (
                                <div key={budget.id} className="budget-item">
                                    <div className="budget-item-header">
                                        <div className="budget-category">
                                            <div
                                                className="budget-category-icon"
                                                style={{ background: category?.color }}
                                            >
                                                {category?.icon}
                                            </div>
                                            <div className="budget-category-info">
                                                <div className="budget-category-name">{category?.name}</div>
                                                <div className="budget-amounts">
                                                    <span className={isOverBudget ? 'text-danger' : 'text-success'}>
                                                        {formatCurrency(spent, currency)}
                                                    </span>
                                                    <span className="text-secondary"> / {formatCurrency(budget.amount, currency)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="budget-actions">
                                            <button
                                                className="budget-action-btn"
                                                onClick={() => handleEdit(budget)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="budget-action-btn"
                                                onClick={() => handleDelete(budget)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>

                                    <div className="budget-progress">
                                        <div className="budget-progress-bar">
                                            <div
                                                className={`budget-progress-fill ${isOverBudget ? 'over-budget' : ''}`}
                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="budget-progress-text">
                                            <span className={isOverBudget ? 'text-danger' : ''}>
                                                {Math.round(percentage)}%
                                            </span>
                                            {isOverBudget && (
                                                <span className="over-budget-warning">
                                                    ⚠️ Over budget by {formatCurrency(spent - budget.amount, currency)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingBudget(null);
                }}
                title={editingBudget ? 'Edit Budget' : 'Add New Budget'}
                size="sm"
            >
                <div className="budget-form">
                    <div className="form-group">
                        <label className="form-label">Category *</label>
                        <select
                            className="form-select"
                            value={formData.category_id}
                            onChange={(e) => handleChange('category_id', e.target.value)}
                            disabled={!!editingBudget}
                        >
                            <option value="">Select category</option>
                            {(editingBudget
                                ? categories.filter(c => c.type === 'expense')
                                : availableCategories
                            ).map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.icon} {category.name}
                                </option>
                            ))}
                        </select>
                        {errors.category_id && <div className="form-error">{errors.category_id}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Budget Amount *</label>
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
                        <label className="form-label">Month *</label>
                        <input
                            type="month"
                            className="form-input"
                            value={formData.month}
                            onChange={(e) => handleChange('month', e.target.value)}
                        />
                        {errors.month && <div className="form-error">{errors.month}</div>}
                    </div>

                    <div className="modal-footer">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingBudget(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            {editingBudget ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Budget"
                size="sm"
            >
                <div className="delete-confirm">
                    <p>Are you sure you want to delete this budget?</p>
                    <p className="text-danger text-sm">This action cannot be undone.</p>
                </div>
                <div className="modal-footer">
                    <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Delete Budget
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
