import axios from 'axios';

const BASE_URL = 'https://world.openfoodfacts.org/api/v2/product';

export interface GlobalProduct {
    name: string;
    category: string;
    image?: string;
    brand?: string;
    barcode?: string;
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

export const searchProductsByName = async (query: string): Promise<GlobalProduct[]> => {
    try {
        const response = await axios.get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1`);

        if (response.data.products) {
            return response.data.products.map((p: any) => ({
                name: p.product_name || p.product_name_en || '',
                category: p.categories_tags?.[0]?.replace('en:', '').split(':')[0] || 'General',
                image: p.image_url,
                brand: p.brands,
                barcode: p.code
            })).filter((p: any) => p.name); // Filter out empty names
        }
        return [];
    } catch (error) {
        console.error('Error searching OpenFoodFacts:', error);
        return [];
    }
};
