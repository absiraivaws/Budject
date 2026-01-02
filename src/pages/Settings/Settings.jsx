import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useFontSize } from '../../context/FontSizeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Card from '../../components/UI/Card.jsx';
import Button from '../../components/UI/Button.jsx';
import Modal from '../../components/UI/Modal.jsx';
import SMSParserTraining from '../../components/SMSParser/SMSParserTraining.jsx';
import { CURRENCIES, REMINDER_TIMES } from '../../config/constants.js';
import { exportAllData, importData, clearAllData } from '../../services/db.js';
import { getDailyReminderSettings, setDailyReminderSettings } from '../../services/storageService.js';
import { requestNotificationPermission, getNotificationPermission, isNotificationSupported } from '../../services/notificationService.js';
import './Settings.css';

export default function Settings() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { currency, setCurrency } = useCurrency();
    const { theme, toggleTheme } = useTheme();
    const { fontSize, setFontSize, fontSizes, currentSize } = useFontSize();
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [importStatus, setImportStatus] = useState(null);
    const [budgetRollover, setBudgetRollover] = useState(() => {
        const saved = localStorage.getItem('budgetRollover');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [reminderSettings, setReminderSettings] = useState(() => getDailyReminderSettings());
    const [notificationPermission, setNotificationPermission] = useState(() => getNotificationPermission());

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

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleBudgetRolloverChange = (e) => {
        const value = e.target.checked;
        setBudgetRollover(value);
        localStorage.setItem('budgetRollover', JSON.stringify(value));
    };

    const handleReminderToggle = (e) => {
        const newSettings = {
            ...reminderSettings,
            enabled: e.target.checked
        };
        setReminderSettings(newSettings);
        setDailyReminderSettings(newSettings);
    };

    const handleReminderTimeChange = (e) => {
        const newSettings = {
            ...reminderSettings,
            time: e.target.value
        };
        setReminderSettings(newSettings);
        setDailyReminderSettings(newSettings);
    };

    const handleEmailReminderToggle = (e) => {
        const newSettings = {
            ...reminderSettings,
            emailEnabled: e.target.checked
        };
        setReminderSettings(newSettings);
        setDailyReminderSettings(newSettings);
    };

    const handleBrowserNotificationToggle = (e) => {
        const newSettings = {
            ...reminderSettings,
            browserNotificationEnabled: e.target.checked
        };
        setReminderSettings(newSettings);
        setDailyReminderSettings(newSettings);
    };

    const handleRequestNotificationPermission = async () => {
        const permission = await requestNotificationPermission();
        setNotificationPermission(permission);

        if (permission === 'granted') {
            alert('✅ Notification permission granted! You\'ll now receive browser reminders.');
        } else if (permission === 'denied') {
            alert('❌ Notification permission denied. You can enable it in your browser settings.');
        }
    };

    return (
        <div className="settings-page fade-in">
            <h1>Settings</h1>

            {/* Account */}
            <Card title="Account">
                <div className="settings-section">
                    {user?.displayName && (
                        <div className="setting-item">
                            <div className="setting-info">
                                <div className="setting-label">Display Name</div>
                                <div className="setting-description">
                                    {user.displayName}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Email</div>
                            <div className="setting-description">
                                {user?.email || 'Not logged in'}
                            </div>
                        </div>
                        <Button variant="danger" onClick={handleLogout}>
                            🚪 Logout
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Budget Settings */}
            <Card title="Budget Settings">
                <div className="settings-section">
                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Budget Rollover</div>
                            <div className="setting-description">
                                Carry remaining budget to next month automatically
                            </div>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={budgetRollover}
                                onChange={handleBudgetRolloverChange}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </Card>

            {/* Reminders */}
            <Card title="Daily Reminders">
                <div className="settings-section">
                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Enable Daily Reminders</div>
                            <div className="setting-description">
                                Get reminded to log your daily transactions
                            </div>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={reminderSettings.enabled}
                                onChange={handleReminderToggle}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    {reminderSettings.enabled && (
                        <>
                            <div className="setting-item">
                                <div className="setting-info">
                                    <div className="setting-label">Reminder Time</div>
                                    <div className="setting-description">
                                        Choose when you'd like to be reminded
                                    </div>
                                </div>
                                <select
                                    className="form-select reminder-time-select"
                                    value={reminderSettings.time}
                                    onChange={handleReminderTimeChange}
                                >
                                    {REMINDER_TIMES.map(time => (
                                        <option key={time.value} value={time.value}>
                                            {time.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <div className="setting-label">Email Reminders</div>
                                    <div className="setting-description">
                                        Receive reminder emails (requires Firebase setup)
                                    </div>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={reminderSettings.emailEnabled}
                                        onChange={handleEmailReminderToggle}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <div className="setting-label">Browser Notifications</div>
                                    <div className="setting-description">
                                        Show notifications when app is open
                                        {notificationPermission === 'granted' && ' ✅'}
                                        {notificationPermission === 'denied' && ' ❌'}
                                        {notificationPermission === 'default' && ' ⚠️ Permission needed'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={reminderSettings.browserNotificationEnabled}
                                            onChange={handleBrowserNotificationToggle}
                                            disabled={!isNotificationSupported()}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    {notificationPermission !== 'granted' && isNotificationSupported() && (
                                        <Button
                                            variant="secondary"
                                            onClick={handleRequestNotificationPermission}
                                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                        >
                                            Enable Notifications
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Card>

            {/* SMS Parser Training */}
            <SMSParserTraining />

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

                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Font Size</div>
                            <div className="setting-description">
                                Adjust text size for better readability (Current: {currentSize.label} - {currentSize.scale})
                            </div>
                        </div>
                        <div className="font-size-control">
                            <input
                                type="range"
                                min="0"
                                max="3"
                                value={Object.keys(fontSizes).indexOf(fontSize)}
                                onChange={(e) => {
                                    const keys = Object.keys(fontSizes);
                                    setFontSize(keys[e.target.value]);
                                }}
                                className="font-size-slider"
                            />
                            <div className="font-size-labels">
                                {Object.entries(fontSizes).map(([key, value]) => (
                                    <button
                                        key={key}
                                        className={`font-size-option ${fontSize === key ? 'active' : ''}`}
                                        onClick={() => setFontSize(key)}
                                    >
                                        {value.label}
                                    </button>
                                ))}
                            </div>
                        </div>
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
                        <h3>Spendex - Budget & Money Manager</h3>
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
