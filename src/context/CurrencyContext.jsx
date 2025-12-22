import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrency, setCurrency as saveCurrency } from '../services/storageService.js';
import { DEFAULT_CURRENCY } from '../config/constants.js';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
    const [currency, setCurrencyState] = useState(getCurrency() || DEFAULT_CURRENCY);

    const setCurrency = (newCurrency) => {
        setCurrencyState(newCurrency);
        saveCurrency(newCurrency);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within CurrencyProvider');
    }
    return context;
}
