/**
 * WhatsApp Reminder Service
 * Manages reminder scheduling and logic for WhatsApp reminders
 */

/**
 * Get pending reminders that need to be sent
 * @param {Array} friends - All friends
 * @param {Object} settings - Reminder settings
 * @returns {Object} Pending reminders for lending and borrowing
 */
export async function getPendingReminders(friends, settings) {
    if (!settings?.whatsappRemindersEnabled) {
        return { lending: [], borrowing: [] };
    }

    const now = new Date();
    const lending = [];
    const borrowing = [];

    friends.forEach(friend => {
        // Check if friend has WhatsApp number
        if (!friend.whatsapp_number) return;

        // Check lending (money lent to friend - positive balance)
        if (friend.balance > 0 && friend.return_date) {
            const dueDate = new Date(friend.return_date);
            const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

            // Check if within reminder window
            if (daysUntilDue <= settings.reminderDaysBefore && daysUntilDue >= 0) {
                // Check if reminder was sent recently
                if (shouldSendReminder(friend.last_reminder_sent, settings.reminderCycleHours)) {
                    lending.push(friend);
                }
            }
        }

        // Check borrowing (money borrowed from friend - negative balance)
        if (friend.balance < 0 && friend.return_date) {
            const dueDate = new Date(friend.return_date);
            const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

            // Check if within reminder window
            if (daysUntilDue <= settings.reminderDaysBefore && daysUntilDue >= 0) {
                if (shouldSendReminder(friend.last_reminder_sent, settings.reminderCycleHours)) {
                    borrowing.push(friend);
                }
            }
        }
    });

    return { lending, borrowing };
}

/**
 * Check if reminder should be sent based on cycle
 * @param {string} lastSent - Last sent timestamp
 * @param {number} cycleHours - Minimum hours between reminders
 * @returns {boolean} True if reminder should be sent
 */
function shouldSendReminder(lastSent, cycleHours) {
    if (!lastSent) return true;

    const lastSentDate = new Date(lastSent);
    const now = new Date();
    const hoursSinceLastSent = (now - lastSentDate) / (1000 * 60 * 60);

    return hoursSinceLastSent >= cycleHours;
}

/**
 * Check if it's time to show reminders based on user's set time
 * @param {Object} settings - Reminder settings
 * @returns {boolean} True if it's reminder time
 */
export function isReminderTime(settings) {
    if (!settings?.reminderTime) return false;

    const now = new Date();
    const [hours, minutes] = settings.reminderTime.split(':').map(Number);

    return now.getHours() === hours && now.getMinutes() === minutes;
}

/**
 * Get overdue friends (past due date)
 * @param {Array} friends - All friends
 * @returns {Object} Overdue lending and borrowing
 */
export function getOverdueFriends(friends) {
    const now = new Date();
    const lending = [];
    const borrowing = [];

    friends.forEach(friend => {
        if (!friend.return_date) return;

        const dueDate = new Date(friend.return_date);
        const isOverdue = dueDate < now;

        if (!isOverdue) return;

        // Lending - friend owes money
        if (friend.balance > 0 && friend.whatsapp_number) {
            lending.push(friend);
        }

        // Borrowing - user owes money
        if (friend.balance < 0 && friend.whatsapp_number) {
            borrowing.push(friend);
        }
    });

    return { lending, borrowing };
}

/**
 * Calculate days until due date
 * @param {string} dueDate - Due date (ISO string)
 * @returns {number} Days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate) {
    if (!dueDate) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Check if should show reminder popup on login
 * @param {Object} settings - Reminder settings
 * @param {string} lastShown - Last time popup was shown
 * @returns {boolean} True if should show popup
 */
export function shouldShowReminderPopup(settings, lastShown) {
    if (!settings?.whatsappRemindersEnabled) return false;

    // Don't show if already shown today
    if (lastShown) {
        const lastShownDate = new Date(lastShown);
        const today = new Date();

        if (lastShownDate.toDateString() === today.toDateString()) {
            return false;
        }
    }

    return true;
}
