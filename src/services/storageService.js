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

export function getDailyReminderSettings() {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_REMINDER);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse reminder settings:', e);
        }
    }
    // Default settings
    return {
        enabled: false,
        time: '20:00', // 8:00 PM default
        lastShown: null,
        emailEnabled: true,
        browserNotificationEnabled: true
    };
}

export function setDailyReminderSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.DAILY_REMINDER, JSON.stringify(settings));
}

export function getWhatsAppSettings() {
    const saved = localStorage.getItem(STORAGE_KEYS.WHATSAPP_REMINDER);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse WhatsApp settings:', e);
        }
    }
    // Default settings
    return {
        userWhatsappNumber: '',
        whatsappRemindersEnabled: false,
        reminderTime: '09:00',
        reminderCycleHours: 24,
        reminderDaysBefore: 3,
        lastPopupShown: null
    };
}

export function setWhatsAppSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_REMINDER, JSON.stringify(settings));
}

// Initialize theme on app load
export function initializeTheme() {
    const theme = getTheme();
    document.documentElement.setAttribute('data-theme', theme);
}

