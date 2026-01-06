/**
 * Date utility functions
 */

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('short', 'medium', 'long')
 * @returns {string} Formatted date
 */
export function formatDate(date, format = 'medium') {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const options = {
        short: { month: 'short', day: 'numeric' },
        medium: { month: 'short', day: 'numeric', year: 'numeric' },
        long: { month: 'long', day: 'numeric', year: 'numeric' },
        full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
        monthYear: { month: 'long', year: 'numeric' }
    };

    return d.toLocaleDateString('en-US', options[format] || options.medium);
}

/**
 * Get date in YYYY-MM-DD format
 * @param {Date|string} date - Date
 * @returns {string} Date string
 */
export function getDateString(date = new Date()) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

/**
 * Get start of month
 * @param {Date|string} date - Date
 * @returns {Date} Start of month
 */
export function getStartOfMonth(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Get end of month
 * @param {Date|string} date - Date
 * @returns {Date} End of month
 */
export function getEndOfMonth(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

/**
 * Get month name
 * @param {number} monthIndex - Month index (0-11)
 * @returns {string} Month name
 */
export function getMonthName(monthIndex) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
}

/**
 * Get days in month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {number} Number of days
 */
export function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Get calendar grid for month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {Array} Calendar grid
 */
export function getCalendarGrid(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    const grid = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        grid.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        grid.push(new Date(year, month, day));
    }

    return grid;
}

/**
 * Check if two dates are the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same day
 */
export function isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

/**
 * Get relative time string
 * @param {Date|string} date - Date
 * @returns {string} Relative time (e.g., "2 days ago")
 */
export function getRelativeTime(date) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Add months to a date
 * @param {Date} date - Starting date
 * @param {number} months - Number of months to add (can be negative)
 * @returns {Date} New date
 */
export function addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

/**
 * Generate calendar grid for a month
 * @param {Date} date - Date in the month to generate calendar for
 * @returns {Array<Array>} 2D array of calendar weeks
 */
export function generateCalendar(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar = [];
    let week = [];

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        week.push({
            date: new Date(year, month - 1, prevMonthLastDay - i),
            isCurrentMonth: false
        });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        week.push({
            date: new Date(year, month, day),
            isCurrentMonth: true
        });

        if (week.length === 7) {
            calendar.push(week);
            week = [];
        }
    }

    // Add days from next month
    if (week.length > 0) {
        let nextMonthDay = 1;
        while (week.length < 7) {
            week.push({
                date: new Date(year, month + 1, nextMonthDay),
                isCurrentMonth: false
            });
            nextMonthDay++;
        }
        calendar.push(week);
    }

    return calendar;
}

