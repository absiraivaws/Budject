import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { getDailyReminderSettings, setDailyReminderSettings } from '../services/storageService.js';
import { hasTransactionsToday, shouldShowReminder, markReminderShown } from '../services/reminderService.js';
import { checkAndShowReminder, initNotificationService } from '../services/notificationService.js';
import ReminderPrompt from '../components/ReminderPrompt/ReminderPrompt.jsx';

const ReminderContext = createContext(null);

export function ReminderProvider({ children }) {
    const { user, isAuthenticated } = useAuth();
    const [showPrompt, setShowPrompt] = useState(false);
    const [reminderSettings, setReminderSettingsState] = useState(() => getDailyReminderSettings());
    const [lastCheckTime, setLastCheckTime] = useState(null);

    // Initialize notification service
    useEffect(() => {
        initNotificationService();
    }, []);

    // Check for reminders on login and periodically
    useEffect(() => {
        if (!isAuthenticated || !user) {
            return;
        }

        const checkReminder = async () => {
            const settings = getDailyReminderSettings();
            setReminderSettingsState(settings);

            if (!settings.enabled) {
                return;
            }

            // Check if we should show reminder
            const hasTransactions = await hasTransactionsToday(user.id);

            if (!hasTransactions && shouldShowReminder(settings)) {
                // Show login prompt
                setShowPrompt(true);

                // Show browser notification if enabled
                if (settings.browserNotificationEnabled) {
                    checkAndShowReminder(settings, hasTransactions, () => {
                        // Navigate to transactions page when notification clicked
                        window.location.href = '/transactions';
                    });
                }

                // Mark as shown
                const updatedSettings = markReminderShown(settings);
                setDailyReminderSettings(updatedSettings);
                setReminderSettingsState(updatedSettings);
            }
        };

        // Check immediately on mount
        checkReminder();

        // Check every hour
        const interval = setInterval(checkReminder, 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, [isAuthenticated, user]);

    const handleClosePrompt = () => {
        setShowPrompt(false);
    };

    const handleDismissToday = () => {
        const settings = getDailyReminderSettings();
        const updatedSettings = markReminderShown(settings);
        setDailyReminderSettings(updatedSettings);
        setReminderSettingsState(updatedSettings);
        setShowPrompt(false);
    };

    const value = {
        reminderSettings,
        showPrompt,
        setShowPrompt
    };

    return (
        <ReminderContext.Provider value={value}>
            {children}
            {showPrompt && (
                <ReminderPrompt
                    onClose={handleClosePrompt}
                    onDismissToday={handleDismissToday}
                />
            )}
        </ReminderContext.Provider>
    );
}

export function useReminder() {
    const context = useContext(ReminderContext);
    if (!context) {
        throw new Error('useReminder must be used within a ReminderProvider');
    }
    return context;
}
