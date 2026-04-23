
import db from './server/config/db.js';

async function checkUsers() {
    try {
        const [users] = await db.query('SELECT username, role, password_hash FROM users');
        console.log('Users:', users);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
