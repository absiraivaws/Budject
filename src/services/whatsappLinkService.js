/**
 * WhatsApp Link Service
 * Generates WhatsApp Web links with pre-filled messages
 */

import { formatCurrency } from '../utils/currency.js';
import { formatDate } from '../utils/dateUtils.js';

/**
 * Generate WhatsApp link with pre-filled message
 * @param {string} phoneNumber - Phone number (will be cleaned to digits only)
 * @param {string} message - Pre-filled message
 * @returns {string} WhatsApp link
 */
export function generateWhatsAppLink(phoneNumber, message) {
    // Remove all non-digit characters from phone number
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Generate WhatsApp Web link
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}

/**
 * Generate reminder message for friend who owes money (lending)
 * @param {string} friendName - Friend's name
 * @param {number} amount - Amount owed
 * @param {string} dueDate - Due date (ISO string)
 * @param {string} currency - Currency code
 * @returns {string} Formatted reminder message
 */
export function generateLendingReminderMessage(friendName, amount, dueDate, currency) {
    const amountStr = formatCurrency(amount, currency);
    const dueDateStr = dueDate ? formatDate(dueDate, 'short') : null;

    let message = `Hi ${friendName},\n\n`;
    message += `💰 This is a friendly reminder about the ${amountStr} you borrowed.\n\n`;

    if (dueDateStr) {
        message += `📅 Due date: ${dueDateStr}\n\n`;
    }

    message += `Please let me know when you can repay.\n\n`;
    message += `Thank you! 🙏`;

    return message;
}

/**
 * Generate reminder message for user about borrowed money (borrowing)
 * @param {string} friendName - Friend's name
 * @param {number} amount - Amount borrowed
 * @param {string} dueDate - Due date (ISO string)
 * @param {string} currency - Currency code
 * @returns {string} Formatted reminder message
 */
export function generateBorrowingReminderMessage(friendName, amount, dueDate, currency) {
    const amountStr = formatCurrency(Math.abs(amount), currency);
    const dueDateStr = dueDate ? formatDate(dueDate, 'short') : null;

    let message = `Hi ${friendName},\n\n`;
    message += `💸 I wanted to remind you about the ${amountStr} I borrowed from you.\n\n`;

    if (dueDateStr) {
        message += `📅 Due date: ${dueDateStr}\n\n`;
    }

    message += `I'll arrange to repay soon.\n\n`;
    message += `Thanks for your patience! 🙏`;

    return message;
}

/**
 * Open WhatsApp with pre-filled message
 * @param {string} phoneNumber - Phone number
 * @param {string} message - Pre-filled message
 */
export function openWhatsAppLink(phoneNumber, message) {
    const link = generateWhatsAppLink(phoneNumber, message);
    window.open(link, '_blank');
}

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid
 */
export function isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;

    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

    // Check if it has at least 10 digits (minimum for most countries)
    return cleanNumber.length >= 10;
}

/**
 * Format phone number for display
 * @param {string} phoneNumber - Phone number
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';

    // If it starts with +, keep it, otherwise just return as is
    return phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
}
