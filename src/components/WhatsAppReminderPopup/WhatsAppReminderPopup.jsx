import { useCurrency } from '../../context/CurrencyContext.jsx';
import Modal from '../UI/Modal.jsx';
import Button from '../UI/Button.jsx';
import { formatCurrency } from '../../utils/currency.js';
import { formatDate } from '../../utils/dateUtils.js';
import './WhatsAppReminderPopup.css';

export default function WhatsAppReminderPopup({ pendingReminders, onClose, onSendReminder }) {
    const { currency } = useCurrency();
    const { lending, borrowing } = pendingReminders;
    const totalPending = lending.length + borrowing.length;

    if (totalPending === 0) return null;

    return (
        <Modal isOpen={true} onClose={onClose} title="📱 Pending WhatsApp Reminders" size="md">
            <div className="reminder-popup">
                <p className="reminder-intro">
                    You have {totalPending} pending reminder{totalPending > 1 ? 's' : ''} for friends with outstanding balances.
                </p>

                {lending.length > 0 && (
                    <div className="reminder-section">
                        <h4 className="reminder-section-title">💸 Money You Lent ({lending.length})</h4>
                        <div className="reminder-list">
                            {lending.map(friend => (
                                <div key={friend.id} className="reminder-item">
                                    <div className="reminder-info">
                                        <div className="reminder-name">{friend.name}</div>
                                        <div className="reminder-details">
                                            <span className="reminder-amount text-warning">
                                                {formatCurrency(friend.balance, currency)}
                                            </span>
                                            {friend.return_date && (
                                                <span className="reminder-due">
                                                    Due: {formatDate(friend.return_date, 'short')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => onSendReminder(friend, 'lending')}
                                    >
                                        📱 Send
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {borrowing.length > 0 && (
                    <div className="reminder-section">
                        <h4 className="reminder-section-title">💰 Money You Borrowed ({borrowing.length})</h4>
                        <div className="reminder-list">
                            {borrowing.map(friend => (
                                <div key={friend.id} className="reminder-item">
                                    <div className="reminder-info">
                                        <div className="reminder-name">{friend.name}</div>
                                        <div className="reminder-details">
                                            <span className="reminder-amount text-danger">
                                                {formatCurrency(Math.abs(friend.balance), currency)}
                                            </span>
                                            {friend.return_date && (
                                                <span className="reminder-due">
                                                    Due: {formatDate(friend.return_date, 'short')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => onSendReminder(friend, 'borrowing')}
                                    >
                                        📱 Send
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="reminder-actions">
                    <Button variant="secondary" onClick={onClose}>
                        Remind Me Later
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
