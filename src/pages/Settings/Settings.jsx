import { useCurrency } from '../../context/CurrencyContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { CURRENCIES } from '../../config/constants.js';

export default function Settings() {
    const { currency, setCurrency } = useCurrency();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="fade-in">
            <h1>Settings</h1>

            <div className="card" style={{ maxWidth: '600px' }}>
                <h3>Appearance</h3>
                <div className="form-group">
                    <label className="form-label">Theme</label>
                    <button className="btn btn-secondary" onClick={toggleTheme}>
                        {theme === 'light' ? '🌙 Switch to Dark Mode' : '☀️ Switch to Light Mode'}
                    </button>
                </div>
            </div>

            <div className="card" style={{ maxWidth: '600px', marginTop: 'var(--spacing-lg)' }}>
                <h3>Currency</h3>
                <div className="form-group">
                    <label className="form-label">Default Currency</label>
                    <select
                        className="form-select"
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

            <div className="card" style={{ maxWidth: '600px', marginTop: 'var(--spacing-lg)' }}>
                <h3>Data Management</h3>
                <p className="text-secondary">Import/export and data reset features coming soon...</p>
            </div>
        </div>
    );
}
