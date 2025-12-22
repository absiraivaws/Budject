import { useState } from 'react';
import { COLOR_PALETTE } from '../../config/constants.js';
import './ColorPicker.css';

export default function ColorPicker({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (color) => {
        onChange(color);
        setIsOpen(false);
    };

    return (
        <div className="color-picker">
            <button
                type="button"
                className="color-picker-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span
                    className="color-picker-swatch"
                    style={{ background: value || COLOR_PALETTE[0] }}
                ></span>
                <span className="color-picker-arrow">▼</span>
            </button>

            {isOpen && (
                <div className="color-picker-dropdown">
                    <div className="color-picker-grid">
                        {COLOR_PALETTE.map((color, index) => (
                            <button
                                key={index}
                                type="button"
                                className={`color-picker-option ${value === color ? 'selected' : ''}`}
                                style={{ background: color }}
                                onClick={() => handleSelect(color)}
                                title={color}
                            >
                                {value === color && <span className="color-picker-check">✓</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
