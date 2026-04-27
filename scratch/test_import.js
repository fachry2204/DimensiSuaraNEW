
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'dimensi_suara_db'
        });

        console.log('Connected to DB');

        const data = [
            {
                period: '2024-01-01',
                upc: '123456789',
                isrc: 'ABCDE12345',
                title: 'Test Song',
                artist: 'Test Artist',
                platform: 'Spotify',
                country: 'ID',
                quantity: 100,
                revenue: 10.50,
                originalFileName: 'test.xlsx',
                sales_period: '2024-01',
                reporting_period: '2024-02',
                album_title: 'Test Album',
                release_date: '2024-01-01',
                royalty_type: 'Sales',
                sales_type: 'Stream',
                sales_sub_type: 'Premium'
            }
        ];

        const values = data.map(row => [
            row.period, row.upc, row.isrc, row.title, row.artist, 
            row.platform, row.country, row.quantity, row.revenue, row.originalFileName,
            row.sales_period, row.reporting_period, row.album_title, row.release_date, 
            row.royalty_type, row.sales_type, row.sales_sub_type
        ]);

        const sql = `INSERT INTO reports 
            (period, upc, isrc, title, artist, platform, country, quantity, revenue, original_file_name,
             sales_period, reporting_period, album_title, release_date, royalty_type, sales_type, sales_sub_type) 
            VALUES ?`;

        console.log('Executing SQL...');
        const [result] = await connection.query(sql, [values]);
        console.log('Success:', result.affectedRows, 'rows');
        
        process.exit(0);
    } catch (e) {
        console.error('ERROR:', e.message);
        if (e.code) console.error('CODE:', e.code);
        process.exit(1);
    }
};

run();
