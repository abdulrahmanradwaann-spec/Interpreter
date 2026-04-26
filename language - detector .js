// language-detector.js - كشف اللغة والنبرة
const LanguageDetector = {
    detect(text) {
        const patterns = {
            ar: /[\u0600-\u06FF]/,
            fa: /[\u0600-\u06FF]|[\uFB8A\u067E\u0686\u06AF]/,
            zh: /[\u4e00-\u9fff]/,
            ja: /[\u3040-\u309f\u30a0-\u30ff]/,
            ko: /[\uac00-\ud7af]/,
            ru: /[\u0400-\u04FF]/,
            hi: /[\u0900-\u097F]/
        };
        for (const [lang, re] of Object.entries(patterns)) {
            if (re.test(text)) return lang;
        }
        return 'en';
    },

    detectTone(text) {
        if (!text.trim()) return 'محايد';
        if (/[!！]{2,}/.test(text) || /(عاجل|خطر)/i.test(text)) return 'عاجل';
        if (/[😊😁🙂]/.test(text) || /(هلا|مرحبا)/i.test(text)) return 'غير رسمي';
        if (/(حضرة|سعادة|معالي)/i.test(text)) return 'رسمي';
        return 'محايد';
    }
};
