import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure Multer for Profile Pictures
const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const PROFILES_DIR = path.join(UPLOADS_ROOT, 'profiles');

if (!fs.existsSync(PROFILES_DIR)) fs.mkdirSync(PROFILES_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PROFILES_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const baseType = req.body && req.body.type ? String(req.body.type).toLowerCase() : 'profile';
        cb(null, baseType + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// PUBLIC: Upload registration documents (KTP, NPWP, NIB, Kemenkumham)
router.post('/upload-doc', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const filePath = `/uploads/profiles/${req.file.filename}`;
        res.json({ path: filePath });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET CURRENT USER PROFILE
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [cols] = await db.query('SHOW COLUMNS FROM users');
        const colNames = cols.map(c => c.Field);
        
        const selectParts = [
            'id',
            'username',
            'email',
            'role',
            colNames.includes('status') ? 'status' : `'Active' as status`,
            colNames.includes('profile_picture') ? 'profile_picture' : 'NULL as profile_picture',
            colNames.includes('account_type') ? 'account_type' : 'NULL as account_type',
            colNames.includes('company_name') ? 'company_name' : 'NULL as company_name',
            colNames.includes('nik') ? 'nik' : 'NULL as nik',
            colNames.includes('full_name') ? 'full_name' : 'NULL as full_name',
            colNames.includes('address') ? 'address' : 'NULL as address',
            colNames.includes('country') ? 'country' : 'NULL as country',
            colNames.includes('province') ? 'province' : 'NULL as province',
            colNames.includes('city') ? 'city' : 'NULL as city',
            colNames.includes('district') ? 'district' : 'NULL as district',
            colNames.includes('subdistrict') ? 'subdistrict' : 'NULL as subdistrict',
            colNames.includes('postal_code') ? 'postal_code' : 'NULL as postal_code',
            colNames.includes('phone') ? 'phone' : 'NULL as phone',
            colNames.includes('pic_name') ? 'pic_name' : 'NULL as pic_name',
            colNames.includes('pic_position') ? 'pic_position' : 'NULL as pic_position',
            colNames.includes('pic_phone') ? 'pic_phone' : 'NULL as pic_phone',
            colNames.includes('nib_doc_path') ? 'nib_doc_path' : 'NULL as nib_doc_path',
            colNames.includes('kemenkumham_doc_path') ? 'kemenkumham_doc_path' : 'NULL as kemenkumham_doc_path',
            colNames.includes('ktp_doc_path') ? 'ktp_doc_path' : 'NULL as ktp_doc_path',
            colNames.includes('npwp_doc_path') ? 'npwp_doc_path' : 'NULL as npwp_doc_path',
            colNames.includes('signature_doc_path') ? 'signature_doc_path' : 'NULL as signature_doc_path',
            colNames.includes('joined_date') ? 'DATE_FORMAT(joined_date, "%Y-%m-%d") as joinedDate' : 'NULL as joinedDate',
            colNames.includes('registered_at') ? 'DATE_FORMAT(registered_at, "%Y-%m-%d") as registeredDate' : 'NULL as registeredDate',
            colNames.includes('rejection_reason') ? 'rejection_reason' : 'NULL as rejection_reason',
            colNames.includes('aggregator_percentage') ? 'aggregator_percentage' : 'NULL as aggregator_percentage',
            colNames.includes('publishing_percentage') ? 'publishing_percentage' : 'NULL as publishing_percentage',
            colNames.includes('block_reason') ? 'block_reason' : 'NULL as block_reason',
            colNames.includes('blocked_at') ? 'DATE_FORMAT(blocked_at, "%Y-%m-%d") as blockedAt' : 'NULL as blockedAt'
        ];

        const sql = `SELECT ${selectParts.join(', ')} FROM users WHERE id = ?`;
        const [rows] = await db.query(sql, [req.user.id]);
        
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE USER PROFILE
router.put('/profile', authenticateToken, upload.single('profilePicture'), async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userId = req.user.id;
        
        const updates = [];
        const params = [];

        if (username) {
            updates.push('username = ?');
            params.push(username);
        }
        if (email) {
            updates.push('email = ?');
            params.push(email);
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            updates.push('password_hash = ?');
            params.push(hash);
        }

        if (req.file) {
            const profilePath = `/uploads/profiles/${req.file.filename}`;
            updates.push('profile_picture = ?');
            params.push(profilePath);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        params.push(userId);
        
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

        // Fetch updated user
        const [rows] = await db.query('SELECT id, username, email, role, profile_picture FROM users WHERE id = ?', [userId]);
        
        res.json({ message: 'Profile updated successfully', user: rows[0] });

    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// GET USERS FOR AGGREGATOR CONTRACTS (Admin only)
router.get('/contracts/aggregator', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [cols] = await db.query('SHOW COLUMNS FROM users');
        const colNames = cols.map(c => c.Field);
        
        const selectParts = [
            'id',
            'username',
            'email',
            'full_name',
            'role',
            colNames.includes('contract_status') ? 'contract_status' : `'Not Generated' as contract_status`,
            colNames.includes('joined_date') ? 'DATE_FORMAT(joined_date, "%Y-%m-%d") as joinedDate' : 'NULL as joinedDate'
        ];

        // Filter only users (not admins) for contracts usually
        const sql = `SELECT ${selectParts.join(', ')} FROM users WHERE role = 'User' ORDER BY id DESC`;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE USER CONTRACT (Admin only) - Reset status to 'Not Generated'
router.delete('/:id/contract', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const userId = req.params.id;
        
        // Reset contract_status to 'Not Generated' instead of deleting user
        await db.query(`UPDATE users SET contract_status = 'Not Generated' WHERE id = ?`, [userId]);
        
        res.json({ message: 'User contract status reset successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET ALL USERS (Admin/Operator only)
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [cols] = await db.query('SHOW COLUMNS FROM users');
        const colNames = cols.map(c => c.Field);
        const hasStatus = colNames.includes('status');
        const hasJoinedDate = colNames.includes('joined_date');
        const hasRegisteredAt = colNames.includes('registered_at');
        const hasRejectedDate = colNames.includes('rejected_date');
        const hasBlockedAt = colNames.includes('blocked_at');

        const selectParts = [
            'id',
            'username as name',
            'email',
            colNames.includes('full_name') ? 'full_name' : 'NULL as full_name',
            'role',
            hasStatus ? 'status' : `'Active' as status`,
            hasJoinedDate ? 'DATE_FORMAT(joined_date, "%Y-%m-%d") as joinedDate' : 'NULL as joinedDate',
            hasRegisteredAt ? 'DATE_FORMAT(registered_at, "%Y-%m-%d") as registeredDate' : 'NULL as registeredDate',
            hasRejectedDate 
                ? (hasBlockedAt 
                    ? `CASE WHEN status = 'Blocked' THEN DATE_FORMAT(blocked_at, "%Y-%m-%d") ELSE DATE_FORMAT(rejected_date, "%Y-%m-%d") END as rejectedDate` 
                    : `DATE_FORMAT(rejected_date, "%Y-%m-%d") as rejectedDate`)
                : `NULL as rejectedDate`,
            colNames.includes('aggregator_percentage') ? 'aggregator_percentage' : 'NULL as aggregator_percentage',
            colNames.includes('publishing_percentage') ? 'publishing_percentage' : 'NULL as publishing_percentage'
        ];

        const orderBy = hasRegisteredAt ? 'registered_at DESC' : 'id DESC';
        const sql = `SELECT ${selectParts.join(', ')} FROM users ORDER BY ${orderBy}`;

        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE USER (Admin/Operator)
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const { name, email, password, role, status } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const [cols] = await db.query('SHOW COLUMNS FROM users');
        const colNames = cols.map(c => c.Field);
        const hasStatus = colNames.includes('status');
        const hasJoinedDate = colNames.includes('joined_date');
        const hasRegisteredAt = colNames.includes('registered_at');

        let sql = '';
        let params = [];

        if (hasStatus && hasJoinedDate) {
            if ((status || '').toUpperCase() === 'APPROVED') {
                sql = 'INSERT INTO users (username, email, password_hash, role, status, joined_date) VALUES (?, ?, ?, ?, ?, NOW())';
                params = [name, email, hash, role || 'User', 'Approved'];
            } else {
                sql = 'INSERT INTO users (username, email, password_hash, role, status, joined_date) VALUES (?, ?, ?, ?, ?, NULL)';
                params = [name, email, hash, role || 'User', status || 'Active'];
            }
        } else {
            sql = 'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)';
            params = [name, email, hash, role || 'User'];
        }

        const [result] = await db.query(sql, params);

        // Ensure registered_at set explicitly for the new user
        if (hasRegisteredAt) {
            await db.query('UPDATE users SET registered_at = COALESCE(registered_at, NOW()) WHERE id = ?', [result.insertId]);
        }

        // Fetch created user with dates
        const selectParts = [
            'id',
            'username as name',
            'email',
            'role',
            hasStatus ? 'status' : `'Active' as status`,
            colNames.includes('joined_date') ? 'DATE_FORMAT(joined_date, "%Y-%m-%d") as joinedDate' : 'NULL as joinedDate',
            hasRegisteredAt ? 'DATE_FORMAT(registered_at, "%Y-%m-%d") as registeredDate' : 'NULL as registeredDate',
            colNames.includes('rejected_date') ? 'DATE_FORMAT(rejected_date, "%Y-%m-%d") as rejectedDate' : 'NULL as rejectedDate'
        ];
        const [rows] = await db.query(`SELECT ${selectParts.join(', ')} FROM users WHERE id = ?`, [result.insertId]);
        res.status(201).json({ message: 'User created successfully', user: rows[0] });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE USER
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const userId = req.params.id;
        
        // Prevent deleting self (optional but recommended)
        if (parseInt(userId) === req.user.id) {
             return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE USER DETAILS (Admin/Operator)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const userId = req.params.id;
        const { 
            name, email, role, password, 
            full_name, account_type, company_name, nik, phone, address,
            country, province, city, district, subdistrict, postal_code,
            pic_name, pic_position, pic_phone,
            ktp_doc_path, npwp_doc_path, signature_doc_path, nib_doc_path, kemenkumham_doc_path
        } = req.body;

        const updates = [];
        const params = [];

        if (name) {
            updates.push('username = ?');
            params.push(name);
        }
        if (email) {
            updates.push('email = ?');
            params.push(email);
        }
        if (role) {
            updates.push('role = ?');
            params.push(role);
        }
        if (password && password.trim().length > 0) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            updates.push('password_hash = ?');
            params.push(hash);
        }

        // Additional profile fields
        const profileFields = {
            full_name, account_type, company_name, nik, phone, address,
            country, province, city, district, subdistrict, postal_code,
            pic_name, pic_position, pic_phone,
            ktp_doc_path, npwp_doc_path, signature_doc_path, nib_doc_path, kemenkumham_doc_path
        };

        const [cols] = await db.query('SHOW COLUMNS FROM users');
        const colNames = cols.map(c => c.Field);

        Object.entries(profileFields).forEach(([key, value]) => {
            if (value !== undefined && colNames.includes(key)) {
                updates.push(`${key} = ?`);
                params.push(value);
            }
        });

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        params.push(userId);
        
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

        // Fetch updated user
        const selectParts = [
            'id', 'username as name', 'email', 'role', 'status',
            colNames.includes('full_name') ? 'full_name' : 'NULL as full_name',
            colNames.includes('account_type') ? 'account_type' : 'NULL as account_type',
            colNames.includes('ktp_doc_path') ? 'ktp_doc_path' : 'NULL as ktp_doc_path',
            colNames.includes('npwp_doc_path') ? 'npwp_doc_path' : 'NULL as npwp_doc_path',
            colNames.includes('signature_doc_path') ? 'signature_doc_path' : 'NULL as signature_doc_path',
            colNames.includes('nib_doc_path') ? 'nib_doc_path' : 'NULL as nib_doc_path',
            colNames.includes('kemenkumham_doc_path') ? 'kemenkumham_doc_path' : 'NULL as kemenkumham_doc_path'
        ];
        const [rows] = await db.query(`SELECT ${selectParts.join(', ')} FROM users WHERE id = ?`, [userId]);
        
        res.json({ message: 'User updated successfully', user: rows[0] });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// UPDATE USER STATUS (Admin/Operator)
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const userId = req.params.id;
        const { status, reason, aggregator_percentage, publishing_percentage, contract_status } = req.body || {};
        const allowed = ['Pending', 'Review', 'Approved', 'Rejected', 'Active', 'Inactive', 'Blocked'];
        if (!allowed.includes(String(status))) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        if (status === 'Rejected' && (!reason || String(reason).trim().length === 0)) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }
        if (status === 'Blocked' && (!reason || String(reason).trim().length === 0)) {
            return res.status(400).json({ error: 'Block reason is required' });
        }
        if (status === 'Approved') {
            if (aggregator_percentage === undefined || aggregator_percentage === null || publishing_percentage === undefined || publishing_percentage === null) {
                return res.status(400).json({ error: 'Aggregator and Publishing percentages are required for Approved status' });
            }
            if (aggregator_percentage < 0 || aggregator_percentage > 100) {
                return res.status(400).json({ error: 'Aggregator percentage must be between 0 and 100' });
            }
            if (publishing_percentage < 0 || publishing_percentage > 100) {
                return res.status(400).json({ error: 'Publishing percentage must be between 0 and 100' });
            }
        }
        const [cols] = await db.query('SHOW COLUMNS FROM users');
        const colNames = cols.map(c => c.Field);
        if (!colNames.includes('status')) {
            return res.status(400).json({ error: 'Status column not available' });
        }

        const hasJoinedDate = colNames.includes('joined_date');
        const hasRejectedDate = colNames.includes('rejected_date');
        const hasRejectionReason = colNames.includes('rejection_reason');
        const hasBlockedAt = colNames.includes('blocked_at');
        const hasBlockReason = colNames.includes('block_reason');
        const hasAggregatorPercentage = colNames.includes('aggregator_percentage');
        const hasPublishingPercentage = colNames.includes('publishing_percentage');
        const hasContractStatus = colNames.includes('contract_status');

        let updates = ['status = ?'];
        let params = [status];

        if (hasContractStatus && contract_status) {
            updates.push('contract_status = ?');
            params.push(contract_status);
        }

        if (status === 'Approved') {
            // Set joined_date now, clear rejection/block fields
            if (hasJoinedDate) updates.push('joined_date = NOW()');
            if (hasRejectedDate) updates.push('rejected_date = NULL');
            if (hasRejectionReason) updates.push('rejection_reason = NULL');
            if (hasBlockedAt) updates.push('blocked_at = NULL');
            if (hasBlockReason) updates.push('block_reason = NULL');
            // Add percentage fields if available
            if (hasAggregatorPercentage) {
                updates.push('aggregator_percentage = ?');
                params.push(aggregator_percentage);
            }
            if (hasPublishingPercentage) {
                updates.push('publishing_percentage = ?');
                params.push(publishing_percentage);
            }
        } else if (status === 'Rejected') {
            // Set rejected_date and reason, clear joined/block
            if (hasRejectedDate) updates.push('rejected_date = NOW()');
            if (hasRejectionReason) {
                updates.push('rejection_reason = ?');
                params.push(reason || null);
            }
            if (hasJoinedDate) updates.push('joined_date = NULL');
            if (hasBlockedAt) updates.push('blocked_at = NULL');
            if (hasBlockReason) updates.push('block_reason = NULL');
        } else if (status === 'Blocked') {
            // Set blocked_at and reason, clear others
            if (hasBlockedAt) updates.push('blocked_at = NOW()');
            if (hasBlockReason) {
                updates.push('block_reason = ?');
                params.push(reason || null);
            }
            if (hasJoinedDate) updates.push('joined_date = NULL');
            if (hasRejectedDate) updates.push('rejected_date = NULL');
            if (hasRejectionReason) updates.push('rejection_reason = NULL');
        } else {
            // Other statuses: clear all dates/reasons
            if (hasJoinedDate) updates.push('joined_date = NULL');
            if (hasRejectedDate) updates.push('rejected_date = NULL');
            if (hasRejectionReason) updates.push('rejection_reason = NULL');
            if (hasBlockedAt) updates.push('blocked_at = NULL');
            if (hasBlockReason) updates.push('block_reason = NULL');
        }

        params.push(userId);
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

        // Build select query based on available columns
        const selectFields = ['id', 'username as name', 'email', 'role', 'status'];
        if (hasJoinedDate) selectFields.push('DATE_FORMAT(joined_date, "%Y-%m-%d") as joinedDate');
        if (hasRejectionReason) selectFields.push('rejection_reason');
        if (hasAggregatorPercentage) selectFields.push('aggregator_percentage');
        if (hasPublishingPercentage) selectFields.push('publishing_percentage');
        if (hasBlockReason) selectFields.push('block_reason');
        if (hasBlockedAt) selectFields.push('DATE_FORMAT(blocked_at, "%Y-%m-%d") as blockedAt');
        if (hasContractStatus) selectFields.push('contract_status');

        const [rows] = await db.query(`SELECT ${selectFields.join(', ')} FROM users WHERE id = ?`, [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'Status updated', user: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET USER DETAIL (Admin/Operator)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const userId = req.params.id;
        const [cols] = await db.query('SHOW COLUMNS FROM users');
        const colNames = cols.map(c => c.Field);
        const parts = [
            'id',
            'username as name',
            'username',
            'email',
            'role',
            colNames.includes('status') ? 'status' : `'Active' as status`,
            colNames.includes('registered_at') ? 'DATE_FORMAT(registered_at, "%Y-%m-%d") as registeredDate' : 'NULL as registeredDate',
            colNames.includes('joined_date') ? 'DATE_FORMAT(joined_date, "%Y-%m-%d") as joinedDate' : 'NULL as joinedDate',
            colNames.includes('rejected_date') 
                ? (colNames.includes('blocked_at') 
                    ? `CASE WHEN status = 'Blocked' THEN DATE_FORMAT(blocked_at, "%Y-%m-%d") ELSE DATE_FORMAT(rejected_date, "%Y-%m-%d") END as rejectedDate` 
                    : `DATE_FORMAT(rejected_date, "%Y-%m-%d") as rejectedDate`)
                : `NULL as rejectedDate`,
            colNames.includes('rejection_reason') ? 'rejection_reason' : 'NULL as rejection_reason',
            colNames.includes('account_type') ? 'account_type' : 'NULL as account_type',
            colNames.includes('company_name') ? 'company_name' : 'NULL as company_name',
            colNames.includes('nik') ? 'nik' : 'NULL as nik',
            colNames.includes('full_name') ? 'full_name' : 'NULL as full_name',
            colNames.includes('address') ? 'address' : 'NULL as address',
            colNames.includes('country') ? 'country' : 'NULL as country',
            colNames.includes('province') ? 'province' : 'NULL as province',
            colNames.includes('city') ? 'city' : 'NULL as city',
            colNames.includes('district') ? 'district' : 'NULL as district',
            colNames.includes('subdistrict') ? 'subdistrict' : 'NULL as subdistrict',
            colNames.includes('postal_code') ? 'postal_code' : 'NULL as postal_code',
            colNames.includes('phone') ? 'phone' : 'NULL as phone',
            colNames.includes('pic_name') ? 'pic_name' : 'NULL as pic_name',
            colNames.includes('pic_position') ? 'pic_position' : 'NULL as pic_position',
            colNames.includes('pic_phone') ? 'pic_phone' : 'NULL as pic_phone',
            colNames.includes('nib_doc_path') ? 'nib_doc_path' : 'NULL as nib_doc_path',
            colNames.includes('kemenkumham_doc_path') ? 'kemenkumham_doc_path' : 'NULL as kemenkumham_doc_path',
            colNames.includes('ktp_doc_path') ? 'ktp_doc_path' : 'NULL as ktp_doc_path',
            colNames.includes('npwp_doc_path') ? 'npwp_doc_path' : 'NULL as npwp_doc_path',
            colNames.includes('signature_doc_path') ? 'signature_doc_path' : 'NULL as signature_doc_path',
            colNames.includes('profile_picture') ? 'profile_picture' : 'NULL as profile_picture',
            colNames.includes('aggregator_percentage') ? 'aggregator_percentage' : 'NULL as aggregator_percentage',
            colNames.includes('publishing_percentage') ? 'publishing_percentage' : 'NULL as publishing_percentage',
            colNames.includes('contract_status') ? 'contract_status' : `'Not Generated' as contract_status`,
            colNames.includes('block_reason') ? 'block_reason' : 'NULL as block_reason',
            colNames.includes('blocked_at') ? 'DATE_FORMAT(blocked_at, "%Y-%m-%d") as blockedAt' : 'NULL as blockedAt'
        ];
        const sql = `SELECT ${parts.join(', ')} FROM users WHERE id = ?`;
        const [rows] = await db.query(sql, [userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
