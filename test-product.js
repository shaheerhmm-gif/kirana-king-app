async function testProductManagement() {
    const BASE_URL = 'http://localhost:3000/api';
    let token = '';

    // 1. Login to get token
    try {
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: '9999999999',
                password: 'test'
            })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const loginData = await loginRes.json();
        token = loginData.token;
        console.log('✅ Login successful');
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. Create Product
    let productId = '';
    try {
        console.log('\nCreating Product...');
        const createRes = await fetch(`${BASE_URL}/inventory`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Test Product ' + Date.now(),
                barcode: '123456789',
                category: 'Test Category',
                supplierName: 'Test Supplier',
                costPrice: 100,
                sellingPrice: 150,
                stock: 10,
                unit: 'Pcs',
                isSoldByWeight: false
            })
        });

        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.message || createRes.statusText);

        console.log('✅ Product created:', createData.product.name);
        productId = createData.product.id;
    } catch (error) {
        console.error('❌ Create Product failed:', error.message);
    }

    // 3. Update Product
    if (productId) {
        try {
            console.log('\nUpdating Product...');
            const updateRes = await fetch(`${BASE_URL}/inventory/${productId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    name: 'Updated Test Product',
                    sellingPrice: 160
                })
            });

            const updateData = await updateRes.json();
            if (!updateRes.ok) throw new Error(updateData.message || updateRes.statusText);

            console.log('✅ Product updated:', updateData.product.name);
        } catch (error) {
            console.error('❌ Update Product failed:', error.message);
        }
    }

    // 4. Delete Product
    if (productId) {
        try {
            console.log('\nDeleting Product...');
            const deleteRes = await fetch(`${BASE_URL}/inventory/${productId}`, {
                method: 'DELETE',
                headers
            });

            if (!deleteRes.ok) {
                const deleteData = await deleteRes.json();
                throw new Error(deleteData.message || deleteRes.statusText);
            }

            console.log('✅ Product deleted');
        } catch (error) {
            console.error('❌ Delete Product failed:', error.message);
        }
    }
}

testProductManagement();
