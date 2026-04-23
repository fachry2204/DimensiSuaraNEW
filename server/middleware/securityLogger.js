
import db from '../config/db.js';
import geoip from 'geoip-lite';

const requestCounts = {};
const CLEANUP_INTERVAL = 60000; // 1 minute

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const ip in requestCounts) {
        if (now - requestCounts[ip].startTime > CLEANUP_INTERVAL) {
            delete requestCounts[ip];
        }
    }
}, CLEANUP_INTERVAL);

const getCountry = (ip) => {
    // Handle localhost/private IPs
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return 'Localhost/Private';
    }
    const geo = geoip.lookup(ip);
    return geo ? geo.country : 'Unknown';
};

export const securityLogger = async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    
    if (!requestCounts[ip]) {
        requestCounts[ip] = {
            startTime: now,
            totalCount: 0,
            loginCount: 0,
            loggedDDOS: false,
            loggedBruteForce: false
        };
    }

    const data = requestCounts[ip];

    // Reset if interval passed
    if (now - data.startTime > CLEANUP_INTERVAL) {
        data.startTime = now;
        data.totalCount = 0;
        data.loginCount = 0;
        data.loggedDDOS = false;
        data.loggedBruteForce = false;
    }

    data.totalCount++;

    // DDOS Detection (Global limit: 200 req/min)
    if (data.totalCount > 200 && !data.loggedDDOS) {
        data.loggedDDOS = true;
        const country = getCountry(ip);
        try {
            await db.query('INSERT INTO security_logs (user_identifier, ip_address, country, attack_type, details) VALUES (?, ?, ?, ?, ?)', 
                ['SYSTEM', ip, country, 'DDOS', `High traffic volume: ${data.totalCount} req/min`]);
            console.warn(`[SECURITY] Potential DDOS from ${ip}`);
        } catch (err) {
            console.error('Failed to log security event:', err);
        }
    }

    // Brute Force Detection (Login limit: 10 req/min)
    if (req.path === '/api/auth/login' && req.method === 'POST') {
        data.loginCount++;
        if (data.loginCount > 10 && !data.loggedBruteForce) {
            data.loggedBruteForce = true;
            const country = getCountry(ip);
            try {
                // Try to get username from body if available
                const username = req.body.username || 'Unknown';
                await db.query('INSERT INTO security_logs (user_identifier, ip_address, country, attack_type, details) VALUES (?, ?, ?, ?, ?)', 
                    [username, ip, country, 'BRUTE_FORCE', `Excessive login attempts: ${data.loginCount} req/min`]);
                console.warn(`[SECURITY] Potential Brute Force from ${ip}`);
            } catch (err) {
                console.error('Failed to log security event:', err);
            }
        }
    }

    next();
};
