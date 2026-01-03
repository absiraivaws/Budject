import React from 'react';
import './ThemeToggle.css';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        >
            {theme === 'dark' ? '🌙' : '☀️'}
        </button>
    );
}
