
import db from './config/db.js';

async function checkTables() {
    try {
        const [tables] = await db.query('SHOW TABLES');
        console.log('Tables:', tables.map(t => Object.values(t)[0]));

        // Check if 'writers' exists and what columns it has
        try {
            const [writersCols] = await db.query('SHOW COLUMNS FROM writers');
            console.log('\nColumns in writers:', writersCols.map(c => c.Field));
        } catch (err) {
            console.log('\nTable writers does not exist');
        }

        // Check if 'creators' exists and what columns it has
        try {
            const [creatorsCols] = await db.query('SHOW COLUMNS FROM creators');
            console.log('\nColumns in creators:', creatorsCols.map(c => c.Field));
        } catch (err) {
            console.log('\nTable creators does not exist');
        }

        // Check if 'song_writers' exists and what columns it has
        try {
            const [songWritersCols] = await db.query('SHOW COLUMNS FROM song_writers');
            console.log('\nColumns in song_writers:', songWritersCols.map(c => c.Field));
        } catch (err) {
            console.log('\nTable song_writers does not exist');
        }

    } catch (error) {
        console.error('Error checking tables:', error);
    } finally {
        process.exit();
    }
}

checkTables();
