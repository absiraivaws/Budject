import { useState } from 'react';
import Button from '../../components/UI/Button.jsx';
import IconPicker from '../../components/UI/IconPicker.jsx';
import ColorPicker from '../../components/UI/ColorPicker.jsx';
import {
    ACCOUNT_TYPES,
    COLOR_PALETTE,
    LOAN_TYPES,
    INTEREST_FREQUENCIES,
    FD_PAYOUT_TYPES
} from '../../config/constants.js';
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
        icon: account?.icon || '💵',

        // Interest-bearing accounts (Savings, FD, Credit Card)
        interest_rate: account?.interest_rate || '',
        interest_frequency: account?.interest_frequency || 'monthly',

        // Credit Card specific
        credit_limit: account?.credit_limit || '',
        billing_day: account?.billing_day || '',
        payment_due_day: account?.payment_due_day || '',

        // Fixed Deposit specific
        fd_principal: account?.fd_principal || '',
        fd_start_date: account?.fd_start_date || '',
        fd_maturity_date: account?.fd_maturity_date || '',
        fd_payout_type: account?.fd_payout_type || 'maturity',

        // Loan specific
        loan_type: account?.loan_type || 'bank_loan',
        loan_principal: account?.loan_principal || '',
        loan_installment: account?.loan_installment || '',
        loan_outstanding: account?.loan_outstanding || ''
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

        // Credit Card validations
        if (formData.type === 'card') {
            if (!formData.credit_limit || parseFloat(formData.credit_limit) <= 0) {
                newErrors.credit_limit = 'Credit limit is required';
            }
            if (!formData.billing_day || formData.billing_day < 1 || formData.billing_day > 31) {
                newErrors.billing_day = 'Billing day must be between 1-31';
            }
            if (!formData.payment_due_day || formData.payment_due_day < 1 || formData.payment_due_day > 31) {
                newErrors.payment_due_day = 'Payment due day must be between 1-31';
            }
        }

        // Fixed Deposit validations
        if (formData.type === 'fixed_deposit') {
            if (!formData.fd_principal || parseFloat(formData.fd_principal) <= 0) {
                newErrors.fd_principal = 'Principal amount is required';
            }
            if (!formData.fd_start_date) {
                newErrors.fd_start_date = 'Start date is required';
            }
            if (!formData.fd_maturity_date) {
                newErrors.fd_maturity_date = 'Maturity date is required';
            }
        }

        // Loan validations
        if (formData.type === 'loan') {
            if (!formData.loan_principal || parseFloat(formData.loan_principal) <= 0) {
                newErrors.loan_principal = 'Loan principal is required';
            }
            if (!formData.loan_installment || parseFloat(formData.loan_installment) <= 0) {
                newErrors.loan_installment = 'Installment amount is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validate()) {
            const accountData = {
                ...formData,
                balance: parseFloat(formData.balance) || 0
            };

            // Add type-specific fields
            if (formData.type === 'card') {
                accountData.credit_limit = parseFloat(formData.credit_limit);
                accountData.billing_day = parseInt(formData.billing_day);
                accountData.payment_due_day = parseInt(formData.payment_due_day);
                accountData.interest_rate = parseFloat(formData.interest_rate) || 0;
                accountData.interest_frequency = formData.interest_frequency;
            }

            if (formData.type === 'savings' || formData.type === 'fixed_deposit') {
                accountData.interest_rate = parseFloat(formData.interest_rate) || 0;
                accountData.interest_frequency = formData.interest_frequency;
            }

            if (formData.type === 'fixed_deposit') {
                accountData.fd_principal = parseFloat(formData.fd_principal);
                accountData.fd_start_date = formData.fd_start_date;
                accountData.fd_maturity_date = formData.fd_maturity_date;
                accountData.fd_payout_type = formData.fd_payout_type;
            }

            if (formData.type === 'loan') {
                accountData.loan_type = formData.loan_type;
                accountData.loan_principal = parseFloat(formData.loan_principal);
                accountData.loan_installment = parseFloat(formData.loan_installment);
                accountData.loan_outstanding = parseFloat(formData.loan_outstanding) || parseFloat(formData.loan_principal);
                accountData.interest_rate = parseFloat(formData.interest_rate) || 0;
                accountData.interest_frequency = formData.interest_frequency;
            }

            onSave(accountData);
        }
    };

    const selectedAccountType = ACCOUNT_TYPES.find(t => t.id === formData.type);
    const hasInterest = selectedAccountType?.hasInterest;

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
                <label className="form-label">
                    {formData.type === 'card' ? 'Current Balance (Negative = Debt)' : 'Initial Balance'}
                </label>
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

            {/* Credit Card Specific Fields */}
            {formData.type === 'card' && (
                <>
                    <div className="form-section-title">Credit Card Details</div>

                    <div className="form-group">
                        <label className="form-label">Credit Limit *</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={formData.credit_limit}
                            onChange={(e) => handleChange('credit_limit', e.target.value)}
                            placeholder="0.00"
                        />
                        {errors.credit_limit && <div className="form-error">{errors.credit_limit}</div>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Billing Day *</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                className="form-input"
                                value={formData.billing_day}
                                onChange={(e) => handleChange('billing_day', e.target.value)}
                                placeholder="e.g., 15"
                            />
                            {errors.billing_day && <div className="form-error">{errors.billing_day}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Payment Due Day *</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                className="form-input"
                                value={formData.payment_due_day}
                                onChange={(e) => handleChange('payment_due_day', e.target.value)}
                                placeholder="e.g., 25"
                            />
                            {errors.payment_due_day && <div className="form-error">{errors.payment_due_day}</div>}
                        </div>
                    </div>
                </>
            )}

            {/* Fixed Deposit Specific Fields */}
            {formData.type === 'fixed_deposit' && (
                <>
                    <div className="form-section-title">Fixed Deposit Details</div>

                    <div className="form-group">
                        <label className="form-label">Principal Amount *</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={formData.fd_principal}
                            onChange={(e) => handleChange('fd_principal', e.target.value)}
                            placeholder="0.00"
                        />
                        {errors.fd_principal && <div className="form-error">{errors.fd_principal}</div>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Start Date *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.fd_start_date}
                                onChange={(e) => handleChange('fd_start_date', e.target.value)}
                            />
                            {errors.fd_start_date && <div className="form-error">{errors.fd_start_date}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Maturity Date *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.fd_maturity_date}
                                onChange={(e) => handleChange('fd_maturity_date', e.target.value)}
                            />
                            {errors.fd_maturity_date && <div className="form-error">{errors.fd_maturity_date}</div>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Interest Payout Type</label>
                        <select
                            className="form-select"
                            value={formData.fd_payout_type}
                            onChange={(e) => handleChange('fd_payout_type', e.target.value)}
                        >
                            {FD_PAYOUT_TYPES.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {/* Loan Specific Fields */}
            {formData.type === 'loan' && (
                <>
                    <div className="form-section-title">Loan Details</div>

                    <div className="form-group">
                        <label className="form-label">Loan Type</label>
                        <select
                            className="form-select"
                            value={formData.loan_type}
                            onChange={(e) => handleChange('loan_type', e.target.value)}
                        >
                            {LOAN_TYPES.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.icon} {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Principal Amount *</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                value={formData.loan_principal}
                                onChange={(e) => handleChange('loan_principal', e.target.value)}
                                placeholder="0.00"
                            />
                            {errors.loan_principal && <div className="form-error">{errors.loan_principal}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Installment Amount *</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                value={formData.loan_installment}
                                onChange={(e) => handleChange('loan_installment', e.target.value)}
                                placeholder="0.00"
                            />
                            {errors.loan_installment && <div className="form-error">{errors.loan_installment}</div>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Outstanding Balance</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={formData.loan_outstanding}
                            onChange={(e) => handleChange('loan_outstanding', e.target.value)}
                            placeholder="Same as principal if not specified"
                        />
                        <small className="text-secondary">Leave empty to use principal amount</small>
                    </div>
                </>
            )}

            {/* Interest Rate Fields (for Savings, FD, Credit Card, Loan) */}
            {hasInterest && (
                <>
                    <div className="form-section-title">Interest Configuration</div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Interest Rate (% per year)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                value={formData.interest_rate}
                                onChange={(e) => handleChange('interest_rate', e.target.value)}
                                placeholder="e.g., 5.5"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Interest Frequency</label>
                            <select
                                className="form-select"
                                value={formData.interest_frequency}
                                onChange={(e) => handleChange('interest_frequency', e.target.value)}
                            >
                                {INTEREST_FREQUENCIES.map(freq => (
                                    <option key={freq.id} value={freq.id}>
                                        {freq.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </>
            )}

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
