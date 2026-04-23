
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
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
            database: process.env.DB_NAME || 'dimensi_suara_db',
            multipleStatements: true
        });

        console.log('Connected to DB');
        const sql = fs.readFileSync(path.join(__dirname, 'db_add_columns.sql'), 'utf8');
        const statements = sql.split(';').filter(s => s.trim());

        for (const stmt of statements) {
            if (stmt.trim()) {
                try {
                    console.log('Executing:', stmt.substring(0, 50) + '...');
                    await connection.query(stmt);
                    console.log('Success');
                } catch (e) {
                    if (e.code === 'ER_DUP_FIELDNAME') {
                        console.log('Column already exists (skip)');
                    } else {
                        console.error('Error executing statement:', e.message);
                    }
                }
            }
        }
        console.log('Done');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
