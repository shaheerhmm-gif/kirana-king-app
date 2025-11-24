import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'mr' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={i18n.language === 'en' ? 'Switch to Marathi' : 'Switch to English'}
        >
            <Languages className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="sr-only">Switch Language</span>
        </button>
    );
};

export default LanguageSwitcher;
