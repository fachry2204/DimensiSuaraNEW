
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function test() {
    try {
        // 1. Login (assuming a test user exists, or I can create one)
        // I'll try with admin credentials if I knew them, or just use a known user.
        // I'll check the database for a user first.
        
        // Actually, let's just try to fetch releases with a dummy token and see if it fails with 403 or 500.
        // If it fails with 403, the server is up.
        // If it fails with 500, we have a server error.
        
        console.log('Testing GET /releases without token...');
        const res1 = await fetch(`${BASE_URL}/releases`);
        console.log('Status:', res1.status); // Should be 401 or 403
        
        if (res1.status === 500) {
            console.error('Server error on unauthorized request!');
            const text = await res1.text();
            console.error(text);
        }

        // 2. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'password' }) // Trying default creds
        });
        
        if (!loginRes.ok) {
            console.log('Login failed:', loginRes.status);
            // Maybe try to register a user?
            return;
        }
        
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Got token:', token);
        
        // 3. Fetch Releases
        console.log('Fetching releases...');
        const relRes = await fetch(`${BASE_URL}/releases`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Releases Status:', relRes.status);
        if (!relRes.ok) {
            const text = await relRes.text();
            console.error('Error body:', text);
        } else {
            const data = await relRes.json();
            console.log('Releases count:', data.length);
        }
        
    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();
