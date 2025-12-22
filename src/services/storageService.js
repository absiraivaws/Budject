import { STORAGE_KEYS } from '../config/constants.js';

/**
 * LocalStorage Service for app settings and preferences
 */

export function getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
}

export function setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
}

export function getCurrency() {
    return localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'LKR';
}

export function setCurrency(currency) {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
}

export function getLanguage() {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';
}

export function setLanguage(language) {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
}

// Initialize theme on app load
export function initializeTheme() {
    const theme = getTheme();
    document.documentElement.setAttribute('data-theme', theme);
}
