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

// Generate reminder times every 15 minutes for 24 hours
export const REMINDER_TIMES = (() => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      const value = `${hourStr}:${minuteStr}`;

      // Format label (12-hour format with AM/PM)
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const period = hour < 12 ? 'AM' : 'PM';
      const label = `${displayHour}:${minuteStr} ${period}`;

      times.push({ value, label });
    }
  }
  return times;
})();

export const DB_NAME = 'SpendexDB';
export const DB_VERSION = 3;

export const STORAGE_KEYS = {
  THEME: 'budject_theme',
  CURRENCY: 'budject_currency',
  LANGUAGE: 'budject_language',
  DAILY_REMINDER: 'budject_daily_reminder',
  SMS_TRAINING_DATA: 'spendex_sms_training',
  SMS_PATTERNS: 'spendex_sms_patterns'
};

export const SRI_LANKAN_BANKS = [
  { id: 'abans_finance', name: 'Abans Finance PLC', icon: '🏦' },
  { id: 'alliance_finance', name: 'Alliance Finance Co. PLC', icon: '🏦' },
  { id: 'amana_bank', name: 'Amana Bank PLC', icon: '🏦' },
  { id: 'amw_capital', name: 'AMW Capital Leasing and Finance PLC', icon: '🏦' },
  { id: 'asia_asset_finance', name: 'Asia Asset Finance PLC', icon: '🏦' },
  { id: 'asia_commercial_bank', name: 'Asia Commercial Bank Ltd', icon: '🏦' },
  { id: 'assetline_finance', name: 'Assetline Finance Ltd', icon: '🏦' },
  { id: 'associated_motor', name: 'Associated Motor Finance Co. PLC', icon: '🏦' },
  { id: 'bank_of_ceylon', name: 'Bank of Ceylon', icon: '🏦' },
  { id: 'bank_of_china', name: 'Bank of China Ltd', icon: '🏦' },
  { id: 'cargills_bank', name: 'Cargills Bank PLC', icon: '🏦' },
  { id: 'cbc_finance', name: 'CBC Finance Ltd', icon: '🏦' },
  { id: 'central_bank_india', name: 'Central Bank of India – Colombo Branch', icon: '🏦' },
  { id: 'central_finance', name: 'Central Finance Co. PLC', icon: '🏦' },
  { id: 'citibank', name: 'Citibank N.A.', icon: '🏦' },
  { id: 'citizens_development', name: 'Citizens Development Business Finance PLC (CDB)', icon: '🏦' },
  { id: 'commercial_bank', name: 'Commercial Bank of Ceylon PLC', icon: '🏦' },
  { id: 'commercial_credit', name: 'Commercial Credit & Finance PLC', icon: '🏦' },
  { id: 'deutsche_bank', name: 'Deutsche Bank AG – Colombo Branch', icon: '🏦' },
  { id: 'dfcc_bank', name: 'DFCC Bank PLC', icon: '🏦' },
  { id: 'dialog_finance', name: 'Dialog Finance PLC', icon: '🏦' },
  { id: 'eti_finance', name: 'ETI Finance Ltd', icon: '🏦' },
  { id: 'fintrex_finance', name: 'Fintrex Finance PLC', icon: '🏦' },
  { id: 'habib_bank', name: 'Habib Bank Ltd', icon: '🏦' },
  { id: 'hatton_national', name: 'Hatton National Bank PLC', icon: '🏦' },
  { id: 'hnb_finance', name: 'HNB Finance PLC', icon: '🏦' },
  { id: 'hsbc', name: 'HSBC Ltd', icon: '🏦' },
  { id: 'indian_bank', name: 'Indian Bank', icon: '🏦' },
  { id: 'indian_overseas', name: 'Indian Overseas Bank', icon: '🏦' },
  { id: 'janashakthi_finance', name: 'Janashakthi Finance PLC', icon: '🏦' },
  { id: 'lb_finance', name: 'L B Finance PLC', icon: '🏦' },
  { id: 'lanka_credit', name: 'Lanka Credit and Business Finance PLC', icon: '🏦' },
  { id: 'lolc_finance', name: 'LOLC Finance PLC', icon: '🏦' },
  { id: 'mahindra_ideal', name: 'Mahindra Ideal Finance Ltd', icon: '🏦' },
  { id: 'mbl_bank', name: 'MBL Bank Ltd', icon: '🏦' },
  { id: 'mercantile_investments', name: 'Mercantile Investments & Finance PLC', icon: '🏦' },
  { id: 'merchant_bank', name: 'Merchant Bank of Sri Lanka & Finance PLC', icon: '🏦' },
  { id: 'nation_lanka', name: 'Nation Lanka Finance PLC', icon: '🏦' },
  { id: 'national_australia', name: 'National Australia Bank Ltd – Colombo Branch', icon: '🏦' },
  { id: 'ndb', name: 'National Development Bank PLC (NDB)', icon: '🏦' },
  { id: 'nations_trust', name: 'Nations Trust Bank PLC', icon: '🏦' },
  { id: 'pan_asia', name: 'Pan Asia Banking Corporation PLC', icon: '🏦' },
  { id: 'peoples_bank', name: "People's Bank", icon: '🏦' },
  { id: 'peoples_leasing', name: "People's Leasing & Finance PLC", icon: '🏦' },
  { id: 'pmf_finance', name: 'PMF Finance PLC', icon: '🏦' },
  { id: 'richard_pieris', name: 'Richard Pieris Finance Ltd', icon: '🏦' },
  { id: 'sampath_bank', name: 'Sampath Bank PLC', icon: '🏦' },
  { id: 'sarvodaya_development', name: 'Sarvodaya Development Finance PLC', icon: '🏦' },
  { id: 'senkadagala_finance', name: 'Senkadagala Finance PLC', icon: '🏦' },
  { id: 'seylan_bank', name: 'Seylan Bank PLC', icon: '🏦' },
  { id: 'singer_finance', name: 'Singer Finance (Lanka) PLC', icon: '🏦' },
  { id: 'siyapatha_finance', name: 'Siyapatha Finance PLC', icon: '🏦' },
  { id: 'smb_finance', name: 'SMB Finance PLC', icon: '🏦' },
  { id: 'softlogic_finance', name: 'Softlogic Finance PLC', icon: '🏦' },
  { id: 'standard_chartered', name: 'Standard Chartered Bank', icon: '🏦' },
  { id: 'ub_finance', name: 'UB Finance PLC', icon: '🏦' },
  { id: 'union_bank', name: 'Union Bank of Colombo PLC', icon: '🏦' },
  { id: 'vallibel_finance', name: 'Vallibel Finance PLC', icon: '🏦' },
  { id: 'other', name: 'Other Bank/Finance Company', icon: '🏦' }
];

