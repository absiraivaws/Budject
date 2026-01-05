import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { getAllTransactions, getAllAccounts, getAllCategories, getAllRecurringTransactions } from '../services/db.js';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshData = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setAccounts([]);
      setCategories([]);
      setRecurringTransactions([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch data in parallel
      const [txData, accountsData, categoriesData, recurringData] = await Promise.all([
        getAllTransactions(),
        getAllAccounts(),
        getAllCategories(),
        getAllRecurringTransactions()
      ]);

      setTransactions(txData);
      setAccounts(accountsData);
      setCategories(categoriesData);
      setRecurringTransactions(recurringData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const value = {
    transactions,
    accounts,
    categories,
    recurringTransactions,
    loading,
    error,
    refreshData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
