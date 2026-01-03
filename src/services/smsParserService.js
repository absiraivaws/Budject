import { STORAGE_KEYS } from '../config/constants.js';

/**
 * SMS Parser Service
 * Extracts transaction data from bank SMS/Email notifications
 */

// Bank-specific SMS patterns for Sri Lankan banks
const SRI_LANKAN_BANK_PATTERNS = {
    peoples_bank: {
        name: 'Peoples Bank',
        patterns: {
            credit: /credited by Rs\.?\s*([\d,]+\.?\d*)/i,
            debit: /debited by Rs\.?\s*([\d,]+\.?\d*)/i,
            account: /A\/C\s*\(([^)]+)\)|account\s*([^\s]+)/i,
            date: /(\d{2}\/\d{2}\/\d{4})/,
            time: /(\d{2}:\d{2})/,
            description: /\((.*?)\s+at\s+\d{2}:\d{2}|\((.*?)\)/i,
            balance: /balance[:\s]*Rs\.?\s*([\d,]+\.?\d*)/i
        }
    },
    sampath_bank: {
        name: 'Sampath Bank',
        patterns: {
            credit: /LKR\s*([\d,]+\.?\d*)\s*credited/i,
            debit: /LKR\s*([\d,]+\.?\d*)\s*debited/i,
            account: /AC\s*\*\*(\d{4})|account\s*\*\*(\d{4})/i,
            description: /(?:credited|debited)\s+to\s+AC[^f]*for\s+(.+?)(?:\s*-|\s*$)/i,
            balance: /balance[:\s]*LKR\s*([\d,]+\.?\d*)/i
        }
    },
    commercial_bank: {
        name: 'Commercial Bank',
        patterns: {
            credit: /credited.*?Rs\.?\s*([\d,]+\.?\d*)|Rs\.?\s*([\d,]+\.?\d*).*?credited/i,
            debit: /debited.*?Rs\.?\s*([\d,]+\.?\d*)|Rs\.?\s*([\d,]+\.?\d*).*?debited/i,
            account: /A\/C\s*([^\s]+)|\*\*(\d{4})/i,
            date: /(\d{2}[-\/]\d{2}[-\/]\d{4})/,
            balance: /(?:available|avl)\s*(?:bal|balance)[:\s]*Rs\.?\s*([\d,]+\.?\d*)/i
        }
    },
    bank_of_ceylon: {
        name: 'Bank of Ceylon',
        patterns: {
            credit: /credited.*?Rs\.?\s*([\d,]+\.?\d*)/i,
            debit: /debited.*?Rs\.?\s*([\d,]+\.?\d*)/i,
            account: /A\/C\s*([^\s]+)|\*\*(\d{4})/i,
            date: /(\d{2}\/\d{2}\/\d{4})/,
            balance: /balance[:\s]*Rs\.?\s*([\d,]+\.?\d*)/i
        }
    },
    // Generic patterns for other banks
    generic: {
        name: 'Generic',
        patterns: {
            credit: /credited?.*?(?:Rs\.?|LKR)\s*([\d,]+\.?\d*)|(?:Rs\.?|LKR)\s*([\d,]+\.?\d*).*?credited?/i,
            debit: /debited?.*?(?:Rs\.?|LKR)\s*([\d,]+\.?\d*)|(?:Rs\.?|LKR)\s*([\d,]+\.?\d*).*?debited?/i,
            account: /A\/C\s*([^\s]+)|\*\*(\d{4})|account\s*([^\s]+)/i,
            date: /(\d{2}[-\/]\d{2}[-\/]\d{4})/,
            time: /(\d{2}:\d{2})/,
            balance: /(?:balance|bal)[:\s]*(?:Rs\.?|LKR)\s*([\d,]+\.?\d*)/i
        }
    }
};

/**
 * Parse transaction SMS/Email
 * @param {string} text - SMS or email text
 * @param {string} bankId - Bank identifier
 * @returns {Object} Parsed transaction data
 */
export function parseTransactionSMS(text, bankId = 'generic') {
    if (!text || typeof text !== 'string') {
        return null;
    }

    const patterns = SRI_LANKAN_BANK_PATTERNS[bankId] || SRI_LANKAN_BANK_PATTERNS.generic;

    const result = {
        amount: extractAmount(text, patterns),
        type: detectTransactionType(text, patterns),
        date: extractDate(text, patterns),
        time: extractTime(text, patterns),
        account: extractAccountNumber(text, patterns),
        description: extractDescription(text, patterns),
        balance: extractBalance(text, patterns),
        confidence: 0,
        rawText: text
    };

    // Calculate confidence score
    result.confidence = calculateConfidence(result);

    return result;
}

/**
 * Extract amount from SMS
 */
function extractAmount(text, patterns) {
    const creditMatch = text.match(patterns.patterns.credit);
    const debitMatch = text.match(patterns.patterns.debit);

    const match = creditMatch || debitMatch;
    if (match) {
        // Get first non-null capture group
        const amountStr = match[1] || match[2] || match[3];
        if (amountStr) {
            // Remove commas and parse
            return parseFloat(amountStr.replace(/,/g, ''));
        }
    }

    return null;
}

/**
 * Detect transaction type (credit/debit)
 */
function detectTransactionType(text, patterns) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('credited') || lowerText.includes('credit')) {
        return 'income';
    }
    if (lowerText.includes('debited') || lowerText.includes('debit') ||
        lowerText.includes('spent') || lowerText.includes('paid')) {
        return 'expense';
    }

    return null;
}

/**
 * Extract date from SMS
 */
function extractDate(text, patterns) {
    if (!patterns.patterns.date) {
        return new Date().toISOString().split('T')[0];
    }

    const match = text.match(patterns.patterns.date);
    if (match) {
        const dateStr = match[1];
        // Parse DD/MM/YYYY or DD-MM-YYYY
        const parts = dateStr.split(/[-\/]/);
        if (parts.length === 3) {
            const [day, month, year] = parts;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    // Default to today
    return new Date().toISOString().split('T')[0];
}

/**
 * Extract time from SMS
 */
function extractTime(text, patterns) {
    if (!patterns.patterns.time) {
        return null;
    }

    const match = text.match(patterns.patterns.time);
    return match ? match[1] : null;
}

/**
 * Extract account number (last 4 digits)
 */
function extractAccountNumber(text, patterns) {
    const match = text.match(patterns.patterns.account);
    if (match) {
        // Get first non-null capture group
        const accountStr = match[1] || match[2] || match[3];
        if (accountStr) {
            // Extract last 4 digits
            const digits = accountStr.replace(/[^\d]/g, '');
            return digits.slice(-4);
        }
    }

    return null;
}

/**
 * Extract transaction description
 */
function extractDescription(text, patterns) {
    if (!patterns.patterns.description) {
        return null;
    }

    const match = text.match(patterns.patterns.description);
    if (match) {
        const desc = match[1] || match[2];
        return desc ? desc.trim() : null;
    }

    return null;
}

/**
 * Extract available balance
 */
function extractBalance(text, patterns) {
    if (!patterns.patterns.balance) {
        return null;
    }

    const match = text.match(patterns.patterns.balance);
    if (match) {
        const balanceStr = match[1];
        return balanceStr ? parseFloat(balanceStr.replace(/,/g, '')) : null;
    }

    return null;
}

/**
 * Calculate confidence score (0-1)
 */
function calculateConfidence(result) {
    let score = 0;
    let total = 0;

    // Amount is critical
    if (result.amount !== null) {
        score += 3;
    }
    total += 3;

    // Type is critical
    if (result.type !== null) {
        score += 3;
    }
    total += 3;

    // Date
    if (result.date !== null) {
        score += 1;
    }
    total += 1;

    // Account
    if (result.account !== null) {
        score += 2;
    }
    total += 2;

    // Description
    if (result.description !== null) {
        score += 1;
    }
    total += 1;

    return total > 0 ? score / total : 0;
}

/**
 * Match parsed account to user's accounts
 * Supports multiple formats:
 * - Full account number: 044-2001234500
 * - Masked: 044-2001****00, **8399
 * - Last 4 digits: 0000, 8399
 */
export function matchUserAccount(accountLast4, userAccounts) {
    if (!accountLast4 || !userAccounts || userAccounts.length === 0) {
        return null;
    }

    // Find accounts where account number matches
    const matches = userAccounts.filter(account => {
        const accountNumber = account.accountNumber || '';

        if (!accountNumber) {
            return false;
        }

        // Extract all digits from stored account number
        const storedDigits = accountNumber.replace(/[^\d]/g, '');

        // Extract all digits from SMS account pattern
        const smsDigits = accountLast4.replace(/[^\d]/g, '');

        // Match by last 4 digits
        const storedLast4 = storedDigits.slice(-4);
        const smsLast4 = smsDigits.slice(-4);

        if (storedLast4 === smsLast4 && storedLast4.length === 4) {
            return true;
        }

        // Match by full number (if SMS contains full number)
        if (smsDigits.length > 4 && storedDigits === smsDigits) {
            return true;
        }

        // Match by partial masked number (e.g., 044-2001****00)
        // Extract visible digits from both sides
        const smsStart = smsDigits.substring(0, 4);
        const smsEnd = smsDigits.substring(smsDigits.length - 4);
        const storedStart = storedDigits.substring(0, 4);
        const storedEnd = storedDigits.substring(storedDigits.length - 4);

        if (smsStart && smsEnd && smsStart === storedStart && smsEnd === storedEnd) {
            return true;
        }

        return false;
    });

    // Return first match or null
    // If multiple matches, prefer exact full number match
    if (matches.length > 1) {
        const exactMatch = matches.find(account => {
            const storedDigits = (account.accountNumber || '').replace(/[^\d]/g, '');
            const smsDigits = accountLast4.replace(/[^\d]/g, '');
            return storedDigits === smsDigits;
        });
        return exactMatch || matches[0];
    }

    return matches.length > 0 ? matches[0] : null;
}

/**
 * Auto-detect bank from SMS content
 */
export function detectBank(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('peoples bank')) return 'peoples_bank';
    if (lowerText.includes('sampath bank')) return 'sampath_bank';
    if (lowerText.includes('commercial bank')) return 'commercial_bank';
    if (lowerText.includes('bank of ceylon')) return 'bank_of_ceylon';
    if (lowerText.includes('hatton national') || lowerText.includes('hnb')) return 'hatton_national';
    if (lowerText.includes('nations trust')) return 'nations_trust';
    if (lowerText.includes('seylan bank')) return 'seylan_bank';
    if (lowerText.includes('dfcc')) return 'dfcc_bank';
    if (lowerText.includes('pan asia')) return 'pan_asia';
    if (lowerText.includes('ndb') || lowerText.includes('national development')) return 'ndb';

    return 'generic';
}

/**
 * Save training sample
 */
export function saveTrainingSample(bankId, smsText, parsedData, verified = true) {
    const trainingData = getTrainingData();

    if (!trainingData[bankId]) {
        trainingData[bankId] = {
            bankId,
            samples: [],
            accuracy: 0,
            totalSamples: 0,
            successfulParses: 0
        };
    }

    const sample = {
        id: Date.now().toString(),
        rawText: smsText,
        parsedData,
        confidence: parsedData.confidence,
        verified,
        timestamp: new Date().toISOString()
    };

    trainingData[bankId].samples.push(sample);
    trainingData[bankId].totalSamples++;

    if (verified && parsedData.confidence > 0.7) {
        trainingData[bankId].successfulParses++;
    }

    // Update accuracy
    trainingData[bankId].accuracy =
        trainingData[bankId].totalSamples > 0
            ? trainingData[bankId].successfulParses / trainingData[bankId].totalSamples
            : 0;

    localStorage.setItem(STORAGE_KEYS.SMS_TRAINING_DATA, JSON.stringify(trainingData));

    return trainingData[bankId];
}

/**
 * Get training data for a bank
 */
export function getTrainingData(bankId = null) {
    const data = localStorage.getItem(STORAGE_KEYS.SMS_TRAINING_DATA);
    const trainingData = data ? JSON.parse(data) : {};

    return bankId ? trainingData[bankId] || null : trainingData;
}

/**
 * Get parsing accuracy for a bank
 */
export function getParsingAccuracy(bankId) {
    const data = getTrainingData(bankId);
    return data ? data.accuracy : 0;
}

/**
 * Get total training samples for a bank
 */
export function getTrainingSampleCount(bankId) {
    const data = getTrainingData(bankId);
    return data ? data.totalSamples : 0;
}

/**
 * Parse multiple SMS (batch import)
 */
export function parseBatchSMS(smsArray, bankId = null) {
    return smsArray.map(sms => {
        const detectedBank = bankId || detectBank(sms);
        return parseTransactionSMS(sms, detectedBank);
    }).filter(result => result && result.amount !== null);
}
