/**
 * Interpreter AI 2026 - Web Native OS Logic
 * Pure ES2024+ implementation of the platform.
 */

// --- Global State Manager ---
import { security } from './security.js';
import { aiEngines } from './engines.js';

// --- PWA & Update System ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        const registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New version available!
                    showUpdateToast(newWorker);
                }
            });
        });
    });
}

function showUpdateToast(worker) {
    const toast = document.getElementById('update-toast');
    const btn = document.getElementById('update-btn');
    
    toast.classList.remove('translate-y-32');
    toast.classList.add('translate-y-0');
    
    btn.addEventListener('click', () => {
        worker.postMessage('SKIP_WAITING');
        window.location.reload();
    });
}

const state = {
    files: [],
    activeFile: null,
    isRecording: false,
    recognition: null,
    audioCtx: null,
    analyser: null,
};

// --- DOM Elements ---
const dom = {
    clock: document.getElementById('os-clock'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    micBtn: document.getElementById('mic-btn'),
    micActive: document.getElementById('mic-active'),
    audioViz: document.getElementById('audio-viz'),
    processingView: document.getElementById('processing-view'),
    emptyView: document.getElementById('empty-view'),
    progressBar: document.getElementById('progress-bar'),
    progressPercent: document.getElementById('progress-percent'),
    resultText: document.getElementById('result-text'),
    resultTags: document.getElementById('result-tags'),
    activeFilename: document.getElementById('active-filename'),
    activeFiletype: document.getElementById('active-filetype'),
    activeFilesize: document.getElementById('active-filesize'),
    filePreview: document.getElementById('file-preview'),
};

// --- Clock Logic ---
function updateClock() {
    const now = new Date();
    dom.clock.innerText = now.toLocaleTimeString('en-US', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// --- File Handling ---
dom.dropZone.addEventListener('click', () => dom.fileInput.click());
dom.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.dropZone.classList.add('border-primary');
});
dom.dropZone.addEventListener('dragleave', () => dom.dropZone.classList.remove('border-primary'));
dom.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.dropZone.classList.remove('border-primary');
    handleFiles(e.dataTransfer.files);
});
dom.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

async function handleFiles(fileList) {
    for (const file of fileList) {
        // Security Check
        const validation = security.validate(file);
        if (!validation.valid) {
            alert(validation.msg);
            continue;
        }

        const fileObj = {
            id: Math.random().toString(36).substr(2, 9),
            name: validation.safeName,
            size: file.size,
            type: file.type,
            file: file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        };
        state.files.push(fileObj);
        processFile(fileObj);
    }
}

async function processFile(fileObj) {
    state.activeFile = fileObj;
    dom.emptyView.classList.add('hidden');
    dom.processingView.classList.remove('hidden');
    
    // UI Update
    dom.activeFilename.innerText = fileObj.name;
    dom.activeFiletype.innerText = fileObj.type.toUpperCase();
    dom.activeFilesize.innerText = (fileObj.size / (1024 * 1024)).toFixed(1) + ' MB';
    
    // Clear previous results
    dom.resultText.innerText = '';
    dom.resultTags.innerHTML = '';
    
    if (fileObj.preview) {
        dom.filePreview.style.backgroundImage = `url(${fileObj.preview})`;
        dom.filePreview.style.backgroundSize = 'cover';
        dom.filePreview.style.backgroundPosition = 'center';
    } else {
        dom.filePreview.style.background = 'rgba(255,255,255,0.05)';
        dom.filePreview.innerHTML = '<div class="w-full h-full flex items-center justify-center opacity-20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg></div>';
    }

    // Determine which engine to use
    let engine;
    if (fileObj.type.startsWith('image/')) engine = aiEngines.image;
    else if (fileObj.type.startsWith('video/')) engine = aiEngines.video;
    else if (fileObj.type.startsWith('audio/')) engine = aiEngines.audio;
    else engine = aiEngines.document;

    // Simulation of Neural Processing
    let progress = 0;
    const interval = setInterval(async () => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Actual AI Processing Call
            const result = await engine.process(fileObj.file);
            showResult(result);
        }
        dom.progressBar.style.width = `${progress}%`;
        dom.progressPercent.innerText = `${Math.round(progress)}%`;
    }, 150);
}

function showResult(result) {
    dom.resultText.innerText = result.text;
    
    dom.resultTags.innerHTML = result.tags.map(tag => `
        <span class="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold"># ${tag}</span>
    `).join('');
}

// --- Audio Engine (Speech Recognition) ---
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.recognition = new SpeechRecognition();
    state.recognition.continuous = true;
    state.recognition.interimResults = true;
    state.recognition.lang = 'ar-SA';

    state.recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
        dom.resultText.innerText = transcript;
    };
}

dom.micBtn.addEventListener('click', toggleMic);

async function toggleMic() {
    if (state.isRecording) {
        state.recognition.stop();
        state.micActive.classList.add('hidden');
        state.isRecording = false;
        dom.micBtn.querySelector('span').innerText = 'بدء التسجيل الحي';
    } else {
        try {
            state.recognition.start();
            state.isRecording = true;
            state.micActive.classList.remove('hidden');
            dom.micBtn.querySelector('span').innerText = 'جاري الاستماع...';
            initAudioViz();
        } catch (e) {
            console.error('Mic Access Denied', e);
        }
    }
}

async function initAudioViz() {
    if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        state.analyser = state.audioCtx.createAnalyser();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = state.audioCtx.createMediaStreamSource(stream);
        source.connect(state.analyser);
    }
    
    const canvas = dom.audioViz;
    const ctx = canvas.getContext('2d');
    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        if (!state.isRecording) return;
        requestAnimationFrame(draw);
        state.analyser.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            ctx.fillStyle = `rgba(59, 130, 246, ${dataArray[i]/255})`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }
    draw();
}

// --- Export System ---
document.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const resultText = dom.resultText.innerText;
        
        if (!resultText || resultText === 'جاري الاستماع...') {
            alert('يرجى معالجة ملف أولاً قبل التصدير.');
            return;
        }

        let content = resultText;
        let filename = `InterpreterAI_Export_${Date.now()}.${type}`;
        let mimeType = 'text/plain';

        if (type === 'json') {
            content = JSON.stringify({
                platform: 'Interpreter AI 2026',
                timestamp: new Date().toISOString(),
                result: resultText,
                file: state.activeFile ? state.activeFile.name : 'Live Recording'
            }, null, 2);
            mimeType = 'application/json';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log(`[Export] Success: ${filename}`);
    });
});

console.log('Interpreter AI 2026 Native OS - Initialized');
