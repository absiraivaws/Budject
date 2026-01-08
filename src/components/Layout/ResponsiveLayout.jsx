import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceType } from '../../hooks/useMediaQuery.js';
import BottomNav from '../Navigation/BottomNav.jsx';
import SideNav from '../Navigation/SideNav.jsx';
import WhatsAppReminderPopup from '../WhatsAppReminderPopup/WhatsAppReminderPopup.jsx';
import { getAllFriends, updateFriend } from '../../services/db.js';
import { getPendingReminders, shouldShowReminderPopup } from '../../services/whatsappReminderService.js';
import { getWhatsAppSettings, setWhatsAppSettings } from '../../services/storageService.js';
import {
    generateLendingReminderMessage,
    generateBorrowingReminderMessage,
    openWhatsAppLink
} from '../../services/whatsappLinkService.js';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './ResponsiveLayout.css';
import ThemeToggle from '../UI/ThemeToggle.jsx';

export default function ResponsiveLayout({ children }) {
    const deviceType = useDeviceType();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currency } = useCurrency();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showReminderPopup, setShowReminderPopup] = useState(false);
    const [pendingReminders, setPendingReminders] = useState({ lending: [], borrowing: [] });

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    // Check for pending WhatsApp reminders on mount
    useEffect(() => {
        const checkReminders = async () => {
            const settings = getWhatsAppSettings();

            if (!shouldShowReminderPopup(settings, settings.lastPopupShown)) {
                return;
            }

            const friends = await getAllFriends();
            const reminders = await getPendingReminders(friends, settings);

            if (reminders.lending.length > 0 || reminders.borrowing.length > 0) {
                setPendingReminders(reminders);
                setShowReminderPopup(true);

                // Update last popup shown timestamp
                setWhatsAppSettings({
                    ...settings,
                    lastPopupShown: new Date().toISOString()
                });
            }
        };

        checkReminders();
    }, []);

    const handleSendReminder = async (friend, type) => {
        const isLending = type === 'lending';
        const amount = Math.abs(friend.balance);

        let message;
        if (isLending) {
            message = generateLendingReminderMessage(
                friend.name,
                amount,
                friend.return_date,
                currency
            );
        } else {
            message = generateBorrowingReminderMessage(
                friend.name,
                amount,
                friend.return_date,
                currency
            );
        }

        // Update last reminder sent timestamp
        await updateFriend(friend.id, {
            ...friend,
            last_reminder_sent: new Date().toISOString()
        });

        // Open WhatsApp
        openWhatsAppLink(friend.whatsapp_number, message);
    };

    const handleCloseReminderPopup = () => {
        setShowReminderPopup(false);
    };

    const handleProfileClick = () => {
        navigate('/profile');
    };

    return (
        <div className={`app-layout device-${deviceType}`}>
            {/* Top Header */}
            <header className="app-header">
                <div className="header-left">
                    {/* Hamburger Menu Button - Only on Mobile */}
                    {deviceType === 'mobile' && (
                        <button
                            className="hamburger-menu"
                            onClick={toggleSidebar}
                            aria-label="Toggle menu"
                        >
                            <span className="hamburger-icon">☰</span>
                        </button>
                    )}
                </div>

                <div className="header-center">
                    {user && <span className="user-greeting">Hi-{user.displayName || 'User'}</span>}
                </div>

                <div className="header-right">
                    <button
                        className="profile-icon-btn"
                        onClick={handleProfileClick}
                        aria-label="Profile"
                    >
                        👤
                    </button>
                </div>
            </header>

            {/* Overlay - Only on Mobile when sidebar is open */}
            {deviceType === 'mobile' && isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar Navigation */}
            {(deviceType === 'tablet' || deviceType === 'desktop') && <SideNav />}
            {deviceType === 'mobile' && (
                <div className={`mobile-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="mobile-sidebar-header">
                        <h2>Menu</h2>
                        <button
                            className="close-sidebar"
                            onClick={closeSidebar}
                            aria-label="Close menu"
                        >
                            ✕
                        </button>
                    </div>
                    <SideNav onNavigate={closeSidebar} />
                </div>
            )}

            <main className="main-content">
                {children}
            </main>

            {deviceType === 'mobile' && <BottomNav />}

            {/* WhatsApp Reminder Popup */}
            {showReminderPopup && (
                <WhatsAppReminderPopup
                    pendingReminders={pendingReminders}
                    onClose={handleCloseReminderPopup}
                    onSendReminder={handleSendReminder}
                />
            )}
        </div>
    );
}

