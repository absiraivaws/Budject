import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { CurrencyProvider } from './context/CurrencyContext.jsx';
import { FontSizeProvider } from './context/FontSizeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ReminderProvider } from './context/ReminderContext.jsx';
import { DataProvider } from './context/DataContext.jsx';

import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import ResponsiveLayout from './components/Layout/ResponsiveLayout.jsx';

import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import ForgotPassword from './pages/Auth/ForgotPassword.jsx';
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
import { processRecurringTransactions } from './services/recurringProcessor.js';
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

  // Process recurring transactions on app startup
  useEffect(() => {
    const processRecurring = async () => {
      try {
        const createdTransactions = await processRecurringTransactions();
        if (createdTransactions.length > 0) {
          console.log(`Processed ${createdTransactions.length} recurring transaction(s)`);
        }
      } catch (error) {
        console.error('Error processing recurring transactions:', error);
      }
    };

    processRecurring();
  }, []);

  return (
    <ThemeProvider>
      <FontSizeProvider>
        <CurrencyProvider>
          <AuthProvider>
            <ReminderProvider>
              <DataProvider>
                <Router>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Protected Routes */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <ResponsiveLayout>
                          <Dashboard />
                        </ResponsiveLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/transactions" element={
                      <ProtectedRoute>
                        <ResponsiveLayout>
                          <TransactionList />
                        </ResponsiveLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/accounts" element={
                      <ProtectedRoute>
                        <ResponsiveLayout>
                          <AccountList />
                        </ResponsiveLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/categories" element={
                      <ProtectedRoute>
                        <ResponsiveLayout>
                          <CategoryManager />
                        </ResponsiveLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/budgets" element={
                      <ProtectedRoute>
                        <ResponsiveLayout>
                          <BudgetManager />
                        </ResponsiveLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/calendar" element={
                      <ProtectedRoute>
                        <ResponsiveLayout>
                          <CalendarView />
                        </ResponsiveLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/recurring" element={
                      <ProtectedRoute>
                        <ResponsiveLayout>
                          <RecurringManager />
                        </ResponsiveLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/reports" element={
                      <ProtectedRoute>
                        <ResponsiveLayout>
                          <ReportsHub />
                        </ResponsiveLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/assets" element={
                      <ProtectedRoute>
                        <ResponsiveLayout>
                          <AssetManager />
                        </ResponsiveLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/friends" element={
                      <ProtectedRoute>
                        <ResponsiveLayout>
                          <FriendManager />
                        </ResponsiveLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <ResponsiveLayout>
                          <Settings />
                        </ResponsiveLayout>
                      </ProtectedRoute>
                    } />
                  </Routes>
                </Router>
              </DataProvider>
            </ReminderProvider>
          </AuthProvider>
        </CurrencyProvider>
      </FontSizeProvider>
    </ThemeProvider>
  );
}

export default App;
