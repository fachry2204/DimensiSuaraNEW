
import db from './server/config/db.js';

(async () => {
    try {
        console.log('Checking users...');
        const [users] = await db.query('SELECT id, username, email, role, status FROM users');
        console.log('Total users:', users.length);
        users.forEach(u => {
            console.log(`User: id=${u.id}, username="${u.username}", email="${u.email}", role=${u.role}, status=${u.status}`);
        });
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
})();
