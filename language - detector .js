// language-detector.js - كشف اللغة والنبرة (نسخة مُحسَّنة)
const LanguageDetector = {
    detect(text) {
        // ترتيب الأنماط مهم: نبدأ باللغات ذات الأحرف الإضافية قبل العربية الأساسية
        const patterns = {
            fa: /[\uFB8A\u067E\u0686\u06AF]/, // الفارسية أولاً لتجنب الخلط مع العربية
            ar: /[\u0600-\u06FF]/,             // العربية تشمل الفارسية أيضاً (لكن الفحص بدأ من الفارسية)
            zh: /[\u4e00-\u9fff]/,
            ja: /[\u3040-\u309f\u30a0-\u30ff]/,
            ko: /[\uac00-\ud7af]/,
            ru: /[\u0400-\u04FF]/,
            hi: /[\u0900-\u097F]/
        };
        for (const [lang, re] of Object.entries(patterns)) {
            if (re.test(text)) return lang;
        }
        return 'en'; // لغة افتراضية إن لم تنطبق أي قاعدة
    },

    detectTone(text) {
        // تطبيع النص (إزالة المسافات الزائدة)
        const cleanText = text.trim();
        if (!cleanText) return 'محايد';

        // التحقق من الطابع الرسمي (أولوية أعلى لأنه قد يتعايش مع علامات أخرى)
        if (/(حضرة|سعادة|معالي)/i.test(cleanText)) return 'رسمي';

        // الطابع العاجل
        if (/[!！]{2,}/.test(cleanText) || /(عاجل|خطر)/i.test(cleanText)) return 'عاجل';

        // الطابع غير الرسمي
        if (/[😊😁🙂]/.test(cleanText) || /(هلا|مرحبا)/i.test(cleanText)) return 'غير رسمي';

        return 'محايد';
    }
};
