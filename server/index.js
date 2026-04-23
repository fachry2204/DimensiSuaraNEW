import './config/env.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import releaseRoutes from './routes/releaseRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import publishingRoutes from './routes/publishingRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { loadBackupScheduleFromDb } from './utils/scheduler.js';
import userRoutes from './routes/userRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import { securityLogger } from './middleware/securityLogger.js';
import webhookRoutes from './routes/webhookRoutes.js';
import spotifyRoutes from './routes/spotifyRoutes.js';

import { initDb } from './init-db.js';

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
// dotenv loaded via ./config/env.js at top

// Fix for some environments where process.env might be undefined for some keys
const PORT = process.env.PORT || 3000;

// Run Database Migration on Startup
initDb().then(() => {
    console.log('Database migration check completed.');
    loadBackupScheduleFromDb().then(() => {
        console.log('Backup schedule loaded.');
    }).catch(err => console.warn('Load backup schedule failed:', err.message));
}).catch(err => {
    console.error('Database migration check failed:', err);
});

const app = express();

// Middleware
app.use(cors({
    credentials: true,
    origin: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Error Handler for JSON parsing errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON:', err.message);
        return res.status(400).json({ error: 'Invalid JSON format' });
    }
    next(err);
});

// Security Logger Middleware
app.use(securityLogger);


// Static Files (Serve the React Frontend)
// Serve from "public" (Vite outDir) at the project root
const distPath = path.join(__dirname, '../public');
app.use(express.static(distPath));

// Serve Uploads
const uploadsPath = path.join(__dirname, '../uploads');
console.log("Serving uploads from:", uploadsPath);
app.use('/uploads', express.static(uploadsPath));
// Prevent SPA fallback for missing images
app.use('/uploads', (req, res) => {
    res.status(404).send('Image not found');
});

// API Routes
app.get('/api/health', async (req, res) => {
    try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('DB Query Timeout')), 5000));
        await Promise.race([
            db.query('SELECT 1'),
            timeout
        ]);
        res.json({ status: 'online', database: 'connected' });
    } catch (err) {
        console.error('Health check failed:', err.message);
        // Even if DB fails, we return 200 so frontend doesn't see network error, but with status offline
        // Wait, frontend expects 200 to check status.
        // If status is 500, frontend fetch throws or returns !ok.
        // Let's keep 500 but ensure we send JSON.
        res.status(500).json({ status: 'offline', database: 'disconnected', error: err.message });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/releases', releaseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/publishing', publishingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/spotify', spotifyRoutes);

// Proxy Wilayah.id (to avoid browser CORS)
app.get('/api/wilayah/provinces', async (req, res) => {
    try {
        const upstream = await fetch('https://wilayah.id/api/provinces.json');
        const json = await upstream.json();
        res.json(json);
    } catch (err) {
        console.error('Wilayah provinces error:', err);
        res.status(500).json({ error: 'Failed to load provinces' });
    }
});

app.get('/api/wilayah/regencies/:provinceCode', async (req, res) => {
    try {
        const { provinceCode } = req.params;
        const upstream = await fetch(`https://wilayah.id/api/regencies/${provinceCode}.json`);
        const json = await upstream.json();
        res.json(json);
    } catch (err) {
        console.error('Wilayah regencies error:', err);
        res.status(500).json({ error: 'Failed to load regencies' });
    }
});

app.get('/api/wilayah/districts/:regencyCode', async (req, res) => {
    try {
        const { regencyCode } = req.params;
        const upstream = await fetch(`https://wilayah.id/api/districts/${regencyCode}.json`);
        const json = await upstream.json();
        res.json(json);
    } catch (err) {
        console.error('Wilayah districts error:', err);
        res.status(500).json({ error: 'Failed to load districts' });
    }
});

app.get('/api/wilayah/villages/:districtCode', async (req, res) => {
    try {
        const { districtCode } = req.params;
        const upstream = await fetch(`https://wilayah.id/api/villages/${districtCode}.json`);
        const json = await upstream.json();
        res.json(json);
    } catch (err) {
        console.error('Wilayah villages error:', err);
        res.status(500).json({ error: 'Failed to load villages' });
    }
});

const normalizeName = (value) => {
    if (!value) return '';
    return String(value)
        .toLowerCase()
        .replace(/\./g, '')
        .replace(/\s+/g, ' ')
        .replace(/^(kabupaten|kab|kota adm|kota administratif|kota)\s+/g, '')
        .trim();
};

app.get('/api/wilayah/postal-code', async (req, res) => {
    const { province, city, district, village } = req.query;
    if (!province || !city || !district || !village) {
        return res.status(400).json({ error: 'Missing location parameters' });
    }
    try {
        const searchQuery = encodeURIComponent(village);
        const upstream = await fetch(`https://kodepos.vercel.app/search/?q=${searchQuery}`);
        if (!upstream.ok) {
            return res.status(502).json({ error: 'Postal code service unavailable' });
        }
        const json = await upstream.json();
        const list = Array.isArray(json.data) ? json.data : [];

        const provinceNorm = normalizeName(province);
        const cityNorm = normalizeName(city);
        const districtNorm = normalizeName(district);
        const villageNorm = normalizeName(village);

        let candidate = list.find((item) => {
            return (
                normalizeName(item.province) === provinceNorm &&
                normalizeName(item.regency) === cityNorm &&
                normalizeName(item.district) === districtNorm &&
                normalizeName(item.village) === villageNorm
            );
        });

        if (!candidate) {
            candidate = list.find((item) => {
                return (
                    normalizeName(item.regency) === cityNorm &&
                    normalizeName(item.district) === districtNorm &&
                    normalizeName(item.village) === villageNorm
                );
            });
        }

        if (!candidate) {
            candidate = list.find((item) => normalizeName(item.village) === villageNorm);
        }

        if (!candidate && list.length > 0) {
            candidate = list[0];
        }

        if (!candidate) {
            return res.status(404).json({ error: 'Postal code not found' });
        }

        const code = String(candidate.code || candidate.zipcode || '');
        if (!code) {
            return res.status(404).json({ error: 'Postal code not found' });
        }

        res.json({ code });
    } catch (err) {
        console.error('Postal code lookup error:', err);
        res.status(500).json({ error: 'Failed to lookup postal code' });
    }
});

// Additional DB health (normalized shape, avoid duplicate /api/health route)
app.get('/api/health/db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 as val');
        res.json({ status: 'online', database: 'connected', val: rows[0].val });
    } catch (err) {
        console.error('Database Health Check Failed:', err);
        res.status(500).json({ status: 'offline', database: 'disconnected', error: err.message });
    }
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
            error: 'File too large', 
            details: `Maximum file size is ${process.env.UPLOAD_MAX_BYTES || '8GB'}` 
        });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
            error: 'Unexpected file upload', 
            details: err.message 
        });
    }
    
    // Pass to default handler if headers sent
    if (res.headersSent) {
        return next(err);
    }

    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// API 404 Handler (Must be after all API routes)
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.originalUrl} not found` });
});

// Catch-All Route for SPA (Must be last)
app.get('*', (req, res) => {
    // If request starts with /api, return 404 JSON immediately
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }

    // Otherwise send index.html for React Router to handle
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(500).send('Error loading application.');
        }
    });
});

// Start Server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📂 Serving static files from: ${distPath}`);
});

// Handle Uncaught Exceptions to prevent crash without logging
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    // Keep running if possible, or exit gracefully
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});
