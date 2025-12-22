import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/UI/Card.jsx';
import Button from '../../components/UI/Button.jsx';
import { getAllAccounts, getAllTransactions } from '../../services/db.js';
import { formatCurrency } from '../../utils/currency.js';
import { formatDate } from '../../utils/dateUtils.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import './Dashboard.css';

export default function Dashboard() {
    const { currency } = useCurrency();
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpense: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const accountsData = await getAllAccounts();
        const transactionsData = await getAllTransactions();

        setAccounts(accountsData);
        setTransactions(transactionsData.slice(0, 5)); // Latest 5 transactions

        // Calculate stats
        const totalBalance = accountsData.reduce((sum, acc) => sum + (acc.balance || 0), 0);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyTxs = transactionsData.filter(tx => new Date(tx.date) >= startOfMonth);

        const monthlyIncome = monthlyTxs
            .filter(tx => tx.type === 'income')
            .reduce((sum, tx) => sum + tx.amount, 0);

        const monthlyExpense = monthlyTxs
            .filter(tx => tx.type === 'expense')
            .reduce((sum, tx) => sum + tx.amount, 0);

        setStats({ totalBalance, monthlyIncome, monthlyExpense });
    }

    return (
        <div className="dashboard fade-in">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <Link to="/transactions/new">
                    <Button variant="primary">+ Add Transaction</Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3">
                <Card glass>
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Balance</div>
                            <div className="stat-value">{formatCurrency(stats.totalBalance, currency)}</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card stat-income">
                        <div className="stat-icon">📈</div>
                        <div className="stat-content">
                            <div className="stat-label">Monthly Income</div>
                            <div className="stat-value text-success">{formatCurrency(stats.monthlyIncome, currency)}</div>
                        </div>
                    </div>
                </Card>

                <Card glass>
                    <div className="stat-card stat-expense">
                        <div className="stat-icon">📉</div>
                        <div className="stat-content">
                            <div className="stat-label">Monthly Expense</div>
                            <div className="stat-value text-danger">{formatCurrency(stats.monthlyExpense, currency)}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Accounts Overview */}
            <Card title="Accounts">
                {accounts.length === 0 ? (
                    <div className="empty-state">
                        <p>No accounts yet. Create your first account to get started!</p>
                        <Link to="/accounts">
                            <Button variant="primary">Add Account</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="accounts-list">
                        {accounts.map(account => (
                            <div key={account.id} className="account-item">
                                <div className="account-icon" style={{ background: account.color }}>
                                    {account.icon}
                                </div>
                                <div className="account-info">
                                    <div className="account-name">{account.name}</div>
                                    <div className="account-type">{account.type}</div>
                                </div>
                                <div className="account-balance">
                                    {formatCurrency(account.balance || 0, currency)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Recent Transactions */}
            <Card title="Recent Transactions">
                {transactions.length === 0 ? (
                    <div className="empty-state">
                        <p>No transactions yet. Add your first transaction!</p>
                        <Link to="/transactions/new">
                            <Button variant="primary">Add Transaction</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="transactions-list">
                        {transactions.map(tx => (
                            <div key={tx.id} className="transaction-item">
                                <div className={`transaction-type-indicator ${tx.type}`}></div>
                                <div className="transaction-info">
                                    <div className="transaction-notes">{tx.notes || 'No description'}</div>
                                    <div className="transaction-date">{formatDate(tx.date, 'short')}</div>
                                </div>
                                <div className={`transaction-amount ${tx.type}`}>
                                    {tx.type === 'income' && '+'}
                                    {tx.type === 'expense' && '-'}
                                    {formatCurrency(tx.amount, currency)}
                                </div>
                            </div>
                        ))}
                        <Link to="/transactions" className="view-all-link">
                            View All Transactions →
                        </Link>
                    </div>
                )}
            </Card>
        </div>
    );
}
