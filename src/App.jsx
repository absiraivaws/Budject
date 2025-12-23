import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { CurrencyProvider } from './context/CurrencyContext.jsx';
import { FontSizeProvider } from './context/FontSizeContext.jsx';
import ResponsiveLayout from './components/Layout/ResponsiveLayout.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import TransactionList from './pages/Transactions/TransactionList.jsx';
import AccountList from './pages/Accounts/AccountList.jsx';
import CategoryManager from './pages/Categories/CategoryManager.jsx';
import BudgetManager from './pages/Budgets/BudgetManager.jsx';
import CalendarView from './pages/Calendar/CalendarView.jsx';
import RecurringManager from './pages/Recurring/RecurringManager.jsx';
import ReportsHub from './pages/Reports/ReportsHub.jsx';
import AssetManager from './pages/Assets/AssetManager.jsx';
import FriendManager from './pages/Friends/FriendManager.jsx';
import Settings from './pages/Settings/Settings.jsx';
import { initDB } from './services/db.js';
import { initializeTheme } from './services/storageService.js';
import './App.css';

function App() {
  useEffect(() => {
    // Initialize database and theme on app load
    const initialize = async () => {
      try {
        await initDB();
        initializeTheme();
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initialize();
  }, []);

  return (
    <ThemeProvider>
      <FontSizeProvider>
        <CurrencyProvider>
          <BrowserRouter>
            <ResponsiveLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<TransactionList />} />
                <Route path="/accounts" element={<AccountList />} />
                <Route path="/categories" element={<CategoryManager />} />
                <Route path="/budgets" element={<BudgetManager />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/recurring" element={<RecurringManager />} />
                <Route path="/reports" element={<ReportsHub />} />
                <Route path="/assets" element={<AssetManager />} />
                <Route path="/friends" element={<FriendManager />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </ResponsiveLayout>
          </BrowserRouter>
        </CurrencyProvider>
      </FontSizeProvider>
    </ThemeProvider>
  );
}

export default App;
