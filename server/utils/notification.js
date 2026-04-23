
import db from '../config/db.js';

/**
 * Create a new notification for a user
 * @param {number} userId - The user ID to notify
 * @param {string} type - The notification type (e.g., 'TICKET_REPLY', 'TICKET_CLOSED', 'SYSTEM')
 * @param {string} message - The notification message
 * @returns {Promise<number>} - The ID of the created notification
 */
export const createNotification = async (userId, type, message) => {
    try {
        const [result] = await db.query(
            'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
            [userId, type, message]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating notification:', error);
        // Don't throw error to prevent blocking the main action
        return null;
    }
};
