import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { backupCurrentDatabase } from '../utils/db-backup.js';
import { setBackupSchedule, getBackupSchedule } from '../utils/scheduler.js';

const router = express.Router();

const ensureAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.post('/db/backup', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const file = await backupCurrentDatabase();
    res.json({ message: 'Backup completed', file });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/db/schedule', authenticateToken, ensureAdmin, async (req, res) => {
  res.json(getBackupSchedule());
});

router.post('/db/schedule', authenticateToken, ensureAdmin, async (req, res) => {
  const { frequency = 'none', time = '02:00' } = req.body || {};
  if (!['none', 'daily', 'weekly'].includes(frequency)) {
    return res.status(400).json({ error: 'Invalid frequency. Use none|daily|weekly' });
  }
  try {
    await setBackupSchedule(frequency, time);
    res.json({ message: 'Schedule updated', frequency, time });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

