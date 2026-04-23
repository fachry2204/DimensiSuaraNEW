import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import geoip from 'geoip-lite';
import db from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const getCountry = (ip) => {
    // Handle localhost/private IPs
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return 'Localhost/Private';
    }
    const geo = geoip.lookup(ip);
    return geo ? geo.country : 'Unknown';
};

// REGISTER (Public: creates basic User with Pending status and optional extended profile)
router.post('/register', async (req, res) => {
    try {
        const {
            username: rawUsername,
            email,
            password,
            accountType,
            companyName,
            nik,
            fullName,
            address,
            country,
            province,
            city,
            district,
            subdistrict,
            postalCode,
            phone,
            picName,
            picPosition,
            picPhone,
            nibDocPath,
            kemenkumhamDocPath,
            ktpDocPath,
            npwpDocPath,
            signatureDocPath
        } = req.body;

        const username = rawUsername || email;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        const [cols] = await db.query('SHOW COLUMNS FROM users');
        const colNames = cols.map(c => c.Field);
        const hasRole = colNames.includes('role');
        const hasStatus = colNames.includes('status');

        const duplicateReasons = [];

        const [emailRows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (emailRows.length > 0) duplicateReasons.push('EMAIL');

        if (phone) {
            const [phoneRows] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
            if (phoneRows.length > 0) duplicateReasons.push('PHONE');
        }

        if (accountType === 'COMPANY' && companyName) {
            const [companyRows] = await db.query('SELECT id FROM users WHERE company_name = ?', [companyName]);
            if (companyRows.length > 0) duplicateReasons.push('COMPANY');
        }

        if (duplicateReasons.length > 0) {
            return res.status(400).json({
                error: 'Data sudah terdaftar. Mohon gunakan email, nomor WhatsApp, atau nama perusahaan lain.',
                duplicate: duplicateReasons
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const fields = ['username', 'email', 'password_hash'];
        const values = [username, email, hash];

        if (hasRole) {
            fields.push('role');
            values.push('User');
        }
        if (hasStatus) {
            fields.push('status');
            values.push('Pending');
        }

        const extendedMap = [
            ['account_type', accountType || 'PERSONAL'],
            ['company_name', accountType === 'COMPANY' ? (companyName || null) : null],
            ['nik', nik || null],
            ['full_name', fullName || null],
            ['address', address || null],
            ['country', country || null],
            ['province', province || null],
            ['city', city || null],
            ['district', district || null],
            ['subdistrict', subdistrict || null],
            ['postal_code', postalCode || null],
            ['phone', phone || null],
            ['pic_name', picName || null],
            ['pic_position', picPosition || null],
            ['pic_phone', picPhone || null],
            ['nib_doc_path', nibDocPath || null],
            ['kemenkumham_doc_path', kemenkumhamDocPath || null],
            ['ktp_doc_path', ktpDocPath || null],
            ['npwp_doc_path', npwpDocPath || null],
            ['signature_doc_path', signatureDocPath || null],
        ];

        for (const [col, val] of extendedMap) {
            if (colNames.includes(col)) {
                fields.push(col);
                values.push(val);
            }
        }

        const placeholders = fields.map(() => '?').join(', ');
        const sql = `INSERT INTO users (${fields.join(', ')}) VALUES (${placeholders})`;
        const [result] = await db.query(sql, values);

        res.status(201).json({ 
            message: 'User registered successfully', 
            userId: result.insertId,
            status: hasStatus ? 'Pending' : undefined
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Allow login with either username or email
        const [users] = await db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
        if (users.length === 0) {
            // Log User Not Found
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const country = getCountry(ip);
            await db.query('INSERT INTO security_logs (user_identifier, ip_address, country, attack_type, details) VALUES (?, ?, ?, ?, ?)', 
                [username, ip, country, 'USER_NOT_FOUND', 'User identifier not found']);
                
            return res.status(400).json({ error: 'User not found' });
        }

        const user = users[0];

        // Check password
        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) {
            // Log Failed Login
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const country = getCountry(ip);
            await db.query('INSERT INTO security_logs (user_identifier, ip_address, country, attack_type, details) VALUES (?, ?, ?, ?, ?)', 
                [username, ip, country, 'LOGIN_FAIL', 'Invalid password']);
            
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Log Successful Login & Create Notification - REMOVED per user request
        // const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        // const country = getCountry(ip);
        
        // 1. Security Log (REMOVED)
        // await db.query('INSERT INTO security_logs (user_identifier, ip_address, country, attack_type, details) VALUES (?, ?, ?, ?, ?)', 
        //    [username, ip, country, 'LOGIN_SUCCESS', 'User logged in successfully']);

        // 2. User Notification (REMOVED)
        // const notifMsg = `Login baru terdeteksi pada perangkat Anda dari IP ${ip} (${country}).`;
        // await db.query('INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
        //    [user.id, 'Security', notifMsg]);

        // Create Token (1h) and set sliding session cookie
        const payload = { id: user.id, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        const secure = req.secure || (req.headers['x-forwarded-proto'] === 'https');
        res.cookie('auth_token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure,
            maxAge: 60 * 60 * 1000 // 1 hour
        });

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                status: user.status,
                profile_picture: user.profile_picture 
            } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGOUT - clear session cookie
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token', { httpOnly: true, sameSite: 'lax' });
    res.json({ message: 'Logged out' });
});

// CHECK DUPLICATE (Public): validate fields before stepping registration
router.post('/check-duplicate', async (req, res) => {
    try {
        const { nik, companyName, email, phone } = req.body || {};
        const duplicateReasons = [];

        if (email) {
            const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (rows.length > 0) duplicateReasons.push('EMAIL');
        }
        if (phone) {
            const [rows] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
            if (rows.length > 0) duplicateReasons.push('PHONE');
        }
        if (nik) {
            const [rows] = await db.query('SELECT id FROM users WHERE nik = ?', [nik]);
            if (rows.length > 0) duplicateReasons.push('NIK');
        }
        if (companyName) {
            const [rows] = await db.query('SELECT id FROM users WHERE company_name = ?', [companyName]);
            if (rows.length > 0) duplicateReasons.push('COMPANY');
        }

        res.json({ duplicate: duplicateReasons });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/check-duplicate', async (req, res) => {
    try {
        const { nik, companyName, email, phone } = req.query || {};
        const duplicateReasons = [];

        if (email) {
            const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (rows.length > 0) duplicateReasons.push('EMAIL');
        }
        if (phone) {
            const [rows] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
            if (rows.length > 0) duplicateReasons.push('PHONE');
        }
        if (nik) {
            const [rows] = await db.query('SELECT id FROM users WHERE nik = ?', [nik]);
            if (rows.length > 0) duplicateReasons.push('NIK');
        }
        if (companyName) {
            const [rows] = await db.query('SELECT id FROM users WHERE company_name = ?', [companyName]);
            if (rows.length > 0) duplicateReasons.push('COMPANY');
        }

        res.json({ duplicate: duplicateReasons });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
