import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext.jsx';
import './SideNav.css';

const navSections = [
    {
        title: 'Overview',
        items: [
            { path: '/', icon: '🏠', label: 'Dashboard' }
        ]
    },
    {
        title: 'Transactions',
        items: [
            { path: '/transactions', icon: '💳', label: 'All Transactions' },
            { path: '/accounts', icon: '🏦', label: 'Accounts' },
            { path: '/categories', icon: '📁', label: 'Categories' }
        ]
    },
    {
        title: 'Planning',
        items: [
            { path: '/budgets', icon: '📊', label: 'Budgets' },
            { path: '/calendar', icon: '📅', label: 'Calendar' },
            { path: '/recurring', icon: '🔄', label: 'Recurring' }
        ]
    },
    {
        title: 'Analysis',
        items: [
            { path: '/reports', icon: '📈', label: 'Reports' },
            { path: '/assets', icon: '💎', label: 'Assets & Liabilities' }
        ]
    }
];

export default function SideNav() {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    return (
        <aside className="side-nav">
            <div className="side-nav-header">
                <h2 className="side-nav-logo">💰 Budject</h2>
            </div>

            <nav className="side-nav-content">
                {navSections.map((section) => (
                    <div key={section.title} className="side-nav-section">
                        <h3 className="side-nav-section-title">{section.title}</h3>
                        {section.items.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`side-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                <span className="side-nav-icon">{item.icon}</span>
                                <span className="side-nav-label">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="side-nav-footer">
                <button className="side-nav-item" onClick={toggleTheme}>
                    <span className="side-nav-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
                    <span className="side-nav-label">
                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </span>
                </button>
                <Link to="/settings" className="side-nav-item">
                    <span className="side-nav-icon">⚙️</span>
                    <span className="side-nav-label">Settings</span>
                </Link>
            </div>
        </aside>
    );
}
