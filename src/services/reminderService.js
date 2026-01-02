import { getAllTransactions } from './db.js';

/**
 * Reminder Service
 * Handles logic for determining when to show reminders
 */

/**
 * Check if user has logged any transactions today
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} - True if user has transactions today
 */
export async function hasTransactionsToday(userId) {
    try {
        const transactions = await getAllTransactions();

        // Get today's date range (start and end of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayEnd = tomorrow.getTime();

        // Check if any transaction was created today
        const hasToday = transactions.some(transaction => {
            const transactionDate = new Date(transaction.date).getTime();
            return transactionDate >= todayStart && transactionDate < todayEnd;
        });

        return hasToday;
    } catch (error) {
        console.error('Error checking transactions:', error);
        return false; // Assume no transactions on error
    }
}

/**
 * Check if reminder should be shown based on settings
 * @param {Object} settings - Reminder settings
 * @returns {boolean} - True if reminder should be shown
 */
export function shouldShowReminder(settings) {
    if (!settings || !settings.enabled) {
        return false;
    }

    // Check if we've already shown the reminder today
    if (settings.lastShown) {
        const lastShown = new Date(settings.lastShown);
        const today = new Date();

        // If last shown was today, don't show again
        if (lastShown.toDateString() === today.toDateString()) {
            return false;
        }
    }

    // Check if current time is past the reminder time
    const now = new Date();
    const [hours, minutes] = settings.time.split(':').map(Number);

    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    return now >= reminderTime;
}

/**
 * Get user's preferred reminder time
 * @param {Object} settings - Reminder settings
 * @returns {string} - Time in HH:MM format
 */
export function getReminderTime(settings) {
    return settings?.time || '20:00';
}

/**
 * Mark that reminder was shown
 * @param {Object} settings - Current reminder settings
 * @returns {Object} - Updated settings
 */
export function markReminderShown(settings) {
    return {
        ...settings,
        lastShown: new Date().toISOString()
    };
}

/**
 * Check if user just logged in (within last 5 seconds)
 * @param {number} loginTimestamp - Login timestamp
 * @returns {boolean} - True if just logged in
 */
export function isRecentLogin(loginTimestamp) {
    if (!loginTimestamp) return false;

    const now = Date.now();
    const fiveSecondsAgo = now - 5000;

    return loginTimestamp > fiveSecondsAgo;
}
