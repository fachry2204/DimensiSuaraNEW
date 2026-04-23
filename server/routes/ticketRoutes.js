import express from 'express';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { createNotification } from '../utils/notification.js';

const router = express.Router();

// Get all tickets (Admin sees all, User sees own)
router.get('/', authenticateToken, async (req, res) => {
    try {
        let sql = `
            SELECT t.*, u.username as user_name, u.email as user_email
            FROM tickets t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role !== 'Admin') {
            sql += ' AND t.user_id = ?';
            params.push(req.user.id);
        }

        sql += ' ORDER BY t.updated_at DESC';

        const [tickets] = await db.query(sql, params);
        res.json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new ticket
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ message: 'Subject and message are required' });
        }

        // Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Create ticket
            const [ticketResult] = await connection.query(
                'INSERT INTO tickets (user_id, subject, status) VALUES (?, ?, ?)',
                [req.user.id, subject, 'Pending']
            );
            const ticketId = ticketResult.insertId;

            // Create initial message
            await connection.query(
                'INSERT INTO ticket_messages (ticket_id, sender_id, sender_role, message) VALUES (?, ?, ?, ?)',
                [ticketId, req.user.id, req.user.role, message]
            );

            await connection.commit();
            res.status(201).json({ message: 'Ticket created', id: ticketId });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get ticket details and messages
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const ticketId = req.params.id;

        // Get ticket info
        const [tickets] = await db.query(
            `SELECT t.*, u.username as user_name, u.email as user_email
             FROM tickets t
             LEFT JOIN users u ON t.user_id = u.id
             WHERE t.id = ?`,
            [ticketId]
        );

        if (tickets.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = tickets[0];

        // Check access
        if (req.user.role !== 'Admin' && ticket.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get messages
        const [messages] = await db.query(
            `SELECT tm.*, u.username as sender_name
             FROM ticket_messages tm
             LEFT JOIN users u ON tm.sender_id = u.id
             WHERE tm.ticket_id = ?
             ORDER BY tm.created_at ASC`,
            [ticketId]
        );

        res.json({ ticket, messages });
    } catch (error) {
        console.error('Error fetching ticket details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reply to a ticket
router.post('/:id/reply', authenticateToken, async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Get ticket to check ownership/existence
        const [tickets] = await db.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
        if (tickets.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        const ticket = tickets[0];

        // Check access
        if (req.user.role !== 'Admin' && ticket.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Determine new status
        // If Admin replies -> 'Replied'
        // If User replies -> 'Pending' (so Admin notices it again)
        let newStatus = ticket.status;
        if (req.user.role === 'Admin') {
            newStatus = 'Replied';
        } else {
            newStatus = 'Pending';
        }

        // Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Add message
            await connection.query(
                'INSERT INTO ticket_messages (ticket_id, sender_id, sender_role, message) VALUES (?, ?, ?, ?)',
                [ticketId, req.user.id, req.user.role, message]
            );

            // Update ticket status and updated_at
            await connection.query(
                'UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?',
                [newStatus, ticketId]
            );

            await connection.commit();
            
            // Notify user if Admin replied
            if (req.user.role === 'Admin') {
                createNotification(
                    ticket.user_id,
                    'TICKET_REPLY',
                    `Admin membalas tiket Anda: ${ticket.subject}`
                );
            }

            res.json({ message: 'Reply added', status: newStatus });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error replying to ticket:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Close ticket (Admin only)
router.put('/:id/close', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const ticketId = req.params.id;

        // Get ticket details for notification
        const [tickets] = await db.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
        if (tickets.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        const ticket = tickets[0];

        await db.query(
            'UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?',
            ['Closed', ticketId]
        );

        // Notify user
        createNotification(
            ticket.user_id,
            'TICKET_CLOSED',
            `Tiket Anda telah ditutup: ${ticket.subject}`
        );

        res.json({ message: 'Ticket closed' });
    } catch (error) {
        console.error('Error closing ticket:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
