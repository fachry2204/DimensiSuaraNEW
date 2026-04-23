
import db from './server/config/db.js';

(async () => {
    try {
        const [cols] = await db.query('SHOW COLUMNS FROM users');
        const colNames = cols.map(c => c.Field);
        console.log('Columns in users table:', colNames);
        
        const missing = [];
        if (!colNames.includes('aggregator_percentage')) missing.push('aggregator_percentage');
        if (!colNames.includes('publishing_percentage')) missing.push('publishing_percentage');
        
        if (missing.length > 0) {
            console.log('Missing columns:', missing);
            process.exit(1);
        } else {
            console.log('All required columns exist.');
            process.exit(0);
        }
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
})();
