// ocr-engine.js - استخراج النص باستخدام Tesseract.js
const OCREngine = {
    async extract(imageSrc) {
        const worker = await Tesseract.createWorker();
        await worker.loadLanguage('eng+ara');
        await worker.initialize('eng+ara');
        const { data: { text } } = await worker.recognize(imageSrc);
        await worker.terminate();
        return text.trim();
    }
};