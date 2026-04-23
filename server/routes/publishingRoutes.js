import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../config/db.js';
import xlsx from 'xlsx';
import { authenticateToken } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// --- File Upload Configuration ---
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const KTP_DIR = path.join(UPLOADS_DIR, 'ktp');
const NPWP_DIR = path.join(UPLOADS_DIR, 'npwp');
const LYRICS_DIR = path.join(UPLOADS_DIR, 'lyrics');
const REPORTS_DIR = path.join(UPLOADS_DIR, 'publishing_reports');

[KTP_DIR, NPWP_DIR, LYRICS_DIR, REPORTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'ktp') cb(null, KTP_DIR);
        else if (file.fieldname === 'npwp') cb(null, NPWP_DIR);
        else if (file.fieldname === 'lyrics') cb(null, LYRICS_DIR);
        else if (file.fieldname === 'report') cb(null, REPORTS_DIR);
        else cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


// --- 1. Writers (Data Pencipta) Routes ---

// Get all writers for Publishing Contracts (Admin only)
router.get('/contracts/publishing', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const [cols] = await db.query('SHOW COLUMNS FROM writers'); // Assuming 'writers' is the correct table for songwriters/creators
        const colNames = cols.map(c => c.Field);
        
        const selectParts = [
            'id',
            'name',
            'user_id',
            colNames.includes('contract_status') ? 'contract_status' : `'Not Generated' as contract_status`,
            'created_at'
        ];
        
        const sql = `
            SELECT ${selectParts.join(', ')}, u.username as user_name, u.email as user_email
            FROM writers w
            LEFT JOIN users u ON w.user_id = u.id
            ORDER BY w.created_at DESC
        `;
        
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching publishing contracts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE PUBLISHING CONTRACT (Admin only) - Reset status to 'Not Generated'
router.delete('/contracts/publishing/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const writerId = req.params.id;
        
        // Reset contract_status to 'Not Generated' instead of deleting writer
        await db.query(`UPDATE writers SET contract_status = 'Not Generated' WHERE id = ?`, [writerId]);
        
        res.json({ message: 'Publishing contract status reset successfully' });
    } catch (err) {
        console.error('Error deleting publishing contract:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all writers
router.get('/creators', authenticateToken, async (req, res) => {
    try {
        let sql = 'SELECT * FROM writers';
        const params = [];

        if (req.user.role !== 'Admin') {
            sql += ' WHERE user_id = ?';
            params.push(req.user.id);
        }
        
        sql += ' ORDER BY created_at DESC';

        const [writers] = await db.query(sql, params);
        res.json(writers);
    } catch (error) {
        console.error('Error fetching writers:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single creator
router.get('/creators/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [writer] = await db.query('SELECT * FROM writers WHERE id = ?', [id]);
        
        if (writer.length === 0) {
            return res.status(404).json({ message: 'Writer not found' });
        }

        // Security check
        if (req.user.role !== 'Admin' && writer[0].user_id !== req.user.id) {
             return res.status(403).json({ message: 'Forbidden' });
        }

        // Fetch songs associated with this writer (by name)
        const [songs] = await db.query(`
            SELECT s.id, s.title, s.status, sw.share_percent, sw.role
            FROM songs s
            JOIN song_writers sw ON s.id = sw.song_id
            WHERE sw.name = ?
            ORDER BY s.created_at DESC
        `, [writer[0].name]);

        res.json({ ...writer[0], songs });
    } catch (error) {
        console.error('Error fetching writer:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create writer
router.post('/creators', authenticateToken, upload.fields([{ name: 'ktp', maxCount: 1 }, { name: 'npwp', maxCount: 1 }]), async (req, res) => {
    try {
        const {
            name, nik, birth_place, birth_date, address, 
            nationality,
            bank_name, bank_account_name, bank_account_number, whatsapp_number
        } = req.body;

        const ktp_path = req.files['ktp'] ? `/uploads/ktp/${req.files['ktp'][0].filename}` : null;
        const npwp_path = req.files['npwp'] ? `/uploads/npwp/${req.files['npwp'][0].filename}` : null;

        const user_id = req.user.role === 'Admin' ? (req.body.user_id || null) : req.user.id;

        const [result] = await db.query(
            `INSERT INTO writers (
                name, nik, birth_place, birth_date, address, 
                nationality, 
                ktp_path, npwp_path, 
                bank_name, bank_account_name, bank_account_number, whatsapp_number,
                user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, nik, birth_place, birth_date, address,
                nationality,
                ktp_path, npwp_path,
                bank_name, bank_account_name, bank_account_number, whatsapp_number,
                user_id
            ]
        );

        res.status(201).json({ message: 'Writer added', id: result.insertId });
    } catch (error) {
        console.error('Error creating creator:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update creator
router.put('/creators/:id', authenticateToken, upload.fields([{ name: 'ktp', maxCount: 1 }, { name: 'npwp', maxCount: 1 }]), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Handle files
        if (req.files['ktp']) updates.ktp_path = `/uploads/ktp/${req.files['ktp'][0].filename}`;
        if (req.files['npwp']) updates.npwp_path = `/uploads/npwp/${req.files['npwp'][0].filename}`;

        // Security check
        if (req.user.role !== 'Admin') {
             const [check] = await db.query('SELECT user_id FROM writers WHERE id = ?', [id]);
             if (check.length === 0 || check[0].user_id !== req.user.id) {
                 return res.status(403).json({ message: 'Forbidden' });
             }
        }

        // Construct dynamic query
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(updates)) {
            if (['name', 'nik', 'birth_place', 'birth_date', 'address', 'nationality', 'ktp_path', 'npwp_path', 'bank_name', 'bank_account_name', 'bank_account_number', 'whatsapp_number'].includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return res.json({ message: 'No changes' });

        values.push(id);
        await db.query(`UPDATE writers SET ${fields.join(', ')} WHERE id = ?`, values);

        res.json({ message: 'Writer updated' });
    } catch (error) {
        console.error('Error updating writer:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete writer
router.delete('/creators/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (req.user.role !== 'Admin') {
            const [check] = await db.query('SELECT user_id FROM writers WHERE id = ?', [id]);
            if (check.length === 0 || check[0].user_id !== req.user.id) {
                return res.status(403).json({ message: 'Forbidden' });
            }
        }

        await db.query('DELETE FROM writers WHERE id = ?', [id]);
        res.json({ message: 'Writer deleted' });
    } catch (error) {
        console.error('Error deleting writer:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// --- 2. Songs (Data Lagu) Routes ---

// Get all songs
router.get('/songs', authenticateToken, async (req, res) => {
    try {
        let sql = `
            SELECT s.*, u.email as user_email,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('name', w.name, 'role', w.role, 'share_percent', w.share_percent)) 
             FROM song_writers w WHERE w.song_id = s.id) as writers
            FROM songs s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role !== 'Admin') {
            sql += ' AND s.user_id = ?';
            params.push(req.user.id);
        }

        sql += ' ORDER BY s.created_at DESC';

        const [songs] = await db.query(sql, params);
        res.json(songs);
    } catch (error) {
        console.error('Error fetching songs:', error);
        res.json([]);
    }
});

// Create song
router.post('/songs', authenticateToken, upload.single('lyrics'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        let writersData = req.body.writers;
        if (typeof writersData === 'string') {
            try { writersData = JSON.parse(writersData); } catch {}
        }

        const {
            song_id, title, other_title, authorized_rights, performer,
            duration, genre, language, region, iswc, isrc, note
        } = req.body;

        const lyrics_file = req.file ? `/uploads/lyrics/${req.file.filename}` : null;
        const user_id = req.user.id;
        const status = req.user.role === 'Admin' ? (req.body.status || 'accepted') : 'pending';

        const [result] = await connection.query(
            `INSERT INTO songs (
                song_id, title, other_title, authorized_rights, performer, 
                duration, genre, language, region, iswc, isrc, note, 
                status, user_id, lyrics_file
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                song_id || null, title, other_title, authorized_rights, performer,
                duration, genre, language, region, iswc, isrc, note,
                status, user_id, lyrics_file
            ]
        );

        const newSongId = result.insertId;

        if (writersData && Array.isArray(writersData)) {
            const writerValues = writersData.map(w => [newSongId, w.name, w.share_percent || 0, w.role]);
            if (writerValues.length > 0) {
                await connection.query(
                    'INSERT INTO song_writers (song_id, name, share_percent, role) VALUES ?',
                    [writerValues]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Song created', id: newSongId });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating song:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
});

// Update song status (Admin)
router.put('/songs/:id/status', authenticateToken, async (req, res) => {
    try {
        console.log('Update status request:', req.body);
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const { status, rejection_reason, song_id } = req.body;
        const { id } = req.params;

        const updates = ['status = ?'];
        const params = [status];

        if (rejection_reason !== undefined) {
            updates.push('rejection_reason = ?');
            params.push(rejection_reason);
        }
        
        if (song_id !== undefined) {
            updates.push('song_id = ?');
            params.push(song_id);
        }

        params.push(id);
        
        console.log('Update params:', updates, params);

        await db.query(`UPDATE songs SET ${updates.join(', ')} WHERE id = ?`, params);
        res.json({ message: 'Song status updated' });
    } catch (error) {
        console.error('Error updating song status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update song details
router.put('/songs/:id', authenticateToken, upload.single('lyrics'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const {
            song_id, title, other_title, authorized_rights, performer,
            duration, genre, language, region, iswc, isrc, note
        } = req.body;

        // Security check
        if (req.user.role !== 'Admin') {
            const [check] = await connection.query('SELECT user_id FROM songs WHERE id = ?', [id]);
            if (check.length === 0 || check[0].user_id !== req.user.id) {
                await connection.rollback();
                return res.status(403).json({ message: 'Forbidden' });
            }
        }

        let updates = [];
        let params = [];

        // Add fields to update
        const fields = {
            song_id, title, other_title, authorized_rights, performer,
            duration, genre, language, region, iswc, isrc, note
        };

        for (const [key, value] of Object.entries(fields)) {
            if (value !== undefined) {
                updates.push(`${key} = ?`);
                params.push(value);
            }
        }

        if (req.file) {
            updates.push('lyrics_file = ?');
            params.push(`/uploads/lyrics/${req.file.filename}`);
        }

        if (updates.length > 0) {
            params.push(id);
            await connection.query(`UPDATE songs SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        // Update writers if provided
        let writersData = req.body.writers;
        if (writersData) {
            if (typeof writersData === 'string') {
                try { writersData = JSON.parse(writersData); } catch {}
            }

            if (Array.isArray(writersData)) {
                // Delete existing writers
                await connection.query('DELETE FROM song_writers WHERE song_id = ?', [id]);

                // Insert new writers
                const writerValues = writersData.map(w => [id, w.name, w.share_percent || 0, w.role]);
                if (writerValues.length > 0) {
                    await connection.query(
                        'INSERT INTO song_writers (song_id, name, share_percent, role) VALUES ?',
                        [writerValues]
                    );
                }
            }
        }

        await connection.commit();
        res.json({ message: 'Song updated' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating song:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
});

// Delete song
router.delete('/songs/:id', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;

        // Security check
        if (req.user.role !== 'Admin') {
            const [check] = await connection.query('SELECT user_id FROM songs WHERE id = ?', [id]);
            if (check.length === 0 || check[0].user_id !== req.user.id) {
                await connection.rollback();
                return res.status(403).json({ message: 'Forbidden' });
            }
        }

        // Delete related data first (though CASCADE might handle it, let's be safe)
        await connection.query('DELETE FROM song_writers WHERE song_id = ?', [id]);
        await connection.query('DELETE FROM publishing_reports WHERE song_id = ?', [id]);
        
        // Delete song
        await connection.query('DELETE FROM songs WHERE id = ?', [id]);

        await connection.commit();
        res.json({ message: 'Song deleted' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting song:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
});


// --- 3. Reports Routes ---

// Upload Report (Excel)
router.post('/reports/upload', authenticateToken, upload.single('report'), async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const { month, year, period } = req.body;
        const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const currentYear = year ? parseInt(year) : new Date().getFullYear();

        // Cache songs
        const [songs] = await db.query('SELECT id, song_id FROM songs WHERE song_id IS NOT NULL');
        const songMap = new Map();
        songs.forEach(s => songMap.set(String(s.song_id).trim(), s.id));

        const reportsToInsert = [];
        const errors = [];

        const parseNum = (val) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') return parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0;
            return 0;
        };

        for (const row of data) {
            const customId = row['Custom ID'] ? String(row['Custom ID']).trim() : '';
            let songId = null;

            if (customId && songMap.has(customId)) {
                songId = songMap.get(customId);
            } else if (customId) {
                errors.push(`Custom ID ${customId} not found`);
            }

            reportsToInsert.push([
                songId,
                customId,
                row['Judul'] || '',
                row['Pencipta'] || '',
                row['Asal Report'] || '',
                parseNum(row['Revenue']),
                parseNum(row['Deduction']),
                parseNum(row['Net Revenue']),
                parseNum(row['Sub Publisher Share']),
                parseNum(row['TBW Share']),
                currentMonth,
                currentYear
            ]);
        }

        if (reportsToInsert.length > 0) {
            await db.query(
                `INSERT INTO publishing_reports (
                    song_id, custom_id, title, writer, source, 
                    gross_revenue, deduction, net_revenue, sub_pub_share, tbw_share, 
                    month, year
                ) VALUES ?`,
                [reportsToInsert]
            );

            await db.query(
                `INSERT INTO import_history (
                    file_name, month, year, period, total_records, status
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [req.file.originalname, currentMonth, currentYear, period || '', reportsToInsert.length, errors.length > 0 ? 'Partial' : 'Success']
            );
        }

        res.json({ message: 'Processed', inserted: reportsToInsert.length, errors });
    } catch (error) {
        console.error('Error processing report:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Reports
router.get('/reports', authenticateToken, async (req, res) => {
    try {
        const { month, year } = req.query;
        let sql = 'SELECT * FROM publishing_reports WHERE 1=1';
        const params = [];

        if (month) { sql += ' AND month = ?'; params.push(month); }
        if (year) { sql += ' AND year = ?'; params.push(year); }

        if (req.user.role !== 'Admin') {
            // Only show reports for songs owned by user
            sql += ' AND song_id IN (SELECT id FROM songs WHERE user_id = ?)';
            params.push(req.user.id);
        }

        sql += ' LIMIT 1000'; // Safety limit

        const [reports] = await db.query(sql, params);
        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// --- 4. Analytics Routes ---

router.get('/analytics/stats', authenticateToken, async (req, res) => {
    try {
        const isAdmin = req.user.role === 'Admin';
        const userId = isAdmin ? null : req.user.id;

        // Ensure non-admins ALWAYS filter by userId
        // If userId is missing for non-admin, force empty result or error
        if (!isAdmin && !userId) {
            return res.json({
                totalRevenue: 0,
                totalSongs: 0,
                pendingSongs: 0,
                approvedSongs: 0,
                topSongs: [],
                topWriters: [],
                monthlyData: []
            });
        }
        
        // 1. Total Revenue
        let revSql = 'SELECT SUM(sub_pub_share) as total FROM publishing_reports';
        let revParams = [];
        if (!isAdmin) {
            revSql += ' WHERE song_id IN (SELECT id FROM songs WHERE user_id = ?)';
            revParams.push(userId);
        }
        const [revResult] = await db.query(revSql, revParams);
        const totalRevenue = revResult[0].total || 0;

        // 2. Song Stats
        let songSql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as approved
            FROM songs
        `;
        let songParams = [];
        if (userId) {
            songSql += ' WHERE user_id = ?';
            songParams.push(userId);
        }
        const [songResult] = await db.query(songSql, songParams);
        const songStats = songResult[0];

        // 3. Top Songs
        let topSql = `
            SELECT title, SUM(sub_pub_share) as revenue 
            FROM publishing_reports 
            ${userId ? 'WHERE song_id IN (SELECT id FROM songs WHERE user_id = ?)' : ''}
            GROUP BY title 
            ORDER BY revenue DESC 
            LIMIT 5
        `;
        const [topSongs] = await db.query(topSql, userId ? [userId] : []);

        // 4. Monthly Data (Last 12 months)
        let monthSql = `
            SELECT month, year, SUM(sub_pub_share) as revenue
            FROM publishing_reports
            ${userId ? 'WHERE song_id IN (SELECT id FROM songs WHERE user_id = ?)' : ''}
            GROUP BY year, month
            ORDER BY year DESC, month DESC
            LIMIT 12
        `;
        const [monthlyData] = await db.query(monthSql, userId ? [userId] : []);

        // 5. Top Writers
        let writerSql = `
            SELECT 
                sw.name, 
                SUM(pr.sub_pub_share * (sw.share_percent / 100)) as revenue
            FROM publishing_reports pr
            JOIN songs s ON pr.song_id = s.id
            JOIN song_writers sw ON s.id = sw.song_id
            ${userId ? 'WHERE s.user_id = ?' : ''}
            GROUP BY sw.name
            ORDER BY revenue DESC
            LIMIT 5
        `;
        const [topWriters] = await db.query(writerSql, userId ? [userId] : []);

        res.json({
            totalRevenue,
            totalSongs: songStats.total,
            pendingSongs: songStats.pending,
            approvedSongs: songStats.approved,
            topSongs,
            topWriters,
            monthlyData
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
