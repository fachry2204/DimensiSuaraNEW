
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTc3MTk0NTQxMCwiZXhwIjoxNzcxOTQ5MDEwfQ.j_0vxED5BsPnFl7-n0fQaPy-ovua0PV96e9gMwjvTVk';

async function testPublishing() {
    try {
        const headers = {
            'Authorization': `Bearer ${TOKEN}`
        };

        console.log('--- Testing Publishing Module ---');

        // 1. Get Creators (expect empty or list)
        console.log('\n1. Fetching creators...');
        let res = await fetch(`${BASE_URL}/publishing/creators`, { headers });
        if (!res.ok) throw new Error(`Failed to fetch creators: ${res.status} ${await res.text()}`);
        let creators = await res.json();
        console.log(`Creators count: ${creators.length}`);

        // 2. Create a Creator
        console.log('\n2. Creating a new creator...');
        const form = new FormData();
        form.append('name', 'Test Writer ' + Date.now());
        form.append('ipi_number', '123456789');
        form.append('email', `writer${Date.now()}@example.com`);
        form.append('phone', '08123456789');
        form.append('bank_name', 'BCA');
        form.append('bank_account_number', '1234567890');
        form.append('notes', 'Test notes');
        // Attach dummy files for ktp and npwp if required, or just skip if optional
        // Based on previous code, they might be handled by multer.
        // Let's try without files first, or create dummy files.
        
        // Creating dummy file
        fs.writeFileSync('dummy.jpg', 'dummy content');
        form.append('ktp', fs.createReadStream('dummy.jpg'));
        form.append('npwp', fs.createReadStream('dummy.jpg'));

        res = await fetch(`${BASE_URL}/publishing/creators`, { 
            method: 'POST', 
            headers: { ...headers, ...form.getHeaders() },
            body: form
        });
        
        if (!res.ok) {
            console.log('Create creator failed (might be expected if validation fails):', await res.text());
        } else {
            const newCreator = await res.json();
            console.log('Creator created:', newCreator.id);

            // 3. Create a Song
            console.log('\n3. Creating a new song...');
            const songForm = new FormData();
            songForm.append('title', 'Test Song ' + Date.now());
            songForm.append('iswc_code', 'T-123.456.789-0');
            // writers array needs to be stringified for the backend to parse
            // The backend expects objects with { name, share_percent, role }
            const writersData = JSON.stringify([{ name: 'Test Writer ' + Date.now(), share_percent: 100, role: 'Composer' }]);
            songForm.append('writers', writersData);
            
            res = await fetch(`${BASE_URL}/publishing/songs`, {
                method: 'POST',
                headers: { ...headers, ...songForm.getHeaders() },
                body: songForm
            });

            if (!res.ok) {
                console.log('Create song failed:', await res.text());
            } else {
                const newSong = await res.json();
                console.log('Song created:', newSong.id);
            }
        }

        // Cleanup
        if (fs.existsSync('dummy.jpg')) fs.unlinkSync('dummy.jpg');

    } catch (err) {
        console.error('Test failed:', err);
    }
}

testPublishing();
