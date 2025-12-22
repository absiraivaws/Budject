import { useState, useEffect } from 'react';
import Card from '../../components/UI/Card.jsx';
import Button from '../../components/UI/Button.jsx';
import Modal from '../../components/UI/Modal.jsx';
import { getAllAssets, addAsset, getAllLiabilities, addLiability, getAllAccounts } from '../../services/db.js';
import { formatCurrency } from '../../utils/currency.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { formatDate } from '../../utils/dateUtils.js';
import './AssetManager.css';

const ASSET_TYPES = [
    { id: 'property', label: 'Property', icon: '🏠' },
    { id: 'vehicle', label: 'Vehicle', icon: '🚗' },
    { id: 'investment', label: 'Investment', icon: '📈' },
    { id: 'jewelry', label: 'Jewelry', icon: '💎' },
    { id: 'electronics', label: 'Electronics', icon: '💻' },
    { id: 'other', label: 'Other', icon: '📦' }
];

const LIABILITY_TYPES = [
    { id: 'mortgage', label: 'Mortgage', icon: '🏦' },
    { id: 'loan', label: 'Loan', icon: '💰' },
    { id: 'credit_card', label: 'Credit Card', icon: '💳' },
    { id: 'other', label: 'Other', icon: '📋' }
];

export default function AssetManager() {
    const { currency } = useCurrency();
    const [assets, setAssets] = useState([]);
    const [liabilities, setLiabilities] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [activeTab, setActiveTab] = useState('assets');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('asset');

    const [formData, setFormData] = useState({
        name: '',
        type: '',
        value: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
        linked_account_id: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [assetsData, liabilitiesData, accountsData] = await Promise.all([
            getAllAssets(),
            getAllLiabilities(),
            getAllAccounts()
        ]);

        setAssets(assetsData);
        setLiabilities(liabilitiesData);
        setAccounts(accountsData);
    }

    const handleAddAsset = () => {
        setModalType('asset');
        setFormData({
            name: '',
            type: ASSET_TYPES[0].id,
            value: '',
            purchase_date: new Date().toISOString().split('T')[0],
            notes: '',
            linked_account_id: ''
        });
        setIsModalOpen(true);
    };

    const handleAddLiability = () => {
        setModalType('liability');
        setFormData({
            name: '',
            type: LIABILITY_TYPES[0].id,
            value: '',
            purchase_date: new Date().toISOString().split('T')[0],
            notes: '',
            linked_account_id: ''
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

        if (!formData.type) {
            newErrors.type = 'Type is required';
        }

        if (!formData.value || parseFloat(formData.value) <= 0) {
            newErrors.value = 'Value must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        const data = {
            ...formData,
            value: parseFloat(formData.value),
            current_value: parseFloat(formData.value)
        };

        if (modalType === 'asset') {
            await addAsset(data);
        } else {
            await addLiability(data);
        }

        await loadData();
        setIsModalOpen(false);
    };

    const totalAssets = assets.reduce((sum, asset) => sum + (asset.current_value || asset.value), 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + (liability.current_value || liability.value), 0);
    const netWorth = totalAssets - totalLiabilities;

    const getTypeInfo = (type, isAsset) => {
        const types = isAsset ? ASSET_TYPES : LIABILITY_TYPES;
        return types.find(t => t.id === type) || types[0];
    };

    const getAccountName = (accountId) => {
        const account = accounts.find(a => a.id === accountId);
        return account ? `${account.icon} ${account.name}` : null;
    };

    return (
        <div className="asset-page fade-in">
            <div className="asset-header">
                <div>
                    <h1>Assets & Liabilities</h1>
                    <p className="text-secondary">Track your net worth and financial position</p>
                </div>
            </div>

            {/* Net Worth Summary */}
            <div className="grid grid-cols-3">
                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon asset-icon">📈</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Assets</div>
                            <div className="stat-value text-success">{formatCurrency(totalAssets, currency)}</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon liability-icon">📉</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Liabilities</div>
                            <div className="stat-value text-danger">{formatCurrency(totalLiabilities, currency)}</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon">💎</div>
                        <div className="stat-content">
                            <div className="stat-label">Net Worth</div>
                            <div className={`stat-value ${netWorth >= 0 ? 'text-success' : 'text-danger'}`}>
                                {formatCurrency(netWorth, currency)}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabs */}
            <div className="asset-tabs">
                <button
                    className={`asset-tab ${activeTab === 'assets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assets')}
                >
                    📈 Assets ({assets.length})
                </button>
                <button
                    className={`asset-tab ${activeTab === 'liabilities' ? 'active' : ''}`}
                    onClick={() => setActiveTab('liabilities')}
                >
                    📉 Liabilities ({liabilities.length})
                </button>
            </div>

            {/* Assets Tab */}
            {activeTab === 'assets' && (
                <Card>
                    <div className="asset-list-header">
                        <h3>My Assets</h3>
                        <Button variant="primary" onClick={handleAddAsset}>
                            + Add Asset
                        </Button>
                    </div>

                    {assets.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📦</div>
                            <h3>No assets tracked yet</h3>
                            <p>Start tracking your assets to monitor your net worth</p>
                            <Button variant="primary" onClick={handleAddAsset}>
                                Add Your First Asset
                            </Button>
                        </div>
                    ) : (
                        <div className="asset-grid">
                            {assets.map(asset => {
                                const typeInfo = getTypeInfo(asset.type, true);
                                const linkedAccount = getAccountName(asset.linked_account_id);

                                return (
                                    <div key={asset.id} className="asset-item">
                                        <div className="asset-item-icon">{typeInfo.icon}</div>
                                        <div className="asset-item-content">
                                            <div className="asset-item-name">{asset.name}</div>
                                            <div className="asset-item-type">{typeInfo.label}</div>
                                            {linkedAccount && (
                                                <div className="asset-item-linked">Linked: {linkedAccount}</div>
                                            )}
                                            {asset.notes && (
                                                <div className="asset-item-notes">{asset.notes}</div>
                                            )}
                                            <div className="asset-item-date">
                                                Added: {formatDate(asset.purchase_date, 'short')}
                                            </div>
                                        </div>
                                        <div className="asset-item-value">
                                            {formatCurrency(asset.current_value || asset.value, currency)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            )}

            {/* Liabilities Tab */}
            {activeTab === 'liabilities' && (
                <Card>
                    <div className="asset-list-header">
                        <h3>My Liabilities</h3>
                        <Button variant="primary" onClick={handleAddLiability}>
                            + Add Liability
                        </Button>
                    </div>

                    {liabilities.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <h3>No liabilities tracked yet</h3>
                            <p>Track your debts and loans to get a complete financial picture</p>
                            <Button variant="primary" onClick={handleAddLiability}>
                                Add Your First Liability
                            </Button>
                        </div>
                    ) : (
                        <div className="asset-grid">
                            {liabilities.map(liability => {
                                const typeInfo = getTypeInfo(liability.type, false);
                                const linkedAccount = getAccountName(liability.linked_account_id);

                                return (
                                    <div key={liability.id} className="asset-item liability">
                                        <div className="asset-item-icon">{typeInfo.icon}</div>
                                        <div className="asset-item-content">
                                            <div className="asset-item-name">{liability.name}</div>
                                            <div className="asset-item-type">{typeInfo.label}</div>
                                            {linkedAccount && (
                                                <div className="asset-item-linked">Linked: {linkedAccount}</div>
                                            )}
                                            {liability.notes && (
                                                <div className="asset-item-notes">{liability.notes}</div>
                                            )}
                                            <div className="asset-item-date">
                                                Added: {formatDate(liability.purchase_date, 'short')}
                                            </div>
                                        </div>
                                        <div className="asset-item-value text-danger">
                                            {formatCurrency(liability.current_value || liability.value, currency)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalType === 'asset' ? 'Add Asset' : 'Add Liability'}
                size="md"
            >
                <div className="asset-form">
                    <div className="form-group">
                        <label className="form-label">Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder={modalType === 'asset' ? 'e.g., House, Car, Laptop' : 'e.g., Home Loan, Car Loan'}
                        />
                        {errors.name && <div className="form-error">{errors.name}</div>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Type *</label>
                            <select
                                className="form-select"
                                value={formData.type}
                                onChange={(e) => handleChange('type', e.target.value)}
                            >
                                {(modalType === 'asset' ? ASSET_TYPES : LIABILITY_TYPES).map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.icon} {type.label}
                                    </option>
                                ))}
                            </select>
                            {errors.type && <div className="form-error">{errors.type}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Value *</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                value={formData.value}
                                onChange={(e) => handleChange('value', e.target.value)}
                                placeholder="0.00"
                            />
                            {errors.value && <div className="form-error">{errors.value}</div>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Date Acquired</label>
                        <input
                            type="date"
                            className="form-input"
                            value={formData.purchase_date}
                            onChange={(e) => handleChange('purchase_date', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Link to Account (Optional)</label>
                        <select
                            className="form-select"
                            value={formData.linked_account_id}
                            onChange={(e) => handleChange('linked_account_id', e.target.value)}
                        >
                            <option value="">None</option>
                            {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.icon} {account.name}
                                </option>
                            ))}
                        </select>
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
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            Add {modalType === 'asset' ? 'Asset' : 'Liability'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
