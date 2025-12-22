// Default Categories for Income and Expense

export const DEFAULT_INCOME_CATEGORIES = [
    {
        id: 'salary',
        name: 'Salary',
        type: 'income',
        icon: '💼',
        color: '#10B981',
        parent_id: null
    },
    {
        id: 'business',
        name: 'Business',
        type: 'income',
        icon: '💰',
        color: '#14B8A6',
        parent_id: null
    },
    {
        id: 'investment',
        name: 'Investment',
        type: 'income',
        icon: '📈',
        color: '#06B6D4',
        parent_id: null
    },
    {
        id: 'freelance',
        name: 'Freelance',
        type: 'income',
        icon: '💻',
        color: '#3B82F6',
        parent_id: null
    },
    {
        id: 'other_income',
        name: 'Other Income',
        type: 'income',
        icon: '💵',
        color: '#8B5CF6',
        parent_id: null
    }
];

export const DEFAULT_EXPENSE_CATEGORIES = [
    {
        id: 'food',
        name: 'Food & Dining',
        type: 'expense',
        icon: '🍔',
        color: '#EF4444',
        parent_id: null
    },
    {
        id: 'transportation',
        name: 'Transportation',
        type: 'expense',
        icon: '🚗',
        color: '#F59E0B',
        parent_id: null
    },
    {
        id: 'shopping',
        name: 'Shopping',
        type: 'expense',
        icon: '🛒',
        color: '#EC4899',
        parent_id: null
    },
    {
        id: 'entertainment',
        name: 'Entertainment',
        type: 'expense',
        icon: '🎬',
        color: '#8B5CF6',
        parent_id: null
    },
    {
        id: 'bills',
        name: 'Bills & Utilities',
        type: 'expense',
        icon: '⚡',
        color: '#F59E0B',
        parent_id: null
    },
    {
        id: 'healthcare',
        name: 'Healthcare',
        type: 'expense',
        icon: '🏥',
        color: '#EF4444',
        parent_id: null
    },
    {
        id: 'education',
        name: 'Education',
        type: 'expense',
        icon: '🎓',
        color: '#3B82F6',
        parent_id: null
    },
    {
        id: 'housing',
        name: 'Housing',
        type: 'expense',
        icon: '🏠',
        color: '#14B8A6',
        parent_id: null
    },
    {
        id: 'other_expense',
        name: 'Other Expenses',
        type: 'expense',
        icon: '💳',
        color: '#6366F1',
        parent_id: null
    }
];

export const DEFAULT_ACCOUNTS = [
    {
        id: 'cash_wallet',
        name: 'Cash Wallet',
        type: 'cash',
        balance: 0,
        currency: 'LKR',
        color: '#10B981',
        icon: '💵'
    }
];
