// ocr-engine.js - استخراج النص باستخدام Tesseract.js (مُحسَّن)
const OCREngine = {
    async extract(imageSrc) {
        let worker = null;
        try {
            // الطريقة الموصى بها في Tesseract v5: تمرير اللغات مباشرة
            worker = await Tesseract.createWorker('eng+ara');
            const { data: { text } } = await worker.recognize(imageSrc);
            return text.trim();
        } catch (error) {
            console.error('فشل التعرف على النص:', error);
            throw new Error('تعذر استخراج النص من الصورة');
        } finally {
            // ضمان إغلاق الـ worker في جميع الحالات (نجاح أو فشل)
            if (worker) {
                await worker.terminate();
            }
        }
    }
};
