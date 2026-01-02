import { useState, useMemo } from 'react';
import { SRI_LANKAN_BANKS } from '../../config/constants.js';
import {
    parseTransactionSMS,
    saveTrainingSample,
    getParsingAccuracy,
    getTrainingSampleCount,
    detectBank
} from '../../services/smsParserService.js';
import Card from '../UI/Card.jsx';
import Button from '../UI/Button.jsx';
import './SMSParserTraining.css';

export default function SMSParserTraining() {
    const [selectedBank, setSelectedBank] = useState('peoples_bank');
    const [smsText, setSmsText] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [accuracy, setAccuracy] = useState(0);
    const [sampleCount, setSampleCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // Get AI learning data for all banks
    const banksWithAI = useMemo(() => {
        return SRI_LANKAN_BANKS.map(bank => ({
            ...bank,
            accuracy: getParsingAccuracy(bank.id),
            sampleCount: getTrainingSampleCount(bank.id)
        }));
    }, []);

    // Filter banks based on search query
    const filteredBanks = useMemo(() => {
        if (!searchQuery.trim()) return banksWithAI;

        const query = searchQuery.toLowerCase();
        return banksWithAI.filter(bank =>
            bank.name.toLowerCase().includes(query)
        );
    }, [searchQuery, banksWithAI]);

    // Load accuracy and sample count when bank changes
    const handleBankChange = (e) => {
        const bankId = e.target.value;
        setSelectedBank(bankId);
        setAccuracy(getParsingAccuracy(bankId));
        setSampleCount(getTrainingSampleCount(bankId));
        setParsedData(null);
    };

    // Parse SMS
    const handleParseSMS = () => {
        if (!smsText.trim()) {
            alert('Please paste an SMS first');
            return;
        }

        const result = parseTransactionSMS(smsText, selectedBank);
        setParsedData(result);
    };

    // Auto-detect bank and parse
    const handleAutoDetect = () => {
        if (!smsText.trim()) {
            alert('Please paste an SMS first');
            return;
        }

        const detectedBankId = detectBank(smsText);
        setSelectedBank(detectedBankId);

        const result = parseTransactionSMS(smsText, detectedBankId);
        setParsedData(result);

        setAccuracy(getParsingAccuracy(detectedBankId));
        setSampleCount(getTrainingSampleCount(detectedBankId));
    };

    // Save as training sample
    const handleSaveTraining = () => {
        if (!parsedData) {
            alert('Please parse an SMS first');
            return;
        }

        const bankData = saveTrainingSample(selectedBank, smsText, parsedData, true);
        setAccuracy(bankData.accuracy);
        setSampleCount(bankData.totalSamples);

        alert('✅ Training sample saved successfully!');

        // Clear form
        setSmsText('');
        setParsedData(null);
    };

    // Clear form
    const handleClear = () => {
        setSmsText('');
        setParsedData(null);
    };

    // Get confidence color
    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'var(--color-success)';
        if (confidence >= 0.5) return 'var(--color-warning)';
        return 'var(--color-danger)';
    };

    // Get accuracy color
    const getAccuracyColor = (acc) => {
        if (acc >= 0.8) return 'success';
        if (acc >= 0.5) return 'warning';
        return 'danger';
    };

    return (
        <Card title="SMS Parser Training">
            <div className="sms-training-container">
                <p className="sms-training-description">
                    Train the AI to recognize your bank's SMS format by providing sample messages.
                    This improves accuracy for quick transaction imports.
                </p>

                {/* Bank Selector with Search */}
                <div className="sms-training-section">
                    <label className="sms-training-label">
                        <span className="label-text">Select Your Bank</span>

                        {/* Search Input */}
                        <input
                            type="text"
                            className="bank-search-input"
                            placeholder="🔍 Search banks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        {/* Bank Dropdown - Normal dropdown that shows selected value */}
                        <select
                            className="form-select bank-select-with-ai"
                            value={selectedBank}
                            onChange={handleBankChange}
                        >
                            {filteredBanks.map(bank => (
                                <option key={bank.id} value={bank.id}>
                                    {bank.icon} {bank.name} {bank.accuracy > 0 ? `(AI: ${Math.round(bank.accuracy * 100)}%)` : ''}
                                </option>
                            ))}
                        </select>

                        {filteredBanks.length === 0 && (
                            <div className="no-results">
                                No banks found matching "{searchQuery}"
                            </div>
                        )}
                    </label>
                </div>

                {/* AI Learning Progress */}
                <div className="sms-training-section">
                    <div className="ai-progress-container">
                        <div className="ai-progress-header">
                            <span className="ai-progress-label">AI Learning Progress</span>
                            <span className={`ai-progress-percentage ${getAccuracyColor(accuracy)}`}>
                                {Math.round(accuracy * 100)}%
                            </span>
                        </div>
                        <div className="ai-progress-bar">
                            <div
                                className={`ai-progress-fill ${getAccuracyColor(accuracy)}`}
                                style={{ width: `${accuracy * 100}%` }}
                            ></div>
                        </div>
                        <div className="ai-progress-info">
                            <span>📊 Trained on {sampleCount} sample{sampleCount !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>

                {/* SMS Input */}
                <div className="sms-training-section">
                    <label className="sms-training-label">
                        <span className="label-text">Paste Bank SMS/Email</span>
                        <textarea
                            className="sms-textarea"
                            placeholder="Paste your bank SMS or email notification here...&#10;&#10;Example:&#10;Dear Sir/Madam, Your A/C (044-2001******00) has been Credited by Rs. 101760.15 (Transfer Credit at 13:12 01/01/2026). Thank You-Peoples Bank"
                            value={smsText}
                            onChange={(e) => setSmsText(e.target.value)}
                            rows={6}
                        />
                    </label>
                    <div className="sms-char-count">
                        {smsText.length} characters
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="sms-training-actions">
                    <Button variant="primary" onClick={handleParseSMS}>
                        🔍 Parse SMS
                    </Button>
                    <Button variant="secondary" onClick={handleAutoDetect}>
                        🤖 Auto-Detect Bank
                    </Button>
                    <Button variant="secondary" onClick={handleClear}>
                        🗑️ Clear
                    </Button>
                </div>

                {/* Parsed Data Preview */}
                {parsedData && (
                    <div className="sms-training-section">
                        <div className="parsed-preview">
                            <div className="parsed-preview-header">
                                <h4>📋 Extracted Data</h4>
                                <span
                                    className="confidence-badge"
                                    style={{ backgroundColor: getConfidenceColor(parsedData.confidence) }}
                                >
                                    {Math.round(parsedData.confidence * 100)}% Confidence
                                </span>
                            </div>

                            <div className="parsed-fields">
                                <div className="parsed-field">
                                    <span className="field-label">Amount:</span>
                                    <span className="field-value">
                                        {parsedData.amount !== null ?
                                            `Rs. ${parsedData.amount.toLocaleString()}` :
                                            '❌ Not found'}
                                    </span>
                                </div>

                                <div className="parsed-field">
                                    <span className="field-label">Type:</span>
                                    <span className="field-value">
                                        {parsedData.type === 'income' ? '💰 Income (Credit)' :
                                            parsedData.type === 'expense' ? '💸 Expense (Debit)' :
                                                '❌ Not found'}
                                    </span>
                                </div>

                                <div className="parsed-field">
                                    <span className="field-label">Date:</span>
                                    <span className="field-value">
                                        {parsedData.date || '📅 Today'}
                                    </span>
                                </div>

                                {parsedData.time && (
                                    <div className="parsed-field">
                                        <span className="field-label">Time:</span>
                                        <span className="field-value">
                                            ⏰ {parsedData.time}
                                        </span>
                                    </div>
                                )}

                                <div className="parsed-field">
                                    <span className="field-label">Account (Last 4):</span>
                                    <span className="field-value">
                                        {parsedData.account ? `****${parsedData.account}` : '❌ Not found'}
                                    </span>
                                </div>

                                {parsedData.description && (
                                    <div className="parsed-field">
                                        <span className="field-label">Description:</span>
                                        <span className="field-value">
                                            📝 {parsedData.description}
                                        </span>
                                    </div>
                                )}

                                {parsedData.balance !== null && (
                                    <div className="parsed-field">
                                        <span className="field-label">Available Balance:</span>
                                        <span className="field-value">
                                            💵 Rs. {parsedData.balance.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="parsed-preview-actions">
                                <Button variant="success" onClick={handleSaveTraining}>
                                    💾 Save as Training Sample
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
