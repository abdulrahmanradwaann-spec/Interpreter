// text-engine.js - واجهة ترجمة النصوص
const TextEngine = {
    async translate(sourceText, sourceLang, targetLang) {
        return await AIEngine.translate(sourceText, sourceLang, targetLang);
    }
};