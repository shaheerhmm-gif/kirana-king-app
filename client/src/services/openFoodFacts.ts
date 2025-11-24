import axios from 'axios';

const BASE_URL = 'https://world.openfoodfacts.org/api/v2/product';

export interface GlobalProduct {
    name: string;
    category: string;
    image?: string;
    brand?: string;
}

export const fetchProductByBarcode = async (barcode: string): Promise<GlobalProduct | null> => {
    try {
        const response = await axios.get(`${BASE_URL}/${barcode}.json`);

        if (response.data.status === 1) {
            const product = response.data.product;
            return {
                name: product.product_name || product.product_name_en || '',
                category: product.categories_tags?.[0]?.replace('en:', '').split(':')[0] || 'General',
                image: product.image_url,
                brand: product.brands
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching from OpenFoodFacts:', error);
        return null;
    }
};
