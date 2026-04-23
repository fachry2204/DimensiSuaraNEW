import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (one level up from server/config -> server -> root)
// Actually server/config/env.js -> ../../.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('Environment variables loaded.');
console.log('UPLOAD_MAX_BYTES:', process.env.UPLOAD_MAX_BYTES);
