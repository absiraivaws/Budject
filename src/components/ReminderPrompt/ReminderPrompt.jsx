import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../UI/Button.jsx';
import './ReminderPrompt.css';

export default function ReminderPrompt({ onClose, onDismissToday }) {
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Animate in after a short delay
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleAddTransaction = () => {
        navigate('/transactions');
        onClose();
    };

    const handleRemindLater = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const handleDismissToday = () => {
        setIsVisible(false);
        setTimeout(() => {
            onDismissToday();
            onClose();
        }, 300);
    };

    return (
        <div className={`reminder-prompt-overlay ${isVisible ? 'visible' : ''}`}>
            <div className={`reminder-prompt ${isVisible ? 'visible' : ''}`}>
                <div className="reminder-icon">💰</div>
                <h3 className="reminder-title">Haven't logged transactions today?</h3>
                <p className="reminder-message">
                    Take a moment to track your expenses and keep your budget on track!
                </p>

                <div className="reminder-actions">
                    <Button
                        variant="primary"
                        onClick={handleAddTransaction}
                        className="reminder-btn-primary"
                    >
                        📝 Add Transaction
                    </Button>

                    <div className="reminder-secondary-actions">
                        <button
                            className="reminder-link-btn"
                            onClick={handleRemindLater}
                        >
                            Remind me later
                        </button>
                        <button
                            className="reminder-link-btn"
                            onClick={handleDismissToday}
                        >
                            Don't show again today
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
