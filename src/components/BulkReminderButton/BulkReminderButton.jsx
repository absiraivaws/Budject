import { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import Button from '../UI/Button.jsx';
import Modal from '../UI/Modal.jsx';
import {
    generateLendingReminderMessage,
    generateBorrowingReminderMessage,
    openWhatsAppLink
} from '../../services/whatsappLinkService.js';
import { formatCurrency } from '../../utils/currency.js';
import './BulkReminderButton.css';

export default function BulkReminderButton({ friends, onReminderSent }) {
    const { currency } = useCurrency();
    const [showModal, setShowModal] = useState(false);
    const [sentReminders, setSentReminders] = useState({}); // Track sent status by friend ID

    // Get friends with outstanding balances and WhatsApp numbers
    const friendsToRemind = friends.filter(f =>
        f.whatsapp_number && f.balance !== 0
    );

    const lendingReminders = friendsToRemind.filter(f => f.balance > 0);
    const borrowingReminders = friendsToRemind.filter(f => f.balance < 0);

    const handleOpenModal = () => {
        if (friendsToRemind.length === 0) {
            alert('No friends with WhatsApp numbers and outstanding balances.');
            return;
        }
        setSentReminders({}); // Reset sent state on open
        setShowModal(true);
    };

    const handleSendReminder = async (friend) => {
        // Mark as sent immediately to disable button
        setSentReminders(prev => ({ ...prev, [friend.id]: true }));

        const isLending = friend.balance > 0;
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

        // Open WhatsApp
        openWhatsAppLink(friend.whatsapp_number, message);

        // Call callback if provided
        if (onReminderSent) {
            await onReminderSent(friend);
        }
    };

    if (friendsToRemind.length === 0) {
        return null;
    }

    const ReminderItem = ({ friend }) => (
        <li key={friend.id} className={sentReminders[friend.id] ? 'sent' : ''}>
            <div className="reminder-info">
                <span className="friend-name">{friend.name}</span>
                <span className="friend-amount">{formatCurrency(Math.abs(friend.balance), currency)}</span>
            </div>
            <Button
                variant={sentReminders[friend.id] ? "secondary" : "success"}
                size="sm"
                onClick={() => handleSendReminder(friend)}
                disabled={sentReminders[friend.id]}
            >
                {sentReminders[friend.id] ? 'Sent' : 'WhatsApp'}
            </Button>
        </li>
    );

    return (
        <>
            <Button
                variant="success"
                onClick={handleOpenModal}
                style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}
            >
                📱 Send All Reminders ({friendsToRemind.length})
            </Button>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="📱 Send WhatsApp Reminders"
                size="md"
            >
                <div className="bulk-reminder-modal">
                    <p className="bulk-reminder-intro">
                        Send reminders individually to your friends.
                    </p>

                    {lendingReminders.length > 0 && (
                        <div className="reminder-section">
                            <h4>💸 Money You Lent ({lendingReminders.length})</h4>
                            <ul className="reminder-list">
                                {lendingReminders.map(friend => (
                                    <ReminderItem key={friend.id} friend={friend} />
                                ))}
                            </ul>
                        </div>
                    )}

                    {borrowingReminders.length > 0 && (
                        <div className="reminder-section">
                            <h4>💰 Money You Borrowed ({borrowingReminders.length})</h4>
                            <ul className="reminder-list">
                                {borrowingReminders.map(friend => (
                                    <ReminderItem key={friend.id} friend={friend} />
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="bulk-reminder-note">
                        <p>⚠️ <strong>Note:</strong> Clicking "WhatsApp" will open a new tab. You must click "Send" in WhatsApp yourself.</p>
                    </div>

                    <div className="modal-footer">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
