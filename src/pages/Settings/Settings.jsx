import { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import Card from '../../components/UI/Card.jsx';
import Button from '../../components/UI/Button.jsx';
import Modal from '../../components/UI/Modal.jsx';
import { CURRENCIES } from '../../config/constants.js';
import { exportAllData, importData, clearAllData } from '../../services/db.js';
import './Settings.css';

export default function Settings() {
    const { currency, setCurrency } = useCurrency();
    const { theme, toggleTheme } = useTheme();
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [importStatus, setImportStatus] = useState(null);

    const handleExport = async () => {
        try {
            const data = await exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `budject-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data. Please try again.');
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            await importData(data);
            setImportStatus('success');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Import failed:', error);
            setImportStatus('error');
        }

        // Reset file input
        event.target.value = '';
    };

    const handleClearData = async () => {
        try {
            await clearAllData();
            setShowClearConfirm(false);
            window.location.reload();
        } catch (error) {
            console.error('Clear data failed:', error);
            alert('Failed to clear data. Please try again.');
        }
    };

    return (
        <div className="settings-page fade-in">
            <h1>Settings</h1>

            {/* Appearance */}
            <Card title="Appearance">
                <div className="settings-section">
                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Theme</div>
                            <div className="setting-description">
                                Switch between light and dark mode
                            </div>
                        </div>
                        <Button variant="secondary" onClick={toggleTheme}>
                            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Currency */}
            <Card title="Currency">
                <div className="settings-section">
                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Default Currency</div>
                            <div className="setting-description">
                                Choose your preferred currency for display
                            </div>
                        </div>
                        <select
                            className="form-select currency-select"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            {CURRENCIES.map(curr => (
                                <option key={curr.code} value={curr.code}>
                                    {curr.symbol} {curr.name} ({curr.code})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Data Management */}
            <Card title="Data Management">
                <div className="settings-section">
                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Export Data</div>
                            <div className="setting-description">
                                Download all your data as a JSON file for backup
                            </div>
                        </div>
                        <Button variant="primary" onClick={handleExport}>
                            📥 Export Backup
                        </Button>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Import Data</div>
                            <div className="setting-description">
                                Restore data from a previously exported backup file
                            </div>
                        </div>
                        <div>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                style={{ display: 'none' }}
                                id="import-file"
                            />
                            <label htmlFor="import-file">
                                <Button variant="secondary" as="span">
                                    📤 Import Backup
                                </Button>
                            </label>
                            {importStatus === 'success' && (
                                <div className="import-status success">
                                    ✅ Import successful! Reloading...
                                </div>
                            )}
                            {importStatus === 'error' && (
                                <div className="import-status error">
                                    ❌ Import failed. Please check the file format.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="setting-item danger-zone">
                        <div className="setting-info">
                            <div className="setting-label text-danger">Clear All Data</div>
                            <div className="setting-description">
                                ⚠️ This will delete all your data permanently. This action cannot be undone.
                            </div>
                        </div>
                        <Button variant="danger" onClick={() => setShowClearConfirm(true)}>
                            🗑️ Clear Data
                        </Button>
                    </div>
                </div>
            </Card>

            {/* About */}
            <Card title="About">
                <div className="settings-section">
                    <div className="about-info">
                        <h3>Budject - Budget & Money Manager</h3>
                        <p className="text-secondary">Version 1.0.0</p>
                        <p className="text-secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            A comprehensive personal finance management application with double-entry accounting,
                            budgeting, recurring transactions, reports, and more.
                        </p>
                        <div className="feature-list">
                            <div className="feature-item">✅ Account Management</div>
                            <div className="feature-item">✅ Transaction Tracking</div>
                            <div className="feature-item">✅ Category Management</div>
                            <div className="feature-item">✅ Budget Planning</div>
                            <div className="feature-item">✅ Calendar View</div>
                            <div className="feature-item">✅ Recurring Transactions</div>
                            <div className="feature-item">✅ Reports & Analytics</div>
                            <div className="feature-item">✅ Assets & Liabilities</div>
                            <div className="feature-item">✅ Data Export/Import</div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Clear Data Confirmation Modal */}
            <Modal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                title="Clear All Data"
                size="sm"
            >
                <div className="clear-confirm">
                    <p className="text-danger" style={{ fontWeight: 'bold' }}>
                        ⚠️ WARNING: This action cannot be undone!
                    </p>
                    <p>
                        This will permanently delete:
                    </p>
                    <ul>
                        <li>All accounts</li>
                        <li>All transactions</li>
                        <li>All categories</li>
                        <li>All budgets</li>
                        <li>All recurring transactions</li>
                        <li>All assets and liabilities</li>
                    </ul>
                    <p>
                        Make sure you have exported a backup before proceeding.
                    </p>
                </div>
                <div className="modal-footer">
                    <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleClearData}>
                        Yes, Clear All Data
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
