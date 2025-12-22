import { useState } from 'react';
import { useDeviceType } from '../../hooks/useMediaQuery.js';
import BottomNav from '../Navigation/BottomNav.jsx';
import SideNav from '../Navigation/SideNav.jsx';
import './ResponsiveLayout.css';

export default function ResponsiveLayout({ children }) {
    const deviceType = useDeviceType();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className={`app-layout device-${deviceType}`}>
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
        </div>
    );
}
