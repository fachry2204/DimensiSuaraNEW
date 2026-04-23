
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dimensi_suara_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000
});

// --- GENERATORS ---
const FIRST_NAMES = [
    "Budi", "Siti", "Ahmad", "Dewi", "Reza", "Putri", "Agus", "Rina", "Doni", "Lestari",
    "Eko", "Maya", "Fajar", "Indah", "Gunawan", "Sari", "Hendra", "Wulan", "Joko", "Fitri",
    "Kiki", "Nina", "Lukman", "Oki", "Prasetyo", "Qory", "Rudi", "Tia", "Usman", "Vina",
    "Wahyu", "Xena", "Yoga", "Zara", "Andi", "Bella", "Chandra", "Dinda", "Erik", "Fanny"
];

const LAST_NAMES = [
    "Santoso", "Wijaya", "Saputra", "Utami", "Pratama", "Kusuma", "Hidayat", "Ningsih", "Permana", "Rahayu",
    "Setiawan", "Lestari", "Wibowo", "Anggraini", "Kurniawan", "Astuti", "Mulyadi", "Hasanah", "Firmansyah", "Puspita",
    "Siregar", "Nasution", "Simanjuntak", "Sihombing", "Pasaribu", "Ginting", "Tarigan", "Sembiring", "Sitepu", "Manullang"
];

const SONG_ADJECTIVES = [
    "Cinta", "Langit", "Malam", "Rindu", "Hati", "Jiwa", "Mimpi", "Senja", "Pagi", "Bintang",
    "Luka", "Bahagia", "Sepi", "Ramai", "Indah", "Buruk", "Hitam", "Putih", "Merah", "Biru",
    "Terakhir", "Pertama", "Abadi", "Semu", "Nyata", "Hilang", "Kembali", "Pergi", "Datang", "Jauh"
];

const SONG_NOUNS = [
    "Kita", "Dia", "Kamu", "Mereka", "Dunia", "Rasa", "Asa", "Cerita", "Lagu", "Nada",
    "Irama", "Melodi", "Harmoni", "Suara", "Diam", "Janji", "Sumpah", "Kenangan", "Harapan", "Jalan",
    "Rumah", "Kota", "Desa", "Pantai", "Gunung", "Hutan", "Laut", "Angin", "Hujan", "Badai"
];

const AGGREGATORS = ["LokaMusik", "SoundOn", "Tunecore", "DistroKid", "CDBaby", "Believe"];
const GENRES = ["Pop", "Rock", "Jazz", "Dangdut", "Indie", "Hip Hop", "R&B", "Folk"];
const STATUSES = ['Pending', 'Processing', 'Live', 'Rejected'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
const generateTitle = () => `${pick(SONG_ADJECTIVES)} ${pick(SONG_NOUNS)}`;
const generateDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];

const seedData = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // 1. Get a User ID
        const [users] = await pool.query('SELECT id FROM users LIMIT 1');
        let userId;
        if (users.length === 0) {
            console.log('No users found. Creating a default admin...');
            // In a real scenario, we'd hash the password, but for seeding dummy data this is fine or use the same hash
            const bcrypt = (await import('bcryptjs')).default;
            const hash = await bcrypt.hash('admin123', 10);
            const [result] = await pool.query("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)", ['Admin', 'admin@dimensisuara.com', hash, 'Admin']);
            userId = result.insertId;
        } else {
            userId = users[0].id;
        }
        console.log(`Using User ID: ${userId}`);

        // 2. Generate Releases
        const RELEASE_COUNT = 55;
        console.log(`Generating ${RELEASE_COUNT} releases...`);

        for (let i = 0; i < RELEASE_COUNT; i++) {
            const isSingle = Math.random() > 0.3; // 70% Singles
            const trackCount = isSingle ? 1 : randomInt(2, 12);
            const releaseTitle = generateTitle();
            const artistName = generateName();
            const status = pick(STATUSES);
            const aggregator = pick(AGGREGATORS);
            const submissionDate = generateDate(new Date(2024, 0, 1), new Date());
            
            // Insert Release
            const [releaseResult] = await pool.query(
                `INSERT INTO releases 
                (user_id, title, upc, primary_artists, label, genre, language, p_line, c_line, release_type, status, submission_date, cover_art, planned_release_date, aggregator) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    releaseTitle,
                    status === 'Pending' ? null : randomInt(100000000000, 999999999999).toString(),
                    JSON.stringify([artistName]),
                    "Dimensi Records",
                    pick(GENRES),
                    "Indonesia",
                    new Date().getFullYear().toString(),
                    new Date().getFullYear().toString(),
                    isSingle ? 'SINGLE' : 'ALBUM',
                    status,
                    submissionDate,
                    null, // No cover art for dummy
                    generateDate(new Date(submissionDate), new Date(new Date(submissionDate).getTime() + 30*24*60*60*1000)),
                    aggregator
                ]
            );
            
            const releaseId = releaseResult.insertId;

            // Insert Tracks
            for (let j = 0; j < trackCount; j++) {
                const trackTitle = isSingle ? releaseTitle : generateTitle();
                await pool.query(
                    `INSERT INTO tracks 
                    (release_id, title, version, primary_artists, writer, composer, producer, isrc, explicit, track_number, duration, genre) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        releaseId,
                        trackTitle,
                        "Original",
                        JSON.stringify([artistName]),
                        JSON.stringify([generateName()]),
                        JSON.stringify([generateName()]),
                        JSON.stringify([generateName()]),
                        status === 'Pending' ? null : `ID-A01-${randomInt(23, 25)}-${randomInt(10000, 99999)}`,
                        Math.random() > 0.9,
                        j + 1,
                        `${randomInt(2, 5)}:${randomInt(10, 59)}`,
                        pick(GENRES)
                    ]
                );
            }
        }

        console.log('✅ Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedData();
