import { useState, useEffect } from 'react';
import { parseTransactionSMS, detectBank, matchUserAccount } from '../../services/smsParserService.js';
import { getAllAccounts } from '../../services/db.js';
import { SRI_LANKAN_BANKS } from '../../config/constants.js';
import Modal from '../UI/Modal.jsx';
import Button from '../UI/Button.jsx';
import './SMSImportModal.css';

export default function SMSImportModal({ isOpen, onClose, onImport }) {
    const [smsText, setSmsText] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [userAccounts, setUserAccounts] = useState([]);
    const [detectedBankId, setDetectedBankId] = useState(null);

    // Load user accounts
    useEffect(() => {
        if (isOpen) {
            loadAccounts();
        }
    }, [isOpen]);

    const loadAccounts = async () => {
        try {
            const accounts = await getAllAccounts();
            setUserAccounts(accounts);
        } catch (error) {
            console.error('Error loading accounts:', error);
        }
    };

    // Parse SMS when text changes
    useEffect(() => {
        if (smsText.trim()) {
            const bankId = detectBank(smsText);
            setDetectedBankId(bankId);

            const result = parseTransactionSMS(smsText, bankId);
            setParsedData(result);

            // Try to match account
            if (result && result.account) {
                const matched = matchUserAccount(result.account, userAccounts);
                setSelectedAccount(matched);
            }
        } else {
            setParsedData(null);
            setSelectedAccount(null);
            setDetectedBankId(null);
        }
    }, [smsText, userAccounts]);

    const handleImport = () => {
        if (!parsedData || !parsedData.amount) {
            alert('Please paste a valid SMS first');
            return;
        }

        const transactionData = {
            amount: parsedData.amount,
            type: parsedData.type || 'expense',
            date: parsedData.date || new Date().toISOString().split('T')[0],
            description: parsedData.description || 'Imported from SMS',
            accountId: selectedAccount?.id || null,
            category: null, // User will select
            notes: `Imported from SMS\n\nOriginal SMS:\n${parsedData.rawText}`
        };

        onImport(transactionData);
        handleClose();
    };

    const handleClose = () => {
        setSmsText('');
        setParsedData(null);
        setSelectedAccount(null);
        setDetectedBankId(null);
        onClose();
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'var(--color-success)';
        if (confidence >= 0.5) return 'var(--color-warning)';
        return 'var(--color-danger)';
    };

    const getDetectedBankName = () => {
        const bank = SRI_LANKAN_BANKS.find(b => b.id === detectedBankId);
        return bank ? bank.name : 'Unknown Bank';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="📱 Import from SMS"
            size="lg"
        >
            <div className="sms-import-container">
                <p className="sms-import-description">
                    Paste your bank SMS or email notification to automatically extract transaction details.
                </p>

                {/* SMS Input */}
                <div className="sms-import-section">
                    <label className="sms-import-label">
                        <span className="label-text">Bank SMS/Email</span>
                        <textarea
                            className="sms-import-textarea"
                            placeholder="Paste your bank SMS here...&#10;&#10;Example:&#10;LKR 150,000.00 credited to AC **8399 for December salary - Sampath Bank"
                            value={smsText}
                            onChange={(e) => setSmsText(e.target.value)}
                            rows={5}
                            autoFocus
                        />
                    </label>
                </div>

                {/* Detected Bank */}
                {detectedBankId && (
                    <div className="detected-bank">
                        🏦 Detected: <strong>{getDetectedBankName()}</strong>
                    </div>
                )}

                {/* Parsed Preview */}
                {parsedData && parsedData.amount !== null && (
                    <div className="sms-import-preview">
                        <div className="preview-header">
                            <h4>📋 Extracted Transaction</h4>
                            <span
                                className="confidence-badge"
                                style={{ backgroundColor: getConfidenceColor(parsedData.confidence) }}
                            >
                                {Math.round(parsedData.confidence * 100)}% Match
                            </span>
                        </div>

                        <div className="preview-grid">
                            <div className="preview-item">
                                <span className="preview-label">Amount</span>
                                <span className="preview-value amount">
                                    Rs. {parsedData.amount.toLocaleString()}
                                </span>
                            </div>

                            <div className="preview-item">
                                <span className="preview-label">Type</span>
                                <span className={`preview-value type ${parsedData.type}`}>
                                    {parsedData.type === 'income' ? '💰 Income' : '💸 Expense'}
                                </span>
                            </div>

                            <div className="preview-item">
                                <span className="preview-label">Date</span>
                                <span className="preview-value">
                                    {new Date(parsedData.date).toLocaleDateString()}
                                </span>
                            </div>

                            {parsedData.description && (
                                <div className="preview-item full-width">
                                    <span className="preview-label">Description</span>
                                    <span className="preview-value">
                                        {parsedData.description}
                                    </span>
                                </div>
                            )}

                            {parsedData.account && (
                                <div className="preview-item">
                                    <span className="preview-label">Account (Last 4)</span>
                                    <span className="preview-value">
                                        ****{parsedData.account}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Account Matching */}
                        {parsedData.account && (
                            <div className="account-matching">
                                <label className="account-match-label">
                                    <span className="label-text">
                                        {selectedAccount ? '✅ Matched Account' : '⚠️ Select Account'}
                                    </span>
                                    <select
                                        className="form-select"
                                        value={selectedAccount?.id || ''}
                                        onChange={(e) => {
                                            const account = userAccounts.find(a => a.id === e.target.value);
                                            setSelectedAccount(account);
                                        }}
                                    >
                                        <option value="">Select account...</option>
                                        {userAccounts.map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.icon} {account.name}
                                                {account.accountNumber && ` (****${account.accountNumber.slice(-4)})`}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                {selectedAccount && (
                                    <p className="account-match-info">
                                        ✓ Matched based on account number ending in {parsedData.account}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* No Data Parsed */}
                {parsedData && parsedData.amount === null && smsText.trim() && (
                    <div className="sms-import-error">
                        <p>❌ Could not extract transaction data from this SMS.</p>
                        <p className="error-hint">
                            Make sure the SMS contains amount and transaction type (credit/debit).
                            You can train the AI in Settings → SMS Parser Training.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleImport}
                    disabled={!parsedData || parsedData.amount === null}
                >
                    ✅ Use This Data
                </Button>
            </div>
        </Modal>
    );
}
