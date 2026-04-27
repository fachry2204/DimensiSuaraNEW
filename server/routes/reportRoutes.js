import express from 'express';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET REPORTS
router.get('/', authenticateToken, async (req, res) => {
    try {
        let sql = 'SELECT * FROM reports';
        const params = [];

        if (req.user.role !== 'Admin') {
            sql += ` WHERE 
                (upc IN (SELECT upc FROM releases WHERE user_id = ?))
                OR 
                (isrc IN (SELECT t.isrc FROM tracks t JOIN releases r ON t.release_id = r.id WHERE r.user_id = ?))`;
            params.push(req.user.id, req.user.id);
        }

        sql += ' ORDER BY period DESC';
        
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// IMPORT REPORTS (Batch Insert)
router.post('/import', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const { data } = req.body; // Array of report objects
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ error: 'No data provided' });
        }

        // Prepare bulk insert
        // Columns: period, upc, isrc, title, artist, platform, country, quantity, revenue, original_file_name,
        // sales_period, reporting_period, album_title, release_date, royalty_type, sales_type, sales_sub_type
        const values = data.map(row => [
            row.period, row.upc, row.isrc, row.title, row.artist, 
            row.platform, row.country, row.quantity, row.revenue, row.originalFileName,
            row.sales_period, row.reporting_period, row.album_title, row.release_date, 
            row.royalty_type, row.sales_type, row.sales_sub_type
        ]);

        const sql = `INSERT INTO reports 
            (\`period\`, \`upc\`, \`isrc\`, \`title\`, \`artist\`, \`platform\`, \`country\`, \`quantity\`, \`revenue\`, \`original_file_name\`,
             \`sales_period\`, \`reporting_period\`, \`album_title\`, \`release_date\`, \`royalty_type\`, \`sales_type\`, \`sales_sub_type\`) 
            VALUES ?`;

        console.log(`Importing ${values.length} rows into reports table...`);
        const [result] = await db.query(sql, [values]);

        res.json({ message: `Successfully imported ${result.affectedRows} rows` });
    } catch (err) {
        console.error('Import Database Error:', err);
        res.status(500).json({ error: err.sqlMessage || err.message || 'Database error during import' });
    }
});

// DELETE BATCH OF REPORTS (Admin Only)
router.post('/delete-batch', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const { fileName, timestamp } = req.body;
        if (!fileName || !timestamp) {
            return res.status(400).json({ error: 'Missing fileName or timestamp' });
        }

        const sql = 'DELETE FROM reports WHERE original_file_name = ? AND created_at = ?';
        const [result] = await db.query(sql, [fileName, timestamp]);

        res.json({ message: `Successfully deleted ${result.affectedRows} rows` });
    } catch (err) {
        console.error('Delete Batch Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
