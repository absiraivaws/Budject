import { createContext, useContext, useState, useEffect } from 'react';

const FontSizeContext = createContext();

const FONT_SIZES = {
    small: { label: 'Small', value: 0.875, scale: '87.5%' },
    medium: { label: 'Medium', value: 1, scale: '100%' },
    large: { label: 'Large', value: 1.125, scale: '112.5%' },
    xlarge: { label: 'Extra Large', value: 1.25, scale: '125%' }
};

export function FontSizeProvider({ children }) {
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('fontSize');
        return saved || 'medium';
    });

    useEffect(() => {
        // Apply font size to document root
        const size = FONT_SIZES[fontSize];
        document.documentElement.style.fontSize = `${size.value}rem`;
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    const value = {
        fontSize,
        setFontSize,
        fontSizes: FONT_SIZES,
        currentSize: FONT_SIZES[fontSize]
    };

    return (
        <FontSizeContext.Provider value={value}>
            {children}
        </FontSizeContext.Provider>
    );
}

export function useFontSize() {
    const context = useContext(FontSizeContext);
    if (!context) {
        throw new Error('useFontSize must be used within FontSizeProvider');
    }
    return context;
}
