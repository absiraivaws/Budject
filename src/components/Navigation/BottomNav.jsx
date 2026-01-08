import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

const navItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/transactions', icon: '💳', label: 'Transactions' },
    { path: '/friends', icon: '👥', label: 'Friends' },
    { path: '/budgets', icon: '📊', label: 'Budgets' },
    { path: '/settings', icon: '⚙️', label: 'Settings' }
];

export default function BottomNav() {
    const location = useLocation();

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                    <span className="bottom-nav-icon">{item.icon}</span>
                    <span className="bottom-nav-label">{item.label}</span>
                </Link>
            ))}
        </nav>
    );
}
