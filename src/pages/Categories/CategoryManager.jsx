import { useState, useEffect } from 'react';
import Card from '../../components/UI/Card.jsx';
import Button from '../../components/UI/Button.jsx';
import Modal from '../../components/UI/Modal.jsx';
import IconPicker from '../../components/UI/IconPicker.jsx';
import ColorPicker from '../../components/UI/ColorPicker.jsx';
import { getAllCategories, addCategory, updateCategory, deleteCategory } from '../../services/db.js';
import { COLOR_PALETTE } from '../../config/constants.js';
import './CategoryManager.css';

export default function CategoryManager() {
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [activeTab, setActiveTab] = useState('expense');

    const [formData, setFormData] = useState({
        name: '',
        type: 'expense',
        icon: '📁',
        color: COLOR_PALETTE[0],
        parent_id: null
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadCategories();
    }, []);

    async function loadCategories() {
        const data = await getAllCategories();
        setCategories(data);
    }

    const handleAdd = (type) => {
        setEditingCategory(null);
        setFormData({
            name: '',
            type: type,
            icon: '📁',
            color: COLOR_PALETTE[0],
            parent_id: null
        });
        setIsModalOpen(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            type: category.type,
            icon: category.icon,
            color: category.color,
            parent_id: category.parent_id
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
            newErrors.name = 'Category name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        if (editingCategory) {
            await updateCategory(editingCategory.id, formData);
        } else {
            await addCategory(formData);
        }

        await loadCategories();
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({
            name: '',
            type: 'expense',
            icon: '📁',
            color: COLOR_PALETTE[0],
            parent_id: null
        });
    };

    const handleDelete = (category) => {
        setDeleteConfirm(category);
    };

    const confirmDelete = async () => {
        if (deleteConfirm) {
            await deleteCategory(deleteConfirm.id);
            await loadCategories();
            setDeleteConfirm(null);
        }
    };

    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    return (
        <div className="categories-page fade-in">
            <div className="categories-header">
                <div>
                    <h1>Categories</h1>
                    <p className="text-secondary">Organize your income and expenses</p>
                </div>
            </div>

            {/* Category Type Tabs */}
            <div className="category-tabs">
                <button
                    className={`category-tab ${activeTab === 'expense' ? 'active' : ''}`}
                    onClick={() => setActiveTab('expense')}
                >
                    📉 Expense Categories ({expenseCategories.length})
                </button>
                <button
                    className={`category-tab ${activeTab === 'income' ? 'active' : ''}`}
                    onClick={() => setActiveTab('income')}
                >
                    📈 Income Categories ({incomeCategories.length})
                </button>
            </div>

            {/* Expense Categories */}
            {activeTab === 'expense' && (
                <Card>
                    <div className="category-section-header">
                        <h3>Expense Categories</h3>
                        <Button variant="primary" size="sm" onClick={() => handleAdd('expense')}>
                            + Add Category
                        </Button>
                    </div>

                    {expenseCategories.length === 0 ? (
                        <div className="empty-state">
                            <p>No expense categories yet</p>
                            <Button variant="primary" onClick={() => handleAdd('expense')}>
                                Add First Category
                            </Button>
                        </div>
                    ) : (
                        <div className="categories-grid">
                            {expenseCategories.map(category => (
                                <div key={category.id} className="category-item">
                                    <div
                                        className="category-icon"
                                        style={{ background: category.color }}
                                    >
                                        {category.icon}
                                    </div>
                                    <div className="category-info">
                                        <div className="category-name">{category.name}</div>
                                        <div className="category-type">Expense</div>
                                    </div>
                                    <div className="category-actions">
                                        <button
                                            className="category-action-btn"
                                            onClick={() => handleEdit(category)}
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="category-action-btn"
                                            onClick={() => handleDelete(category)}
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
            )}

            {/* Income Categories */}
            {activeTab === 'income' && (
                <Card>
                    <div className="category-section-header">
                        <h3>Income Categories</h3>
                        <Button variant="primary" size="sm" onClick={() => handleAdd('income')}>
                            + Add Category
                        </Button>
                    </div>

                    {incomeCategories.length === 0 ? (
                        <div className="empty-state">
                            <p>No income categories yet</p>
                            <Button variant="primary" onClick={() => handleAdd('income')}>
                                Add First Category
                            </Button>
                        </div>
                    ) : (
                        <div className="categories-grid">
                            {incomeCategories.map(category => (
                                <div key={category.id} className="category-item">
                                    <div
                                        className="category-icon"
                                        style={{ background: category.color }}
                                    >
                                        {category.icon}
                                    </div>
                                    <div className="category-info">
                                        <div className="category-name">{category.name}</div>
                                        <div className="category-type">Income</div>
                                    </div>
                                    <div className="category-actions">
                                        <button
                                            className="category-action-btn"
                                            onClick={() => handleEdit(category)}
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="category-action-btn"
                                            onClick={() => handleDelete(category)}
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
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
                }}
                title={editingCategory ? 'Edit Category' : 'Add New Category'}
                size="sm"
            >
                <div className="category-form">
                    <div className="form-group">
                        <label className="form-label">Category Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="e.g., Groceries, Rent, Salary"
                        />
                        {errors.name && <div className="form-error">{errors.name}</div>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Icon</label>
                            <IconPicker
                                value={formData.icon}
                                onChange={(icon) => handleChange('icon', icon)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Color</label>
                            <ColorPicker
                                value={formData.color}
                                onChange={(color) => handleChange('color', color)}
                            />
                        </div>
                    </div>

                    <div className="category-preview">
                        <div className="category-preview-label">Preview:</div>
                        <div className="category-preview-item">
                            <div
                                className="category-preview-icon"
                                style={{ background: formData.color }}
                            >
                                {formData.icon}
                            </div>
                            <div className="category-preview-name">
                                {formData.name || 'Category Name'}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingCategory(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            {editingCategory ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Category"
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
                        Delete Category
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
