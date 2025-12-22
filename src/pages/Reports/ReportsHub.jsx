import { useState, useEffect } from 'react';
import Card from '../../components/UI/Card.jsx';
import Button from '../../components/UI/Button.jsx';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { getAllTransactions, getAllCategories, getAllAccounts } from '../../services/db.js';
import { formatCurrency } from '../../utils/currency.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { TRANSACTION_TYPES } from '../../config/constants.js';
import { getStartOfMonth, getEndOfMonth, addMonths, formatDate } from '../../utils/dateUtils.js';
import './ReportsHub.css';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export default function ReportsHub() {
    const { currency } = useCurrency();
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [dateRange, setDateRange] = useState('this_month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [txData, catData, accData] = await Promise.all([
            getAllTransactions(),
            getAllCategories(),
            getAllAccounts()
        ]);

        setTransactions(txData);
        setCategories(catData);
        setAccounts(accData);
    }

    const getDateRangeFilter = () => {
        const now = new Date();
        let startDate, endDate;

        switch (dateRange) {
            case 'this_month':
                startDate = getStartOfMonth(now);
                endDate = getEndOfMonth(now);
                break;
            case 'last_month':
                const lastMonth = addMonths(now, -1);
                startDate = getStartOfMonth(lastMonth);
                endDate = getEndOfMonth(lastMonth);
                break;
            case 'last_3_months':
                startDate = getStartOfMonth(addMonths(now, -2));
                endDate = getEndOfMonth(now);
                break;
            case 'last_6_months':
                startDate = getStartOfMonth(addMonths(now, -5));
                endDate = getEndOfMonth(now);
                break;
            case 'this_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            case 'custom':
                startDate = customStartDate ? new Date(customStartDate) : getStartOfMonth(addMonths(now, -2));
                endDate = customEndDate ? new Date(customEndDate) : getEndOfMonth(now);
                break;
            default:
                startDate = getStartOfMonth(now);
                endDate = getEndOfMonth(now);
        }

        return { startDate, endDate };
    };

    const { startDate, endDate } = getDateRangeFilter();

    // Filter transactions by date range
    const filteredTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
    });

    // Calculate totals
    const totals = filteredTransactions.reduce((acc, tx) => {
        if (tx.type === TRANSACTION_TYPES.INCOME) acc.income += tx.amount;
        if (tx.type === TRANSACTION_TYPES.EXPENSE) acc.expense += tx.amount;
        return acc;
    }, { income: 0, expense: 0 });

    totals.net = totals.income - totals.expense;

    // Category breakdown
    const categoryBreakdown = {};
    filteredTransactions.forEach(tx => {
        if (tx.type !== TRANSACTION_TYPES.TRANSFER && tx.category_id) {
            const category = categories.find(c => c.id === tx.category_id);
            if (category) {
                const key = `${tx.type}_${category.id}`;
                if (!categoryBreakdown[key]) {
                    categoryBreakdown[key] = {
                        name: category.name,
                        icon: category.icon,
                        color: category.color,
                        type: tx.type,
                        amount: 0,
                        count: 0
                    };
                }
                categoryBreakdown[key].amount += tx.amount;
                categoryBreakdown[key].count += 1;
            }
        }
    });

    const expenseCategories = Object.values(categoryBreakdown).filter(c => c.type === TRANSACTION_TYPES.EXPENSE);
    const incomeCategories = Object.values(categoryBreakdown).filter(c => c.type === TRANSACTION_TYPES.INCOME);

    // Monthly trend data (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
        const monthDate = addMonths(new Date(), -i);
        const monthStart = getStartOfMonth(monthDate);
        const monthEnd = getEndOfMonth(monthDate);

        const monthTx = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= monthStart && txDate <= monthEnd;
        });

        const monthData = monthTx.reduce((acc, tx) => {
            if (tx.type === TRANSACTION_TYPES.INCOME) acc.income += tx.amount;
            if (tx.type === TRANSACTION_TYPES.EXPENSE) acc.expense += tx.amount;
            return acc;
        }, { income: 0, expense: 0 });

        monthlyTrend.push({
            month: formatDate(monthDate, 'short').split(' ')[0],
            income: monthData.income,
            expense: monthData.expense,
            net: monthData.income - monthData.expense
        });
    }

    // Chart data
    const expenseChartData = {
        labels: expenseCategories.map(c => c.name),
        datasets: [{
            data: expenseCategories.map(c => c.amount),
            backgroundColor: expenseCategories.map(c => c.color),
            borderWidth: 0
        }]
    };

    const incomeChartData = {
        labels: incomeCategories.map(c => c.name),
        datasets: [{
            data: incomeCategories.map(c => c.amount),
            backgroundColor: incomeCategories.map(c => c.color),
            borderWidth: 0
        }]
    };

    const trendChartData = {
        labels: monthlyTrend.map(m => m.month),
        datasets: [
            {
                label: 'Income',
                data: monthlyTrend.map(m => m.income),
                borderColor: 'hsl(142, 76%, 36%)',
                backgroundColor: 'hsla(142, 76%, 36%, 0.1)',
                tension: 0.4
            },
            {
                label: 'Expenses',
                data: monthlyTrend.map(m => m.expense),
                borderColor: 'hsl(0, 84%, 60%)',
                backgroundColor: 'hsla(0, 84%, 60%, 0.1)',
                tension: 0.4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    };

    const handleExport = () => {
        const reportData = {
            dateRange: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            },
            summary: totals,
            expenseBreakdown: expenseCategories,
            incomeBreakdown: incomeCategories,
            monthlyTrend,
            transactions: filteredTransactions
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budject-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="reports-page fade-in">
            <div className="reports-header">
                <div>
                    <h1>Reports & Analytics</h1>
                    <p className="text-secondary">Insights into your financial data</p>
                </div>
                <Button variant="primary" onClick={handleExport}>
                    📥 Export Report
                </Button>
            </div>

            {/* Date Range Selector */}
            <Card>
                <div className="date-range-selector">
                    <div className="date-range-buttons">
                        <button
                            className={`date-range-btn ${dateRange === 'this_month' ? 'active' : ''}`}
                            onClick={() => setDateRange('this_month')}
                        >
                            This Month
                        </button>
                        <button
                            className={`date-range-btn ${dateRange === 'last_month' ? 'active' : ''}`}
                            onClick={() => setDateRange('last_month')}
                        >
                            Last Month
                        </button>
                        <button
                            className={`date-range-btn ${dateRange === 'last_3_months' ? 'active' : ''}`}
                            onClick={() => setDateRange('last_3_months')}
                        >
                            Last 3 Months
                        </button>
                        <button
                            className={`date-range-btn ${dateRange === 'last_6_months' ? 'active' : ''}`}
                            onClick={() => setDateRange('last_6_months')}
                        >
                            Last 6 Months
                        </button>
                        <button
                            className={`date-range-btn ${dateRange === 'this_year' ? 'active' : ''}`}
                            onClick={() => setDateRange('this_year')}
                        >
                            This Year
                        </button>
                        <button
                            className={`date-range-btn ${dateRange === 'custom' ? 'active' : ''}`}
                            onClick={() => setDateRange('custom')}
                        >
                            Custom
                        </button>
                    </div>

                    {dateRange === 'custom' && (
                        <div className="custom-date-range">
                            <input
                                type="date"
                                className="form-input"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                placeholder="Start Date"
                            />
                            <span>to</span>
                            <input
                                type="date"
                                className="form-input"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                placeholder="End Date"
                            />
                        </div>
                    )}
                </div>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-3">
                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon income-icon">📈</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Income</div>
                            <div className="stat-value text-success">{formatCurrency(totals.income, currency)}</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon expense-icon">📉</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Expenses</div>
                            <div className="stat-value text-danger">{formatCurrency(totals.expense, currency)}</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <div className="stat-label">Net Flow</div>
                            <div className={`stat-value ${totals.net >= 0 ? 'text-success' : 'text-danger'}`}>
                                {formatCurrency(totals.net, currency)}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Monthly Trend Chart */}
            <Card title="Income vs Expenses Trend (Last 6 Months)">
                <div className="chart-container">
                    <Line data={trendChartData} options={chartOptions} />
                </div>
            </Card>

            {/* Category Breakdown Charts */}
            <div className="grid grid-cols-2">
                <Card title="Expense Breakdown">
                    {expenseCategories.length > 0 ? (
                        <div className="chart-container">
                            <Doughnut data={expenseChartData} options={chartOptions} />
                        </div>
                    ) : (
                        <div className="empty-chart">
                            <p>No expense data for this period</p>
                        </div>
                    )}
                </Card>

                <Card title="Income Breakdown">
                    {incomeCategories.length > 0 ? (
                        <div className="chart-container">
                            <Doughnut data={incomeChartData} options={chartOptions} />
                        </div>
                    ) : (
                        <div className="empty-chart">
                            <p>No income data for this period</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Category Details */}
            <div className="grid grid-cols-2">
                <Card title="Top Expense Categories">
                    <div className="category-list">
                        {expenseCategories
                            .sort((a, b) => b.amount - a.amount)
                            .slice(0, 5)
                            .map((cat, index) => (
                                <div key={index} className="category-item-report">
                                    <div className="category-info-report">
                                        <div
                                            className="category-icon-report"
                                            style={{ background: cat.color }}
                                        >
                                            {cat.icon}
                                        </div>
                                        <div>
                                            <div className="category-name-report">{cat.name}</div>
                                            <div className="category-count">{cat.count} transactions</div>
                                        </div>
                                    </div>
                                    <div className="category-amount-report text-danger">
                                        {formatCurrency(cat.amount, currency)}
                                    </div>
                                </div>
                            ))}
                        {expenseCategories.length === 0 && (
                            <div className="empty-list">No expense categories</div>
                        )}
                    </div>
                </Card>

                <Card title="Top Income Categories">
                    <div className="category-list">
                        {incomeCategories
                            .sort((a, b) => b.amount - a.amount)
                            .slice(0, 5)
                            .map((cat, index) => (
                                <div key={index} className="category-item-report">
                                    <div className="category-info-report">
                                        <div
                                            className="category-icon-report"
                                            style={{ background: cat.color }}
                                        >
                                            {cat.icon}
                                        </div>
                                        <div>
                                            <div className="category-name-report">{cat.name}</div>
                                            <div className="category-count">{cat.count} transactions</div>
                                        </div>
                                    </div>
                                    <div className="category-amount-report text-success">
                                        {formatCurrency(cat.amount, currency)}
                                    </div>
                                </div>
                            ))}
                        {incomeCategories.length === 0 && (
                            <div className="empty-list">No income categories</div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
