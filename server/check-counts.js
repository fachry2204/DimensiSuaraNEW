
import db from './config/db.js';

async function checkRowCounts() {
    try {
        const [writersCount] = await db.query('SELECT COUNT(*) as count FROM writers');
        console.log('Rows in writers:', writersCount[0].count);

        const [songWritersCount] = await db.query('SELECT COUNT(*) as count FROM song_writers');
        console.log('Rows in song_writers:', songWritersCount[0].count);

    } catch (error) {
        console.error('Error checking row counts:', error);
    } finally {
        process.exit();
    }
}

checkRowCounts();
