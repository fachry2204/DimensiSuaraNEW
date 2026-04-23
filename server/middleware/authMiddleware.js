import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    const cookieToken = req.cookies && req.cookies['auth_token'];
    const token = bearerToken || cookieToken;

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;

        // Sliding session: refresh by re-issuing token with new 1h exp if using cookie
        if (cookieToken) {
            const newToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
            const secure = req.secure || (req.headers['x-forwarded-proto'] === 'https');
            res.cookie('auth_token', newToken, {
                httpOnly: true,
                sameSite: 'lax',
                secure,
                maxAge: 60 * 60 * 1000 // 1 hour
            });
        }
        next();
    });
};
