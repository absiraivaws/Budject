import { CURRENCIES } from '../config/constants.js';

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code (e.g., 'LKR', 'USD')
 * @param {boolean} compact - Use compact format (e.g., 1.2K instead of 1,200.00)
 * @returns {string} Formatted amount
 */
export function formatCurrency(amount, currencyCode = 'LKR', compact = false) {
    if (amount === undefined || amount === null || isNaN(amount)) return '0.00';
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    if (!currency) return `${Number(amount).toFixed(2)}`;

    let formattedAmount;
    if (compact && Math.abs(amount) >= 1000) {
        const absAmount = Math.abs(amount);
        if (absAmount >= 1000000) {
            formattedAmount = (absAmount / 1000000).toFixed(1) + 'M';
        } else {
            formattedAmount = (absAmount / 1000).toFixed(1) + 'K';
        }
    } else {
        formattedAmount = Math.abs(amount).toLocaleString('en-US', {
            minimumFractionDigits: compact ? 0 : 2,
            maximumFractionDigits: compact ? 0 : 2
        });
    }

    const sign = amount < 0 ? '-' : '';
    return `${sign}${currency.symbol} ${formattedAmount}`;
}

/**
 * Parse currency string to number
 * @param {string} value - Currency string
 * @returns {number} Parsed number
 */
export function parseCurrency(value) {
    if (typeof value === 'number') return value;
    const cleaned = value.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
}

/**
 * Get currency symbol
 * @param {string} currencyCode - Currency code
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currencyCode) {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    return currency ? currency.symbol : '';
}
