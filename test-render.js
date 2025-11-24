async function testRenderBackend() {
    const RENDER_URL = 'https://kirana-backend-j7x7.onrender.com';

    console.log('🔍 Testing Render Backend...\n');

    // Test 1: Health Check
    console.log('1️⃣ Testing /health endpoint...');
    try {
        const healthRes = await fetch(`${RENDER_URL}/health`);
        const healthData = await healthRes.json();
        console.log('✅ Health check:', healthData);
    } catch (err) {
        console.log('❌ Health check failed:', err.message);
    }

    // Test 2: Login Endpoint
    console.log('\n2️⃣ Testing /api/auth/login endpoint...');
    try {
        const loginRes = await fetch(`${RENDER_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: '9999999999',
                password: 'test123'
            })
        });

        const loginData = await loginRes.json();
        console.log('Status:', loginRes.status);
        console.log('Response:', JSON.stringify(loginData, null, 2));

        if (loginRes.status === 400) {
            console.log('\n✅ Backend is WORKING! (400 = invalid credentials is expected)');
        } else if (loginRes.status === 500) {
            console.log('\n❌ Backend ERROR! Database or schema issue');
        }
    } catch (err) {
        console.log('❌ Login test failed:', err.message);
    }
}

testRenderBackend();
