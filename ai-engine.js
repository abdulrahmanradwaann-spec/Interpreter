// ai-engine.js - محرك الترجمة (API/Offline)
const AIEngine = {
    async translate(text, from, to) {
        if (!text.trim()) return '';
        // محاولة الترجمة عبر الإنترنت
        if (navigator.onLine) {
            try {
                const res = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}&mt=1`
                );
                const data = await res.json();
                if (data.responseStatus === 200 && data.responseData?.translatedText) {
                    return data.responseData.translatedText;
                }
            } catch (e) {
                console.warn('تعذر الاتصال بخدمة الترجمة، استخدام الوضع المحلي');
            }
        }
        // وضع عدم الاتصال – محاكاة ترجمة بسيطة
        return `[AI] ${text.substring(0, 40)} ... (${to})`;
    }
};