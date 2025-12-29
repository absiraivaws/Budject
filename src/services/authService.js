import { getUserByEmail, addUser, updateUser } from './db.js';

/**
 * Simple hash function for PIN (client-side only)
 * Note: This is not cryptographically secure, but suitable for a client-side budget app
 */
function hashPIN(pin) {
    let hash = 0;
    const str = `budject_${pin}_salt`;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate PIN (must be exactly 4 digits)
 */
function isValidPIN(pin) {
    return /^\d{4}$/.test(pin);
}

/**
 * Register a new user
 */
export async function register(email, pin, securityQuestion = '', securityAnswer = '') {
    // Validate email
    if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
    }

    // Validate PIN
    if (!isValidPIN(pin)) {
        throw new Error('PIN must be exactly 4 digits');
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email.toLowerCase());
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Create new user
    const hashedPIN = hashPIN(pin);
    const hashedAnswer = securityAnswer ? hashPIN(securityAnswer.toLowerCase()) : '';

    const user = await addUser({
        email: email.toLowerCase(),
        pin: hashedPIN,
        security_question: securityQuestion,
        security_answer: hashedAnswer
    });

    // Store session
    storeSession(user);

    return {
        id: user.id,
        email: user.email
    };
}

/**
 * Login user
 */
export async function login(email, pin) {
    // Validate inputs
    if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
    }

    if (!isValidPIN(pin)) {
        throw new Error('PIN must be exactly 4 digits');
    }

    // Get user
    const user = await getUserByEmail(email.toLowerCase());
    if (!user) {
        throw new Error('Invalid email or PIN');
    }

    // Verify PIN
    const hashedPIN = hashPIN(pin);
    if (user.pin !== hashedPIN) {
        throw new Error('Invalid email or PIN');
    }

    // Update last login
    await updateUser(user.id, { last_login: new Date().toISOString() });

    // Store session
    storeSession(user);

    return {
        id: user.id,
        email: user.email
    };
}

/**
 * Logout user
 */
export function logout() {
    localStorage.removeItem('budject_user');
    localStorage.removeItem('budject_session');
}

/**
 * Get current user from session
 */
export function getCurrentUser() {
    const userStr = localStorage.getItem('budject_user');
    if (!userStr) return null;

    try {
        return JSON.parse(userStr);
    } catch (error) {
        return null;
    }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
    return getCurrentUser() !== null;
}

/**
 * Store user session
 */
function storeSession(user) {
    const sessionData = {
        id: user.id,
        email: user.email,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('budject_user', JSON.stringify(sessionData));
    localStorage.setItem('budject_session', 'active');
}

/**
 * Reset password using security question
 */
export async function resetPassword(email, securityAnswer, newPIN) {
    // Validate inputs
    if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
    }

    if (!isValidPIN(newPIN)) {
        throw new Error('PIN must be exactly 4 digits');
    }

    // Get user
    const user = await getUserByEmail(email.toLowerCase());
    if (!user) {
        throw new Error('User not found');
    }

    // Check if user has security question
    if (!user.security_question || !user.security_answer) {
        throw new Error('No security question set for this account');
    }

    // Verify security answer
    const hashedAnswer = hashPIN(securityAnswer.toLowerCase());
    if (user.security_answer !== hashedAnswer) {
        throw new Error('Incorrect security answer');
    }

    // Update PIN
    const hashedPIN = hashPIN(newPIN);
    await updateUser(user.id, { pin: hashedPIN });

    return true;
}

/**
 * Change PIN (when user is logged in)
 */
export async function changePIN(email, oldPIN, newPIN) {
    // Validate inputs
    if (!isValidPIN(oldPIN) || !isValidPIN(newPIN)) {
        throw new Error('PIN must be exactly 4 digits');
    }

    // Get user
    const user = await getUserByEmail(email.toLowerCase());
    if (!user) {
        throw new Error('User not found');
    }

    // Verify old PIN
    const hashedOldPIN = hashPIN(oldPIN);
    if (user.pin !== hashedOldPIN) {
        throw new Error('Incorrect current PIN');
    }

    // Update PIN
    const hashedNewPIN = hashPIN(newPIN);
    await updateUser(user.id, { pin: hashedNewPIN });

    return true;
}
