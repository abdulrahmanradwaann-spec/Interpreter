// ai-engine.js - محرك الترجمة (API/Offline)
const AIEngine = {
    async translate(text, from, to) {
        if (!text.trim()) return '';

        // تجربة الترجمة عبر الإنترنت (POST لتجنب محدودية طول الرابط)
        try {
            const formData = new FormData();
            formData.append('q', text);
            formData.append('langpair', `${from}|${to}`);
            formData.append('mt', '1');

            const res = await fetch('https://api.mymemory.translated.net/get', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            if (data.responseStatus === 200 && data.responseData?.translatedText) {
                return data.responseData.translatedText.trim();
            } else {
                throw new Error('استجابة غير صالحة من API');
            }
        } catch (e) {
            console.warn('تعذر الاتصال بخدمة الترجمة، استخدام الوضع المحلي:', e.message);
        }

        // وضع عدم الاتصال – ترجمة محاكاة محسنة (تحافظ على الأحرف المركبة)
        const preview = Array.from(text).slice(0, 40).join(''); // يدعم العربية والإيموجي
        return `[AI] ${preview}${text.length > 40 ? ' ...' : ''} (${to})`;
    }
};
          
