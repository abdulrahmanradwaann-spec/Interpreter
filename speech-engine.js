// speech-engine.js - التعرف على الصوت والترجمة الفورية (مُحسَّن)
const SpeechEngine = (() => {
    let recognition = null;
    let isRecording = false;
    let shouldRestart = false;

    function start(lang, onResult, onError) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            onError('متصفحك لا يدعم التعرف الصوتي');
            return;
        }

        // إنهاء أي جلسة سابقة بشكل آمن
        if (recognition) {
            recognition.abort();
            recognition = null;
        }

        recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (e) => {
            let transcript = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                transcript += e.results[i][0].transcript;
            }
            onResult(transcript);
        };

        recognition.onerror = (e) => {
            console.warn('خطأ في التعرف الصوتي:', e.error);
            // الأخطاء التي تعني أن الخدمة لن تعود للعمل
            const fatalErrors = ['not-allowed', 'service-not-allowed'];
            if (fatalErrors.includes(e.error)) {
                shouldRestart = false;
                stop();
                onError('تم رفض الوصول إلى الميكروفون أو الخدمة غير متاحة');
            } else {
                // أخطاء مؤقتة (مثل no-speech، audio-capture، network)
                onError(e.error);
                // سنحاول إعادة التشغيل تلقائيًا عند onend
            }
        };

        recognition.onend = () => {
            // أعِد التشغيل فقط إذا كان مطلوبًا وما زلنا في حالة تسجيل
            if (shouldRestart && isRecording) {
                // تأخير بسيط لتجنب تعارض إعادة التشغيل الفورية
                setTimeout(() => {
                    if (shouldRestart && isRecording) {
                        try {
                            recognition.start();
                        } catch (err) {
                            console.warn('تعذر إعادة تشغيل التعرف:', err);
                            stop();
                        }
                    }
                }, 100);
            } else {
                // تأكد من إيقاف الحالة إذا لم نعد نريد إعادة التشغيل
                if (isRecording) {
                    stop();
                }
            }
        };

        try {
            recognition.start();
            isRecording = true;
            shouldRestart = true;
        } catch (err) {
            onError('فشل بدء التعرف الصوتي: ' + err.message);
            stop();
        }
    }

    function stop() {
        shouldRestart = false;
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
                // تم إيقافه بالفعل
            }
            recognition = null;
        }
        isRecording = false;
    }

    return {
        start,
        stop,
        get isRecording() { return isRecording; }
    };
})();
