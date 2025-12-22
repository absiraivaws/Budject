import { useState } from 'react';
import Button from '../../components/UI/Button.jsx';
import IconPicker from '../../components/UI/IconPicker.jsx';
import ColorPicker from '../../components/UI/ColorPicker.jsx';
import { ACCOUNT_TYPES, COLOR_PALETTE } from '../../config/constants.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import './AccountForm.css';

export default function AccountForm({ account, onSave, onCancel }) {
    const { currency } = useCurrency();
    const [formData, setFormData] = useState({
        name: account?.name || '',
        type: account?.type || 'cash',
        balance: account?.balance || 0,
        currency: account?.currency || currency,
        color: account?.color || COLOR_PALETTE[0],
        icon: account?.icon || '💵'
    });

    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Account name is required';
        }

        if (formData.balance < 0) {
            newErrors.balance = 'Balance cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validate()) {
            onSave({
                ...formData,
                balance: parseFloat(formData.balance) || 0
            });
        }
    };

    return (
        <form className="account-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label className="form-label">Account Name *</label>
                <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Main Wallet, Savings Account"
                />
                {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="form-group">
                <label className="form-label">Account Type *</label>
                <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                >
                    {ACCOUNT_TYPES.map(type => (
                        <option key={type.id} value={type.id}>
                            {type.icon} {type.label}
                        </option>
                    ))}
                </select>
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

            <div className="form-group">
                <label className="form-label">Initial Balance</label>
                <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.balance}
                    onChange={(e) => handleChange('balance', e.target.value)}
                    placeholder="0.00"
                />
                {errors.balance && <div className="form-error">{errors.balance}</div>}
            </div>

            <div className="form-group">
                <label className="form-label">Currency</label>
                <input
                    type="text"
                    className="form-input"
                    value={formData.currency}
                    disabled
                    style={{ background: 'var(--color-bg-tertiary)', cursor: 'not-allowed' }}
                />
                <small className="text-secondary">Currency is set globally in Settings</small>
            </div>

            <div className="account-form-preview">
                <div className="account-preview-label">Preview:</div>
                <div className="account-preview-card">
                    <div className="account-preview-icon" style={{ background: formData.color }}>
                        {formData.icon}
                    </div>
                    <div className="account-preview-info">
                        <div className="account-preview-name">{formData.name || 'Account Name'}</div>
                        <div className="account-preview-type">{ACCOUNT_TYPES.find(t => t.id === formData.type)?.label}</div>
                    </div>
                </div>
            </div>

            <div className="form-actions">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary">
                    {account ? 'Update Account' : 'Create Account'}
                </Button>
            </div>
        </form>
    );
}
