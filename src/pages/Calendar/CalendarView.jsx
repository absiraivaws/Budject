import { useState, useEffect } from 'react';
import Card from '../../components/UI/Card.jsx';
import Button from '../../components/UI/Button.jsx';
import { getAllTransactions, getAllAccounts, getAllCategories } from '../../services/db.js';
import { formatCurrency } from '../../utils/currency.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import {
    generateCalendar,
    formatDate,
    getStartOfMonth,
    getEndOfMonth,
    addMonths
} from '../../utils/dateUtils.js';
import { TRANSACTION_TYPES } from '../../config/constants.js';
import './CalendarView.css';

export default function CalendarView() {
    const { currency } = useCurrency();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [txData, accountsData, categoriesData] = await Promise.all([
            getAllTransactions(),
            getAllAccounts(),
            getAllCategories()
        ]);

        setTransactions(txData);
        setAccounts(accountsData);
        setCategories(categoriesData);
    }

    const handlePrevMonth = () => {
        setCurrentDate(addMonths(currentDate, -1));
        setSelectedDate(null);
    };

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
        setSelectedDate(null);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(null);
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
    };

    // Get transactions for a specific date
    const getTransactionsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return transactions.filter(tx => tx.date === dateStr);
    };

    // Calculate totals for a date
    const getDayTotals = (date) => {
        const dayTransactions = getTransactionsForDate(date);
        return dayTransactions.reduce((acc, tx) => {
            if (tx.type === TRANSACTION_TYPES.INCOME) acc.income += tx.amount;
            if (tx.type === TRANSACTION_TYPES.EXPENSE) acc.expense += tx.amount;
            return acc;
        }, { income: 0, expense: 0 });
    };

    // Get month totals
    const getMonthTotals = () => {
        const monthStart = getStartOfMonth(currentDate);
        const monthEnd = getEndOfMonth(currentDate);
        const startStr = monthStart.toISOString().split('T')[0];
        const endStr = monthEnd.toISOString().split('T')[0];

        return transactions
            .filter(tx => tx.date >= startStr && tx.date <= endStr)
            .reduce((acc, tx) => {
                if (tx.type === TRANSACTION_TYPES.INCOME) acc.income += tx.amount;
                if (tx.type === TRANSACTION_TYPES.EXPENSE) acc.expense += tx.amount;
                return acc;
            }, { income: 0, expense: 0 });
    };

    const calendar = generateCalendar(currentDate);
    const monthTotals = getMonthTotals();
    const selectedDateTransactions = selectedDate ? getTransactionsForDate(selectedDate) : [];

    const getAccountName = (accountId) => {
        const account = accounts.find(a => a.id === accountId);
        return account ? `${account.icon} ${account.name}` : 'Unknown';
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? `${category.icon} ${category.name}` : 'Unknown';
    };

    return (
        <div className="calendar-page fade-in">
            <div className="calendar-header">
                <div>
                    <h1>Calendar</h1>
                    <p className="text-secondary">View your transactions by date</p>
                </div>
            </div>

            {/* Month Navigation */}
            <Card>
                <div className="calendar-nav">
                    <Button variant="secondary" size="sm" onClick={handlePrevMonth}>
                        ← Previous
                    </Button>
                    <div className="calendar-month-title">
                        <h2>{formatDate(currentDate, 'monthYear')}</h2>
                        <Button variant="ghost" size="sm" onClick={handleToday}>
                            Today
                        </Button>
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleNextMonth}>
                        Next →
                    </Button>
                </div>
            </Card>

            {/* Month Summary */}
            <div className="grid grid-cols-3">
                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon income-icon">📈</div>
                        <div className="stat-content">
                            <div className="stat-label">Income</div>
                            <div className="stat-value text-success">{formatCurrency(monthTotals.income, currency)}</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon expense-icon">📉</div>
                        <div className="stat-content">
                            <div className="stat-label">Expenses</div>
                            <div className="stat-value text-danger">{formatCurrency(monthTotals.expense, currency)}</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <div className="stat-label">Net</div>
                            <div className={`stat-value ${monthTotals.income - monthTotals.expense >= 0 ? 'text-success' : 'text-danger'}`}>
                                {formatCurrency(monthTotals.income - monthTotals.expense, currency)}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Calendar Grid */}
            <Card>
                <div className="calendar-grid">
                    {/* Day Headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="calendar-day-header">
                            {day}
                        </div>
                    ))}

                    {/* Calendar Days */}
                    {calendar.map((week, weekIndex) => (
                        week.map((day, dayIndex) => {
                            const dayTotals = day.date ? getDayTotals(day.date) : { income: 0, expense: 0 };
                            const hasTransactions = dayTotals.income > 0 || dayTotals.expense > 0;
                            const isToday = day.date && day.date.toDateString() === new Date().toDateString();
                            const isSelected = selectedDate && day.date && day.date.toDateString() === selectedDate.toDateString();

                            return (
                                <div
                                    key={`${weekIndex}-${dayIndex}`}
                                    className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasTransactions ? 'has-transactions' : ''}`}
                                    onClick={() => day.date && day.isCurrentMonth && handleDateClick(day.date)}
                                >
                                    {day.date && (
                                        <>
                                            <div className="calendar-day-number">{day.date.getDate()}</div>
                                            {hasTransactions && (
                                                <div className="calendar-day-totals">
                                                    {dayTotals.income > 0 && (
                                                        <div className="calendar-day-income">
                                                            +{formatCurrency(dayTotals.income, currency, true)}
                                                        </div>
                                                    )}
                                                    {dayTotals.expense > 0 && (
                                                        <div className="calendar-day-expense">
                                                            -{formatCurrency(dayTotals.expense, currency, true)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })
                    ))}
                </div>
            </Card>

            {/* Selected Date Transactions */}
            {selectedDate && (
                <Card title={`Transactions on ${formatDate(selectedDate, 'full')}`}>
                    {selectedDateTransactions.length === 0 ? (
                        <div className="empty-state-small">
                            <p>No transactions on this date</p>
                        </div>
                    ) : (
                        <div className="transactions-list">
                            {selectedDateTransactions.map(tx => (
                                <div key={tx.id} className={`transaction-item ${tx.type}`}>
                                    <div className={`transaction-type-indicator ${tx.type}`}></div>

                                    <div className="transaction-main">
                                        <div className="transaction-info">
                                            <div className="transaction-description">
                                                {tx.notes || 'No description'}
                                            </div>
                                            <div className="transaction-meta">
                                                <span className="transaction-account">{getAccountName(tx.account_id)}</span>
                                                {tx.type !== TRANSACTION_TYPES.TRANSFER && (
                                                    <>
                                                        <span className="transaction-separator">•</span>
                                                        <span className="transaction-category">{getCategoryName(tx.category_id)}</span>
                                                    </>
                                                )}
                                                {tx.type === TRANSACTION_TYPES.TRANSFER && (
                                                    <>
                                                        <span className="transaction-separator">→</span>
                                                        <span className="transaction-account">{getAccountName(tx.to_account_id)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`transaction-amount ${tx.type}`}>
                                            {tx.type === TRANSACTION_TYPES.INCOME && '+'}
                                            {tx.type === TRANSACTION_TYPES.EXPENSE && '-'}
                                            {formatCurrency(tx.amount, currency)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
