// text-engine.js - واجهة ترجمة النصوص (نسخة خارقة)
const TextEngine = {
    // الحد الأقصى لطول النص المرسل في الطلب الواحد (لتجنب رفض API)
    MAX_CHUNK_LENGTH: 450,

    async translate(sourceText, sourceLang, targetLang) {
        if (!sourceText || !sourceText.trim()) return '';

        // دعم الاكتشاف التلقائي للغة
        let actualSourceLang = sourceLang;
        if (sourceLang === 'auto') {
            actualSourceLang = LanguageDetector.detect(sourceText);
            if (actualSourceLang === targetLang) {
                return sourceText; // النص بنفس اللغة الهدف
            }
        }

        // إذا كان النص طويلاً، نقسمه إلى أجزاء منطقية ونترجمها بالتوازي
        if (sourceText.length > this.MAX_CHUNK_LENGTH) {
            const chunks = this._splitIntoChunks(sourceText);
            const translatedChunks = await Promise.all(
                chunks.map(chunk => 
                    AIEngine.translate(chunk, actualSourceLang, targetLang)
                        .catch(err => '[خطأ في الترجمة]')
                )
            );
            return translatedChunks.join(' ');
        }

        // نص قصير – ترجمة مباشرة
        return await AIEngine.translate(sourceText, actualSourceLang, targetLang);
    },

    // تقسيم النص إلى أجزاء ذكية (عند حدود الجمل)
    _splitIntoChunks(text) {
        const sentences = text.match(/[^.!?…\n]+[.!?…\n]*/g) || [text];
        const chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            // إذا أضفنا هذه الجملة وتجاوزنا الحد، نبدأ جزءًا جديدًا
            if (currentChunk.length + sentence.length > this.MAX_CHUNK_LENGTH && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        }
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        return chunks.length ? chunks : [text];
    }
};
