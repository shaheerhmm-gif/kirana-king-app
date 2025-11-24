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
        // Check if any word is a number (handles "Maggie do" style)
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

    // Filter filler words - BUT be careful with 'do' since it means '2' in Hindi
    // Only filter 'do' if we already extracted a different quantity
    const fillers = ['chahiye', 'karo', 'add', 'de', 'dya', 'please', 'pack'];
    // Add 'do' to fillers only if we've already found a quantity that's not 1 (default)
    const fillersToUse = quantity !== 1 ? [...fillers, 'do'] : fillers;

    const cleanProductSearch = productWords.filter(w => !fillersToUse.includes(w)).join(' ');

    // 2. Fuzzy Match Product
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
            const score = cleanProductSearch.length / pName.length * 50;
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

    console.log('[Voice Parser] Input:', transcript);
    console.log('[Voice Parser] Quantity:', quantity);
    console.log('[Voice Parser] Product Search:', cleanProductSearch);
    console.log('[Voice Parser] Best Match:', bestMatch?.name, 'Score:', bestScore);

    return {
        productId: bestMatch?.id || null,
        quantity,
        originalTranscript: transcript,
        matchedName: bestMatch?.name
    };
};
