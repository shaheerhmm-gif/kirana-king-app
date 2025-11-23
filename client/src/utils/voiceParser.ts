interface Product {
    id: string;
    name: string;
}

interface ParsedCommand {
    productId: string | null;
    quantity: number;
    originalTranscript: string;
    matchedName?: string;
}

const NUMBER_MAP: { [key: string]: number } = {
    // English
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    // Hindi / Hinglish
    'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'chaar': 4, 'paanch': 5, 'panch': 5,
    'che': 6, 'cheh': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
    // Marathi (Unique ones)
    'don': 2, 'pach': 5, 'saha': 6, 'sat': 7, 'daha': 10
};

export const parseVoiceCommand = (transcript: string, products: Product[]): ParsedCommand => {
    const lower = transcript.toLowerCase().trim();
    const words = lower.split(/\s+/);

    let quantity = 1;
    let productWords: string[] = [];

    // 1. Extract Quantity
    // Check first word for number
    const firstWord = words[0];
    const numberVal = parseInt(firstWord);

    if (!isNaN(numberVal)) {
        quantity = numberVal;
        productWords = words.slice(1);
    } else if (NUMBER_MAP[firstWord]) {
        quantity = NUMBER_MAP[firstWord];
        productWords = words.slice(1);
    } else {
        // Check if any word is a number (less reliable, but handles "Milk do" style)
        // For MVP, let's stick to "Quantity Product" or "Product" (default 1)
        // Or handle "Product Quantity" (e.g. "Maggie do")

        const lastWord = words[words.length - 1];
        const lastNumVal = parseInt(lastWord);

        if (!isNaN(lastNumVal)) {
            quantity = lastNumVal;
            productWords = words.slice(0, -1);
        } else if (NUMBER_MAP[lastWord]) {
            quantity = NUMBER_MAP[lastWord];
            productWords = words.slice(0, -1);
        } else {
            productWords = words;
        }
    }

    // Filter filler words
    const fillers = ['chahiye', 'karo', 'add', 'de', 'do', 'dya', 'please', 'pack'];
    // Note: 'do' is tricky as it means '2' in Hindi but 'give' in Hindi/English.
    // Context matters. If we already found a number, 'do' might be filler.
    // If we parsed 'do' as 2, we are good.

    const cleanProductSearch = productWords.filter(w => !fillers.includes(w)).join(' ');

    // 2. Fuzzy Match Product
    // Simple inclusion check or Levenshtein could be used. 
    // For MVP: Check if product name contains the search string or vice versa.

    let bestMatch: Product | null = null;
    let bestScore = 0;

    products.forEach(p => {
        const pName = p.name.toLowerCase();
        // Exact match
        if (pName === cleanProductSearch) {
            bestMatch = p;
            bestScore = 100;
        }
        // Contains match
        else if (pName.includes(cleanProductSearch) && cleanProductSearch.length > 2) {
            const score = cleanProductSearch.length / pName.length * 50; // Crude score
            if (score > bestScore) {
                bestMatch = p;
                bestScore = score;
            }
        }
        // Reverse contains (e.g. user says "Colgate" for "Colgate Total")
        else if (cleanProductSearch.includes(pName) && pName.length > 2) {
            const score = pName.length / cleanProductSearch.length * 50;
            if (score > bestScore) {
                bestMatch = p;
                bestScore = score;
            }
        }
    });

    return {
        productId: (bestMatch as Product | null)?.id || null,
        quantity,
        originalTranscript: transcript,
        matchedName: (bestMatch as Product | null)?.name
    };
};
