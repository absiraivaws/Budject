// Application Constants

export const ACCOUNT_TYPES = [
  { id: 'cash', label: 'Cash', icon: '💵', hasInterest: false },
  { id: 'bank', label: 'Bank Account', icon: '🏦', hasInterest: false },
  { id: 'savings', label: 'Savings Account', icon: '💎', hasInterest: true },
  { id: 'current', label: 'Current Account', icon: '🏛️', hasInterest: false },
  { id: 'fixed_deposit', label: 'Fixed Deposit', icon: '📊', hasInterest: true },
  { id: 'card', label: 'Credit Card', icon: '💳', hasInterest: true },
  { id: 'ewallet', label: 'E-Wallet', icon: '📱', hasInterest: false },
  { id: 'loan', label: 'Loan', icon: '💰', hasInterest: true }
];

export const LOAN_TYPES = [
  { id: 'bank_loan', label: 'Bank Loan', icon: '🏦' },
  { id: 'leasing', label: 'Leasing', icon: '🚗' },
  { id: 'pawning', label: 'Pawning', icon: '💍' },
  { id: 'friends', label: 'Friends', icon: '👥' },
  { id: 'private', label: 'Private', icon: '🤝' }
];

export const INTEREST_FREQUENCIES = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'annually', label: 'Annually' }
];

export const FD_PAYOUT_TYPES = [
  { id: 'maturity', label: 'At Maturity' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'annually', label: 'Annually' }
];


export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer'
};

export const RECURRING_FREQUENCIES = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' }
];

export const CURRENCIES = [
  { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }
];

export const DEFAULT_CURRENCY = 'LKR';

export const COLOR_PALETTE = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Violet
];

export const ICON_SET = [
  '💵', '💳', '🏦', '💰', '📱', '🏠', '🚗', '🍔',
  '🛒', '⚡', '💡', '🎮', '📚', '✈️', '🏥', '🎬',
  '🎵', '👕', '💊', '🔧', '📱', '💻', '🎓', '🏋️'
];

export const CHART_COLORS = {
  income: 'hsl(142, 76%, 36%)',
  expense: 'hsl(0, 84%, 60%)',
  transfer: 'hsl(199, 89%, 48%)',
  primary: 'hsl(250, 84%, 54%)',
  secondary: 'hsl(280, 70%, 60%)',
  accent: 'hsl(320, 85%, 60%)'
};

export const DATE_FORMATS = {
  short: 'MMM DD',
  medium: 'MMM DD, YYYY',
  long: 'MMMM DD, YYYY',
  full: 'dddd, MMMM DD, YYYY'
};

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
};

export const DB_NAME = 'BudjectDB';
export const DB_VERSION = 2;

export const STORAGE_KEYS = {
  THEME: 'budject_theme',
  CURRENCY: 'budject_currency',
  LANGUAGE: 'budject_language'
};
