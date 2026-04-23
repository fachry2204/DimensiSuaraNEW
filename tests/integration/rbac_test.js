
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch'; // Try using node-fetch if available, otherwise global fetch in node 18+

// Helper to handle fetch if node-fetch is not resolved (Node 18+ has global fetch)
const _fetch = (typeof fetch === 'undefined') ? global.fetch : fetch;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000/api';
let token = '';
let releaseId = '';
let userId = '';

const username = `testuser_rbac_${Date.now()}`;
const password = 'password123';
const email = `${username}@example.com`;

async function run() {
    try {
        console.log('--- STARTING RBAC TEST ---');

        // 1. REGISTER
        console.log(`1. Registering user: ${username}`);
        const regRes = await _fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(`Register failed: ${JSON.stringify(regData)}`);
        console.log('   Registered successfully. User ID:', regData.userId);

        // 2. LOGIN
        console.log('2. Logging in...');
        const loginRes = await _fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        token = loginData.token;
        userId = loginData.user.id;
        console.log('   Logged in. Role:', loginData.user.role);

        if (loginData.user.role !== 'User') {
             console.warn('   WARNING: Expected role User, got', loginData.user.role);
        }

        // 3. CREATE RELEASE
        console.log('3. Creating Release...');
        const releaseData = {
            title: `Test Release ${Date.now()}`,
            primaryArtists: ['Test Artist'],
            type: 'SINGLE',
            genre: 'Pop',
            subGenre: 'Synth Pop',
            label: 'Test Label',
            pLine: '2024 Test',
            cLine: '2024 Test',
            language: 'English',
            version: 'Original',
            tracks: [
                {
                    trackNumber: 1,
                    title: 'Test Track',
                    primaryArtists: ['Test Artist'],
                    genre: 'Pop',
                    subGenre: 'Synth Pop',
                    explicitLyrics: 'No',
                    audioFile: null // Allow null for test
                }
            ]
        };

        const form = new FormData();
        form.append('data', JSON.stringify(releaseData));
        
        const createRes = await _fetch(`${BASE_URL}/releases`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            },
            body: form
        });
        
        // Handle response
        // Note: createRelease returns 201 or 200 (if duplicate)
        let createJson;
        try {
            createJson = await createRes.json();
        } catch (e) {
            const text = await createRes.text();
            throw new Error(`Create failed (non-json): ${text}`);
        }

        if (!createRes.ok) throw new Error(`Create failed: ${JSON.stringify(createJson)}`);
        
        releaseId = createJson.id; // Corrected: endpoint returns { message, id }
        // Actually releaseRoutes.js line 787 sets releaseId, but response (line 909) returns { message, id: releaseId }
        // But wait, line 909: res.status(isUpdate ? 200 : 201).json({ message: ..., id: releaseId });
        
        // Wait, line 787 is inside `if (!isUpdate)`.
        // Line 909 uses `releaseId`.
        // However, I noticed some logic about `existing` checks.
        
        console.log('   Release created. ID:', releaseId);

        if (!releaseId) throw new Error('Release ID not returned');

        // 4. UPDATE COVER ART
        console.log('4. Updating Cover Art (Expect success + status change)...');
        // Create dummy cover file
        const dummyCoverPath = path.join(__dirname, 'dummy_cover.jpg');
        fs.writeFileSync(dummyCoverPath, 'dummy image content');

        const coverForm = new FormData();
        coverForm.append('cover_art', fs.createReadStream(dummyCoverPath));

        const coverRes = await _fetch(`${BASE_URL}/releases/${releaseId}/cover-art`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...coverForm.getHeaders()
            },
            body: coverForm
        });

        const coverJson = await coverRes.json();
        if (!coverRes.ok) throw new Error(`Update cover failed: ${JSON.stringify(coverJson)}`);
        
        console.log('   Cover update response:', coverJson);
        if (coverJson.status !== 'Request Edit') {
            throw new Error(`Expected status 'Request Edit', got '${coverJson.status}'`);
        }
        console.log('   SUCCESS: Status changed to Request Edit');

        // Clean up dummy file
        fs.unlinkSync(dummyCoverPath);

        // 5. ATTEMPT WORKFLOW UPDATE (Expect 403)
        console.log('5. Attempting Workflow Update (Expect 403)...');
        const workflowRes = await _fetch(`${BASE_URL}/releases/${releaseId}/workflow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'Live' })
        });
        
        if (workflowRes.status === 403) {
            console.log('   SUCCESS: Access denied (403) as expected.');
        } else {
            const wJson = await workflowRes.json().catch(() => ({}));
            throw new Error(`Expected 403, got ${workflowRes.status}. Response: ${JSON.stringify(wJson)}`);
        }

        // 6. ATTEMPT DELETE (Expect 403)
        console.log('6. Attempting Delete (Expect 403)...');
        const deleteRes = await _fetch(`${BASE_URL}/releases/${releaseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (deleteRes.status === 403) {
            console.log('   SUCCESS: Access denied (403) as expected.');
        } else {
            const dJson = await deleteRes.json().catch(() => ({}));
            throw new Error(`Expected 403, got ${deleteRes.status}. Response: ${JSON.stringify(dJson)}`);
        }

        console.log('--- ALL TESTS PASSED ---');

    } catch (e) {
        console.error('TEST FAILED:', e.message);
        if (e.cause) console.error(e.cause);
    }
}

run();
