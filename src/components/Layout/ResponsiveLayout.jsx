import { useDeviceType } from '../../hooks/useMediaQuery.js';
import BottomNav from '../Navigation/BottomNav.jsx';
import SideNav from '../Navigation/SideNav.jsx';
import './ResponsiveLayout.css';

export default function ResponsiveLayout({ children }) {
    const deviceType = useDeviceType();

    return (
        <div className={`app-layout device-${deviceType}`}>
            {(deviceType === 'tablet' || deviceType === 'desktop') && <SideNav />}

            <main className="main-content">
                {children}
            </main>

            {deviceType === 'mobile' && <BottomNav />}
        </div>
    );
}
