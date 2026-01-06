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
    const [sendingIndex, setSendingIndex] = useState(-1);

    // Get friends with outstanding balances and WhatsApp numbers
    const friendsToRemind = friends.filter(f =>
        f.whatsapp_number && f.balance !== 0
    );

    const lendingReminders = friendsToRemind.filter(f => f.balance > 0);
    const borrowingReminders = friendsToRemind.filter(f => f.balance < 0);

    const handleSendAll = () => {
        if (friendsToRemind.length === 0) {
            alert('No friends with WhatsApp numbers and outstanding balances.');
            return;
        }
        setShowModal(true);
    };

    const handleSendReminder = async (friend, index) => {
        setSendingIndex(index);

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

        // Wait a bit before next one
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSendingIndex(-1);
    };

    const handleSendAllSequentially = async () => {
        for (let i = 0; i < friendsToRemind.length; i++) {
            await handleSendReminder(friendsToRemind[i], i);
        }
        setShowModal(false);
    };

    if (friendsToRemind.length === 0) {
        return null;
    }

    return (
        <>
            <Button
                variant="success"
                onClick={handleSendAll}
                style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}
            >
                📱 Send All Reminders ({friendsToRemind.length})
            </Button>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="📱 Send All WhatsApp Reminders"
                size="md"
            >
                <div className="bulk-reminder-modal">
                    <p className="bulk-reminder-intro">
                        Ready to send {friendsToRemind.length} reminder{friendsToRemind.length > 1 ? 's' : ''}?
                    </p>

                    {lendingReminders.length > 0 && (
                        <div className="reminder-section">
                            <h4>💸 Money You Lent ({lendingReminders.length})</h4>
                            <ul className="reminder-list">
                                {lendingReminders.map((friend, idx) => (
                                    <li key={friend.id} className={sendingIndex === idx ? 'sending' : ''}>
                                        {friend.name} - {formatCurrency(friend.balance, currency)}
                                        {sendingIndex === idx && <span className="sending-indicator"> ⏳ Sending...</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {borrowingReminders.length > 0 && (
                        <div className="reminder-section">
                            <h4>💰 Money You Borrowed ({borrowingReminders.length})</h4>
                            <ul className="reminder-list">
                                {borrowingReminders.map((friend, idx) => (
                                    <li key={friend.id} className={sendingIndex === (lendingReminders.length + idx) ? 'sending' : ''}>
                                        {friend.name} - {formatCurrency(Math.abs(friend.balance), currency)}
                                        {sendingIndex === (lendingReminders.length + idx) && <span className="sending-indicator"> ⏳ Sending...</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="bulk-reminder-note">
                        <p>⚠️ <strong>Note:</strong> Each reminder will open in a new WhatsApp tab. You'll need to click "Send" in each tab.</p>
                        <p>💡 <strong>Tip:</strong> WhatsApp tabs will open one by one with a 1-second delay.</p>
                    </div>

                    <div className="modal-footer">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="success"
                            onClick={handleSendAllSequentially}
                            disabled={sendingIndex >= 0}
                        >
                            {sendingIndex >= 0 ? 'Sending...' : `Send All ${friendsToRemind.length} Reminders`}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
