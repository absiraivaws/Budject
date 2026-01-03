/**
 * Notification Service
 * Handles browser notifications for daily reminders
 */

let notificationPermission = 'default';

/**
 * Initialize notification service
 */
export function initNotificationService() {
    if ('Notification' in window) {
        notificationPermission = Notification.permission;
    }
}

/**
 * Request notification permission from user
 * @returns {Promise<string>} - Permission status: 'granted', 'denied', or 'default'
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return 'denied';
    }

    try {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
        return permission;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
    }
}

/**
 * Get current notification permission status
 * @returns {string} - Permission status
 */
export function getNotificationPermission() {
    if ('Notification' in window) {
        return Notification.permission;
    }
    return 'denied';
}

/**
 * Show daily reminder notification
 * @param {Function} onClickCallback - Callback when notification is clicked
 */
export function showDailyReminder(onClickCallback) {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return;
    }

    if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
    }

    try {
        const notification = new Notification('💰 Time to Log Your Expenses!', {
            body: "Haven't logged any transactions today. Take a moment to track your spending.",
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'daily-reminder',
            requireInteraction: false,
            silent: false
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
            if (onClickCallback) {
                onClickCallback();
            }
        };

        // Auto-close after 10 seconds
        setTimeout(() => {
            notification.close();
        }, 10000);

    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

/**
 * Check if browser supports notifications
 * @returns {boolean} - True if supported
 */
export function isNotificationSupported() {
    return 'Notification' in window;
}

/**
 * Check and show reminder if conditions are met
 * @param {Object} settings - Reminder settings
 * @param {boolean} hasTransactions - Whether user has transactions today
 * @param {Function} onClickCallback - Callback when notification is clicked
 * @returns {boolean} - True if reminder was shown
 */
export function checkAndShowReminder(settings, hasTransactions, onClickCallback) {
    // Don't show if disabled
    if (!settings?.enabled || !settings?.browserNotificationEnabled) {
        return false;
    }

    // Don't show if user already has transactions
    if (hasTransactions) {
        return false;
    }

    // Don't show if already shown today
    if (settings.lastShown) {
        const lastShown = new Date(settings.lastShown);
        const today = new Date();

        if (lastShown.toDateString() === today.toDateString()) {
            return false;
        }
    }

    // Check if it's past the reminder time
    const now = new Date();
    const [hours, minutes] = settings.time.split(':').map(Number);

    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    if (now < reminderTime) {
        return false;
    }

    // Show the notification
    showDailyReminder(onClickCallback);
    return true;
}
