import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { exec } from 'child_process';
import util from 'util';
import { initDb } from '../init-db.js';
import { checkDbIntegrity, checkSystemUpdate, logSystemCheck, performSystemUpdate } from '../utils/systemCheck.js';
import tls from 'tls';
import net from 'net';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure settings upload directory exists
const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const SETTINGS_DIR = path.join(UPLOADS_ROOT, 'settings');
const PROJECT_ROOT = path.resolve(__dirname, '../../');

try {
    if (!fs.existsSync(SETTINGS_DIR)) {
        fs.mkdirSync(SETTINGS_DIR, { recursive: true });
    }
} catch (err) {
    console.error('Failed to create settings upload directory:', err);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, SETTINGS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- AGGREGATORS ---

router.get('/aggregators', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['aggregators']);
        if (rows.length === 0 || !rows[0].setting_value) {
            return res.json([]);
        }
        res.json(JSON.parse(rows[0].setting_value));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/aggregators', authenticateToken, async (req, res) => {
    try {
        const { aggregators } = req.body;
        await db.query(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            ['aggregators', JSON.stringify(aggregators), JSON.stringify(aggregators)]
        );
        res.json({ message: 'Aggregators updated', aggregators });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SYSTEM CHECK ---

// Check DB Integrity
router.get('/system/check-db', authenticateToken, async (req, res) => {
    try {
        const result = await checkDbIntegrity();
        await logSystemCheck('DB_INTEGRITY_CHECK', result);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fix DB Integrity
router.post('/system/fix-db', authenticateToken, async (req, res) => {
    try {
        console.log('Starting manual DB fix...');
        await initDb();
        res.json({ message: 'Database structure repaired successfully.' });
    } catch (err) {
        console.error('DB Fix failed:', err);
        res.status(500).json({ error: 'Failed to repair database: ' + err.message });
    }
});

// Check Update
router.get('/system/check-update', authenticateToken, async (req, res) => {
    try {
        const result = await checkSystemUpdate();
        await logSystemCheck('UPDATE_CHECK', result);
        res.json(result);
    } catch (err) {
        console.error('Git check failed:', err);
        res.status(500).json({ error: 'Failed to check updates: ' + err.message });
    }
});

// Get System Logs
router.get('/system/logs', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 50');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Perform Update
router.post('/system/update', authenticateToken, async (req, res) => {
    try {
        const result = await performSystemUpdate(PROJECT_ROOT);
        res.json(result);
        
        // Restart Server (Exit process so PM2/Nodemon restarts it)
        setTimeout(() => {
            console.log('Restarting server...');
            process.exit(0);
        }, 2000);
    } catch (err) {
        console.error('Update failed:', err);
        res.status(500).json({ error: 'Update failed: ' + err.message });
    }
});

// --- SECURITY LOGS ---

router.get('/security/logs', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 100');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// BRANDING ROUTES
router.get('/branding', async (req, res) => {
    try {
        // Use the new login_settings table (Struktur Khusus)
        const [rows] = await db.query('SELECT * FROM login_settings WHERE id = 1');
        
        if (rows.length === 0) {
            return res.json({
                logo: null,
                favicon_url: null,
                login_background: null,
                login_title: 'Agregator & Publishing Musik',
                login_footer: 'Protected CMS Area. Authorized personnel only.',
                login_button_color: 'linear-gradient(to right, #2563eb, #0891b2)',
                login_form_bg_color: 'rgba(255, 255, 255, 0.9)',
                enable_registration: 'true'
            });
        }
        
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/branding', authenticateToken, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }, { name: 'login_background', maxCount: 1 }]), async (req, res) => {
    try {
        const files = req.files || {};
        const body = req.body;
        console.log('Branding Update Request:', { body, files }); // DEBUG LOG

        const baseUrl = '/uploads/settings/';
        
        const updateFields = [];
        const updateValues = [];

        // Handle Files
        if (files['logo']) {
            updateFields.push('logo = ?');
            updateValues.push(baseUrl + files['logo'][0].filename);
        }

        if (files['favicon']) {
            updateFields.push('favicon_url = ?');
            updateValues.push(baseUrl + files['favicon'][0].filename);
        }

        if (files['login_background']) {
            updateFields.push('login_background = ?');
            updateValues.push(baseUrl + files['login_background'][0].filename);
        }

        // Handle Text Fields
        const textFields = [
            'login_title', 
            'login_footer', 
            'login_button_color', 
            'login_form_bg_color',
            'enable_registration',
            'login_title_color',
            'login_footer_color',
            'login_form_bg_opacity',
            'login_bg_opacity',
            'login_glass_effect',
            'login_form_text_color'
        ];

        textFields.forEach(field => {
            if (body[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(body[field]);
            }
        });

        if (updateFields.length > 0) {
            // Ensure row 1 exists
            const [check] = await db.query('SELECT 1 FROM login_settings WHERE id = 1');
            if (check.length === 0) {
                 await db.query(`INSERT INTO login_settings (id) VALUES (1)`);
            }

            const sql = `UPDATE login_settings SET ${updateFields.join(', ')} WHERE id = 1`;
            await db.query(sql, updateValues);
        }
        
        // Fetch updated settings
        const [rows] = await db.query('SELECT * FROM login_settings WHERE id = 1');
        
        res.json({ message: 'Branding updated', branding: rows[0] });
    } catch (err) {
        console.error('Branding Update Error:', err);
        res.status(500).json({ error: 'Database update failed', details: err.message, code: err.code });
    }
});

// --- GATEWAY SETTINGS (SMTP & MPWA) ---
// Store under generic `settings` table using JSON blobs
router.get('/gateway', authenticateToken, async (req, res) => {
    try {
        const [smtpRows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['smtp_settings']);
        const [mpwaRows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['mpwa_settings']);
        
        const smtp = (smtpRows.length > 0 && smtpRows[0].setting_value) ? JSON.parse(smtpRows[0].setting_value) : {
            host: '',
            port: 587,
            secure: false,
            user: '',
            pass: '',
            from_email: '',
            from_name: ''
        };
        const mpwa = (mpwaRows.length > 0 && mpwaRows[0].setting_value) ? JSON.parse(mpwaRows[0].setting_value) : {
            base_url: '',
            token: '',
            device_id: ''
        };
        res.json({ smtp, mpwa });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/gateway', authenticateToken, async (req, res) => {
    try {
        const { smtp, mpwa } = req.body || {};
        if (smtp) {
            await db.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                ['smtp_settings', JSON.stringify(smtp), JSON.stringify(smtp)]
            );
        }
        if (mpwa) {
            await db.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                ['mpwa_settings', JSON.stringify(mpwa), JSON.stringify(mpwa)]
            );
        }
        res.json({ message: 'Gateway settings saved', smtp, mpwa });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Simple SMTP client for test email (no external dependency)
const smtpSendTest = ({ host, port, secure, user, pass, from_email, to, subject, body }) => {
    return new Promise((resolve, reject) => {
        const socket = secure ? tls.connect(port, host, { servername: host }, onConnect) : net.connect(port, host, onConnect);
        let buffer = '';
        let closed = false;
        let lastCode = 0;

        function onConnect() {
            // Wait for 220 greeting then start handshake
        }
        function cleanup(err) {
            if (closed) return;
            closed = true;
            try { socket.end(); } catch {}
            if (err) reject(err);
        }
        function expect(code) {
            return new Promise((res, rej) => {
                const onData = (data) => {
                    buffer += data.toString('utf8');
                    // Responses may span multiple lines; take last line code
                    const lines = buffer.split(/\r?\n/).filter(l => l.trim().length > 0);
                    const last = lines[lines.length - 1] || '';
                    const m = last.match(/^(\d{3})/);
                    if (m) {
                        lastCode = parseInt(m[1], 10);
                        if (lastCode === code || (Array.isArray(code) && code.includes(lastCode))) {
                            socket.removeListener('data', onData);
                            buffer = '';
                            res(last);
                        } else if (lastCode >= 400) {
                            socket.removeListener('data', onData);
                            rej(new Error(`SMTP error ${lastCode}: ${last}`));
                        }
                    }
                };
                socket.on('data', onData);
            });
        }
        function send(cmd) {
            return new Promise((res, rej) => {
                try {
                    socket.write(cmd + '\r\n', 'utf8', res);
                } catch (e) {
                    rej(e);
                }
            });
        }
        socket.once('error', (e) => cleanup(e));
        socket.once('close', () => cleanup(new Error('SMTP connection closed')));
        (async () => {
            try {
                await expect(220);
                await send(`EHLO localhost`);
                await expect(250);
                if (user && pass) {
                    await send('AUTH LOGIN');
                    await expect(334);
                    await send(Buffer.from(String(user)).toString('base64'));
                    await expect(334);
                    await send(Buffer.from(String(pass)).toString('base64'));
                    await expect(235);
                }
                await send(`MAIL FROM:<${from_email}>`);
                await expect(250);
                await send(`RCPT TO:<${to}>`);
                await expect([250, 251]);
                await send('DATA');
                await expect(354);
                const msg = [
                    `From: <${from_email}>`,
                    `To: <${to}>`,
                    `Subject: ${subject}`,
                    'MIME-Version: 1.0',
                    'Content-Type: text/plain; charset=utf-8',
                    '',
                    body || 'Test email dari CMS Dimensi Suara.',
                    ''
                ].join('\r\n');
                await send(msg + '\r\n.');
                await expect(250);
                await send('QUIT');
                // 221 closing connection (ignore errors after QUIT)
                resolve({ ok: true });
                cleanup();
            } catch (err) {
                cleanup(err);
            }
        })();
    });
};

router.post('/gateway/test-email', authenticateToken, async (req, res) => {
    try {
        const { to, subject, body } = req.body || {};
        if (!to) return res.status(400).json({ error: 'Recipient email (to) is required' });
        const [smtpRows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['smtp_settings']);
        if (smtpRows.length === 0 || !smtpRows[0].setting_value) {
            return res.status(400).json({ error: 'SMTP settings not configured' });
        }
        const smtp = JSON.parse(smtpRows[0].setting_value);
        if (!smtp.host || !smtp.port || !smtp.user || !smtp.pass || !smtp.from_email) {
            return res.status(400).json({ error: 'Incomplete SMTP settings' });
        }
        await smtpSendTest({
            host: smtp.host,
            port: Number(smtp.port || 587),
            secure: Boolean(smtp.secure),
            user: smtp.user,
            pass: smtp.pass,
            from_email: smtp.from_email,
            to,
            subject: subject || 'Test Email - Dimensi Suara CMS',
            body: body || 'Ini adalah email percobaan dari CMS Dimensi Suara.'
        });
        res.json({ message: 'Email test sent successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to send test email' });
    }
});

router.post('/gateway/test-wa', authenticateToken, async (req, res) => {
    try {
        const { phone, message, endpoint } = req.body || {};
        if (!phone) return res.status(400).json({ error: 'Phone number is required' });
        const [mpwaRows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['mpwa_settings']);
        if (mpwaRows.length === 0 || !mpwaRows[0].setting_value) {
            return res.status(400).json({ error: 'MPWA settings not configured' });
        }
        const mpwa = JSON.parse(mpwaRows[0].setting_value);
        if (!mpwa.base_url || !mpwa.token || !mpwa.device_id) {
            return res.status(400).json({ error: 'Incomplete MPWA settings' });
        }
        const url = new URL(endpoint || '/api/send_message', mpwa.base_url).toString();
        // Common MPWA payload (may vary; adjust as per your provider)
        const payload = {
            token: mpwa.token,
            device_id: mpwa.device_id,
            to: phone,
            message: message || 'Test WA dari CMS Dimensi Suara'
        };
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            return res.status(resp.status).json({ error: json?.error || 'Failed to send WA message' });
        }
        res.json({ message: 'WA test sent successfully', response: json });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to send test WA' });
    }
});

export default router;
