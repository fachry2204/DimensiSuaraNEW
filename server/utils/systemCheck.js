import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

export const checkDbIntegrity = async () => {
    try {
        const requiredTables = ['users', 'releases', 'songs', 'reports', 'settings', 'notifications', 'tickets', 'security_logs', 'system_logs'];
        const [rows] = await db.query('SHOW TABLES');
        const existingTables = rows.map(r => Object.values(r)[0]);
        
        const missingTables = requiredTables.filter(t => !existingTables.includes(t));
        
        // Check for critical columns in login_settings
        if (existingTables.includes('login_settings')) {
            const [cols] = await db.query('SHOW COLUMNS FROM login_settings');
            const existingCols = cols.map(c => c.Field);
            const requiredCols = [
                'login_title_color', 
                'login_footer_color', 
                'login_form_bg_opacity', 
                'login_bg_opacity',
                'login_glass_effect',
                'login_form_text_color'
            ];
            
            requiredCols.forEach(col => {
                if (!existingCols.includes(col)) {
                    missingTables.push(`Column: ${col} (in login_settings)`);
                }
            });
        }

        return {
            status: missingTables.length === 0 ? 'OK' : 'MISSING_TABLES',
            missing: missingTables,
            checked_at: new Date()
        };
    } catch (err) {
        throw new Error('DB Integrity Check Failed: ' + err.message);
    }
};

const ensureGitRepo = async (cwd) => {
    try {
        await execPromise('git rev-parse --is-inside-work-tree', { cwd });
    } catch (error) {
        console.log('Initializing git repository...');
        await execPromise('git init', { cwd });
        await execPromise('git remote add origin https://github.com/fachry2204/DimensiSuaraNEW.git', { cwd });
    }
};

export const checkSystemUpdate = async () => {
    try {
        try {
            await execPromise('git --version');
        } catch (e) {
             return { 
                updatesAvailable: false, 
                error: 'Git is not installed or not in PATH',
                checked_at: new Date()
            };
        }

        const repoUrl = 'https://github.com/fachry2204/DimensiSuaraNEW.git';
        
        await ensureGitRepo(projectRoot);
        
        try {
            await execPromise('git fetch origin', { cwd: projectRoot });
        } catch (e) {
             throw new Error('Git fetch failed: ' + e.message);
        }
        
        let behindCount = 0;
        let localHash = 'none';
        let remoteHash = '';

        try {
             const { stdout: rh } = await execPromise('git rev-parse --short origin/main', { cwd: projectRoot });
             remoteHash = rh.trim();
        } catch (e) {
             remoteHash = 'unknown';
        }

        try {
            const { stdout: lh } = await execPromise('git rev-parse --short HEAD', { cwd: projectRoot });
            localHash = lh.trim();
            const { stdout: bc } = await execPromise('git rev-list --count HEAD..origin/main', { cwd: projectRoot });
            behindCount = parseInt(bc.trim()) || 0;
        } catch (e) {
            behindCount = 999;
            localHash = 'none (fresh)';
        }
        
        const updatesAvailable = behindCount > 0 || localHash === 'none (fresh)';
        
        return {
            updatesAvailable,
            behindCount,
            localHash,
            remoteHash,
            repo: repoUrl,
            checked_at: new Date()
        };
    } catch (err) {
        throw new Error('System Update Check Failed: ' + err.message);
    }
};

export const logSystemCheck = async (type, result) => {
    try {
        const status = type === 'UPDATE_CHECK' 
            ? (result.updatesAvailable ? 'UPDATE_AVAILABLE' : (result.error ? 'ERROR' : 'OK'))
            : (result.status === 'OK' ? 'OK' : 'ERROR');

        const details = JSON.stringify(result);
        
        await db.query(
            'INSERT INTO system_logs (check_type, status, details, created_at) VALUES (?, ?, ?, ?)',
            [type, status, details, new Date()]
        );
    } catch (err) {
        console.error('Failed to log system check:', err);
    }
};

export const performSystemUpdate = async (cwd) => {
    const repoUrl = 'https://github.com/fachry2204/DimensiSuaraNEW.git';
    
    await ensureGitRepo(cwd);

    console.log('Fetching updates from:', repoUrl);
    await execPromise('git fetch origin', { cwd });
    
    console.log('Resetting to origin/main...');
    await execPromise('git reset --hard origin/main', { cwd });
    
    console.log('Installing dependencies...');
    await execPromise('npm install', { cwd }); 
    
    console.log('Building project...');
    await execPromise('npm run build', { cwd });

    return { message: 'System Updated Successfully. Server is restarting...' };
};
