import { useState } from 'react';
import { ICON_SET } from '../../config/constants.js';
import './IconPicker.css';

export default function IconPicker({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (icon) => {
        onChange(icon);
        setIsOpen(false);
    };

    return (
        <div className="icon-picker">
            <button
                type="button"
                className="icon-picker-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="icon-picker-selected">{value || '📁'}</span>
                <span className="icon-picker-arrow">▼</span>
            </button>

            {isOpen && (
                <div className="icon-picker-dropdown">
                    <div className="icon-picker-grid">
                        {ICON_SET.map((icon, index) => (
                            <button
                                key={index}
                                type="button"
                                className={`icon-picker-option ${value === icon ? 'selected' : ''}`}
                                onClick={() => handleSelect(icon)}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
