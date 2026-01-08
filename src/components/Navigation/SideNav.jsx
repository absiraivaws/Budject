import { useState } from 'react';
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
            { path: '/categories', icon: '📁', label: 'Categories' },
            { path: '/friends', icon: '👥', label: 'Friends' }
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

export default function SideNav({ onNavigate }) {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [expandedSections, setExpandedSections] = useState({
        'Overview': true,
        'Transactions': true,
        'Planning': true,
        'Analysis': true
    });

    const handleNavClick = () => {
        if (onNavigate) {
            onNavigate();
        }
    };

    const toggleSection = (title) => {
        setExpandedSections(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    return (
        <aside className="side-nav">
            <div className="side-nav-header">
                <h2 className="side-nav-logo">💰 Spendex</h2>
            </div>

            <nav className="side-nav-content">
                {navSections.map((section) => (
                    <div key={section.title} className="side-nav-section">
                        <div
                            className="side-nav-section-header"
                            onClick={() => toggleSection(section.title)}
                        >
                            <h3 className="side-nav-section-title">{section.title}</h3>
                            <span className={`section-chevron ${expandedSections[section.title] ? 'expanded' : ''}`}>
                                ▼
                            </span>
                        </div>
                        <div className={`side-nav-section-items ${expandedSections[section.title] ? 'expanded' : 'collapsed'}`}>
                            {section.items.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`side-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                                    onClick={handleNavClick}
                                >
                                    <span className="side-nav-icon">{item.icon}</span>
                                    <span className="side-nav-label">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="side-nav-footer">
                <Link to="/settings" className="side-nav-item" onClick={handleNavClick}>
                    <span className="side-nav-icon">⚙️</span>
                    <span className="side-nav-label">Settings</span>
                </Link>
            </div>
        </aside>
    );
}
