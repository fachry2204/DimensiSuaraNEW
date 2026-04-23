import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { performSystemUpdate } from '../utils/systemCheck.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');

// Environment variable for webhook secret (should be set in .env)
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'dimensisuara_webhook_secret';

router.post('/deploy', async (req, res) => {
    try {
        const signature = req.headers['x-hub-signature-256'];
        if (!signature) {
            return res.status(401).send('No signature found');
        }

        const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
        const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

        if (signature !== digest) {
            // In production, use timingSafeEqual
            console.warn('Webhook signature mismatch');
            return res.status(401).send('Invalid signature');
        }

        const event = req.headers['x-github-event'];
        if (event === 'push') {
            const branch = req.body.ref;
            if (branch === 'refs/heads/main') {
                console.log('Received push to main. Starting deployment...');
                
                // Perform update in background so GitHub doesn't timeout
                performSystemUpdate(PROJECT_ROOT).then(() => {
                    console.log('Automatic deployment completed successfully.');
                    // Optional: Trigger server restart logic here if not handled inside performSystemUpdate
                    // Note: performSystemUpdate doesn't exit process, but in settingsRoutes we do.
                    // For automatic deployment, we might want to be careful about restarting immediately if requests are active.
                    // But for now, we'll follow the same pattern.
                    setTimeout(() => {
                        console.log('Restarting server after webhook deployment...');
                        process.exit(0);
                    }, 2000);
                }).catch(err => {
                    console.error('Automatic deployment failed:', err);
                });

                return res.status(200).send('Deployment started');
            } else {
                return res.status(200).send('Ignored push to non-main branch');
            }
        } else {
            return res.status(200).send('Ignored non-push event');
        }
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
