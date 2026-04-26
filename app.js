// app.js - التشغيل الرئيسي وربط الأحداث
document.addEventListener('DOMContentLoaded', async () => {
    await DB.open();
    const history = await DB.getAll();
    UI.renderHistory(history, document.getElementById('historyList'));

    // التبويبات
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });

    // النص
    document.getElementById('translateBtn').addEventListener('click', async () => {
        const source = document.getElementById('sourceText').value;
        const from = document.getElementById('sourceLang').value;
        const to = document.getElementById('targetLang').value;
        const result = await TextEngine.translate(source, from, to);
        document.getElementById('targetText').value = result;
        await DB.add({ sourceText: source, targetText: result, sourceLang: from, targetLang: to });
        UI.renderHistory(await DB.getAll(), document.getElementById('historyList'));
        UI.showToast('تمت الترجمة');
    });

    document.getElementById('swapLangsBtn').addEventListener('click', () => {
        const sLang = document.getElementById('sourceLang');
        const tLang = document.getElementById('targetLang');
        const sText = document.getElementById('sourceText');
        const tText = document.getElementById('targetText');
        [sLang.value, tLang.value] = [tLang.value, sLang.value];
        [sText.value, tText.value] = [tText.value, sText.value];
    });

    document.getElementById('detectLangBtn').addEventListener('click', () => {
        const text = document.getElementById('sourceText').value;
        const lang = LanguageDetector.detect(text);
        document.getElementById('sourceLang').value = lang;
        UI.showToast('اللغة المكتشفة: ' + lang);
    });

    document.getElementById('copyBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('targetText').value);
        UI.showToast('تم النسخ');
    });

    document.getElementById('speakBtn').addEventListener('click', () => {
        const text = document.getElementById('targetText').value;
        if (text && window.speechSynthesis) {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = document.getElementById('targetLang').value;
            speechSynthesis.speak(u);
        }
    });

    document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
        await DB.clear();
        UI.renderHistory([], document.getElementById('historyList'));
        UI.showToast('تم مسح السجل');
    });

    // الصوت
    const waveCanvas = document.getElementById('waveCanvas');
    const ctx = waveCanvas.getContext('2d');
    let waveAnim;

    function drawWave() {
        ctx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
        for (let i = 0; i < 40; i++) {
            const h = Math.random() * 60 + 5;
            ctx.fillStyle = '#00d4ff';
            ctx.fillRect(i * 12, 50 - h / 2, 8, h);
        }
        if (SpeechEngine.isRecording) requestAnimationFrame(drawWave);
    }

    document.getElementById('micBtn').addEventListener('click', () => {
        if (SpeechEngine.isRecording) {
            SpeechEngine.stop();
            document.getElementById('micBtn').classList.remove('recording');
            cancelAnimationFrame(waveAnim);
        } else {
            const sourceLang = document.getElementById('sourceLang').value;
            SpeechEngine.start(sourceLang, (text) => {
                document.getElementById('speechResult').textContent = text;
                AIEngine.translate(text, sourceLang, document.getElementById('targetLang').value)
                    .then(t => document.getElementById('speechTrans').textContent = t);
            }, (err) => UI.showToast('خطأ: ' + err));
            document.getElementById('micBtn').classList.add('recording');
            drawWave();
        }
    });

    // الصورة
    const dropZone = document.getElementById('imageDropZone');
    const imgInput = document.getElementById('imageInput');
    dropZone.addEventListener('click', () => imgInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) loadImage(file);
    });
    imgInput.addEventListener('change', e => { if (e.target.files[0]) loadImage(e.target.files[0]); });

    function loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreviewContainer').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    document.getElementById('processImageBtn').addEventListener('click', async () => {
        const src = document.getElementById('imagePreview').src;
        if (!src) return;
        const text = await OCREngine.extract(src);
        document.getElementById('ocrResult').textContent = text;
        const trans = await AIEngine.translate(text, 'en', document.getElementById('targetLang').value);
        document.getElementById('ocrTranslation').textContent = trans;
    });

    // حالة الاتصال
    window.addEventListener('online', UI.updateConnection);
    window.addEventListener('offline', UI.updateConnection);
    UI.updateConnection();

    // إخفاء شاشة التحميل
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
        setTimeout(() => document.getElementById('loadingScreen').remove(), 700);
    }, 1000);
});