import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = path.join(__dirname, '../db/last_db_name.json');
const BACKUP_DIR = path.join(__dirname, '../db/backups');

const readLastDbName = () => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      return raw?.dbName || null;
    }
  } catch {}
  return null;
};

export const writeLastDbName = async (dbName) => {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({ dbName, ts: Date.now() }, null, 2));
  } catch (e) {
    console.warn('writeLastDbName warning:', e.message);
  }
};

const which = (cmd) => {
  const exts = process.platform === 'win32' ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';') : [''];
  const paths = (process.env.PATH || '').split(path.delimiter);
  for (const p of paths) {
    for (const ext of exts) {
      const full = path.join(p, cmd + ext);
      if (fs.existsSync(full)) return full;
    }
  }
  return null;
};

export const runMysqldump = ({ host, user, password, port, dbName, outFile }) => {
  return new Promise((resolve, reject) => {
    const exe = which('mysqldump');
    if (!exe) {
      return reject(new Error('mysqldump not found in PATH. Install MySQL client tools to enable auto backup.'));
    }
    const args = [];
    if (host) args.push('-h', host);
    if (port) args.push('-P', String(port));
    if (user) args.push('-u', user);
    if (password) args.push(`-p${password}`);
    args.push('--routines', '--events', '--single-transaction', '--quick', dbName);
    const child = spawn(exe, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const out = fs.createWriteStream(outFile);
    child.stdout.pipe(out);
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => {
      if (code === 0) resolve(outFile);
      else reject(new Error(`mysqldump exited with code ${code}: ${stderr}`));
    });
  });
};

export const backupIfNewDatabase = async ({ host, user, password, port, dbName }) => {
  const enabled = String(process.env.DB_DUMP_ENABLE || '1') !== '0';
  if (!enabled) {
    return;
  }
  const last = readLastDbName();
  const always = String(process.env.DB_DUMP_ALWAYS || '0') === '1';
  if (!always && last === dbName) {
    return; // no change
  }
  const targetDb = always && last ? last : last; // prefer last if exists
  if (!targetDb) return;

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(BACKUP_DIR, `${targetDb}-${ts}.sql`);
  try {
    console.log(`🗄️  Auto-backup previous database "${targetDb}" to ${outFile}`);
    await runMysqldump({ host, user, password, port, dbName: targetDb, outFile });
    console.log('✅ Database backup completed.');
  } catch (e) {
    console.warn('⚠️ Database backup skipped:', e.message);
  }
};

export const backupCurrentDatabase = async () => {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
  const dbName = process.env.DB_NAME;
  if (!dbName) {
    throw new Error('DB_NAME is not set; cannot backup current database.');
  }
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(BACKUP_DIR, `${dbName}-${ts}.sql`);
  await runMysqldump({ host, user, password, port, dbName, outFile });
  return outFile;
};
