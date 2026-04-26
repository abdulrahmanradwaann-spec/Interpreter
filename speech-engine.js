// speech-engine.js - التعرف على الصوت والترجمة الفورية
const SpeechEngine = (() => {
    let recognition = null;
    let isRecording = false;

    function start(lang, onResult, onError) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            onError('متصفحك لا يدعم التعرف الصوتي');
            return;
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

        recognition.onerror = (e) => onError(e.error);
        recognition.onend = () => {
            if (isRecording) recognition.start();
        };

        recognition.start();
        isRecording = true;
    }

    function stop() {
        if (recognition) {
            recognition.stop();
            recognition = null;
        }
        isRecording = false;
    }

    return { start, stop, get isRecording() { return isRecording; } };
})();