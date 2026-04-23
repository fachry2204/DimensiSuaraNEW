
import db from './server/config/db.js';

(async () => {
    try {
        console.log('Checking users for admin@dimensisuara.id...');
        const [users] = await db.query('SELECT id, username, email FROM users WHERE email LIKE "%admin%"');
        
        users.forEach(u => {
            console.log(`User ID: ${u.id}`);
            console.log(`Username: "${u.username}"`);
            console.log(`Email: "${u.email}"`);
            
            // Print hex codes for email
            const emailHex = Buffer.from(u.email).toString('hex');
            console.log(`Email Hex: ${emailHex}`);
            
            const expected = 'admin@dimensisuara.id';
            const expectedHex = Buffer.from(expected).toString('hex');
            console.log(`Expected Hex: ${expectedHex}`);
            
            if (u.email === expected) {
                console.log('MATCH: Email matches exactly.');
            } else {
                console.log('MISMATCH: Email does not match exactly.');
            }
            console.log('---');
        });
        
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
})();
