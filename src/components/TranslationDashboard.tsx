import { useState, useCallback, useRef } from "react";
import { GlassPanel } from "./GlassPanel";
import { LanguageSelector } from "./LanguageSelector";
import { MicrophoneButton } from "./MicrophoneButton";
import { ImageUploader } from "./ImageUploader";
import { HistoryPanel } from "./HistoryPanel";
import { translateText, enhanceTranslation } from "../services/geminiService";
import { performOCR } from "../services/ocrService";
import { db } from "../services/db";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { 
  Languages, 
  Send, 
  Volume2, 
  Copy, 
  Sparkles, 
  Type, 
  Mic, 
  Image as ImageIcon,
  Check,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import confetti from "canvas-confetti";

type Mode = 'text' | 'speech' | 'image';

export function TranslationDashboard() {
  const [mode, setMode] = useState<Mode>('text');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('ar');
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [tone, setTone] = useState("neutral");
  const [details, setDetails] = useState<{ tone?: string; explanation?: string }>({});

  const { isSupported: isSpeechSupported, start: startSpeech, stop: stopSpeech } = useSpeechToText(
    (transcript) => setSourceText(transcript),
    () => {
      if (sourceText) handleTranslate();
    }
  );
  const [isRecording, setIsRecording] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);
    try {
      const result = await translateText(sourceText, sourceLang, targetLang, tone);
      setTranslatedText(result.translatedText);
      setDetails({ tone: result.detectedTone, explanation: result.explanation });
      
      // Save to history
      await db.translations.add({
        sourceText,
        translatedText: result.translatedText,
        sourceLang: sourceLang === 'auto' ? result.detectedLanguage || 'auto' : sourceLang,
        targetLang,
        type: mode,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleEnhance = async () => {
    if (!translatedText) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceTranslation(translatedText);
      setTranslatedText(enhanced);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f2ff', '#bc13fe']
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleImageSelect = async (file: File) => {
    setIsTranslating(true);
    try {
      const text = await performOCR(file);
      setSourceText(text);
      setMode('text'); // Switch to text to show results or keep in image mode if overlay is ready
      // Automatically translate
      const result = await translateText(text, sourceLang, targetLang, tone);
      setTranslatedText(result.translatedText);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = targetLang;
    window.speechSynthesis.speak(utterance);
  };

  const exportResult = () => {
    if (!translatedText) return;
    const element = document.createElement("a");
    const file = new Blob([`Source: ${sourceText}\n\nTranslation: ${translatedText}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "aura-translation.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Main Translation Interface */}
      <div className="lg:col-span-9 space-y-6">
        
        {/* Language Header Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/40 uppercase tracking-tighter">Source</span>
              <LanguageSelector 
                value={sourceLang} 
                onChange={setSourceLang} 
                allowAuto
              />
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
              <Languages className="w-5 h-5 text-white/60 group-hover:text-cyan-400 transition-colors" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/40 uppercase tracking-tighter">Target</span>
              <LanguageSelector value={targetLang} onChange={setTargetLang} />
            </div>
          </div>
        </div>

        {/* Translation Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          {/* Source Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative flex flex-col group min-h-[400px]">
            <div className="flex-1 relative">
              <AnimatePresence mode="wait">
                {mode === 'text' && (
                  <motion.textarea
                    key="text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Enter transcript or paste text..."
                    className="w-full h-full bg-transparent resize-none border-none outline-none text-2xl font-light leading-relaxed placeholder:text-white/10"
                  />
                )}
                {mode === 'speech' && (
                  <motion.div
                    key="speech"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center gap-8"
                  >
                    <div className="space-y-4">
                      <p className="text-cyan-400 font-medium uppercase tracking-[0.2em] text-[10px]">Real-time Audio Stream</p>
                      <h3 className="text-2xl font-light text-white/80">
                        {isRecording ? "Listening for nuances..." : "Ready to process speech"}
                      </h3>
                      {sourceText && (
                        <p className="text-lg opacity-60 line-clamp-3 px-8">{sourceText}</p>
                      )}
                    </div>
                    <MicrophoneButton 
                      isRecording={isRecording} 
                      onToggle={() => {
                        if (isRecording) {
                          stopSpeech();
                          setIsRecording(false);
                        } else {
                          startSpeech();
                          setIsRecording(true);
                        }
                      }}
                    />
                  </motion.div>
                )}
                {mode === 'image' && (
                  <motion.div
                    key="image"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col justify-center"
                  >
                    <ImageUploader onImageSelect={handleImageSelect} isProcessing={isTranslating} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between mt-4">
               <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                     <Mic className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setMode('image')}>
                     <ImageIcon className="w-5 h-5 text-white/40" />
                  </div>
               </div>
               <button
                  onClick={handleTranslate}
                  disabled={isTranslating || !sourceText}
                  className="px-6 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-all font-bold tracking-widest text-[10px] uppercase active:scale-95 disabled:opacity-50"
                >
                  {isTranslating ? "Processing..." : "Translate"}
                </button>
            </div>
            
            <div className="absolute top-4 right-4 flex gap-1 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="text-[9px] text-white/40 font-mono">ONLINE</span>
            </div>
          </div>

          {/* Target Card */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl border border-white/20 rounded-3xl p-8 relative flex flex-col min-h-[400px]">
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {isTranslating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center gap-4 opacity-40"
                  >
                    <Sparkles className="w-12 h-12 animate-pulse text-cyan-400" />
                    <p className="text-sm font-mono tracking-widest animate-pulse">OPTIMIZING LAYER...</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6 h-full flex flex-col"
                  >
                    <p className={cn(
                      "text-2xl font-light leading-relaxed flex-1",
                      targetLang === 'ar' && "text-right font-serif",
                      !translatedText && "text-white/10"
                    )}>
                      {translatedText || "Neural translation will materialize here..."}
                    </p>
                    
                    {details.explanation && (
                      <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                        <p className="text-[10px] uppercase tracking-widest text-cyan-400 mb-2 flex items-center gap-2">
                          <Sparkles className="w-3 h-3" /> Core Insight
                        </p>
                        <p className="text-xs text-white/60 leading-relaxed italic">{details.explanation}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {translatedText && (
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex gap-3">
                  <button 
                    onClick={handleEnhance}
                    disabled={isEnhancing}
                    className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-[10px] font-bold tracking-widest text-cyan-400 uppercase transition-all"
                  >
                    {isEnhancing ? "Refining..." : "REWRITE"}
                  </button>
                  <button 
                    onClick={exportResult}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold tracking-widest text-white/60 uppercase transition-all"
                  >
                    EXPORT
                  </button>
                </div>
                <div className="flex items-center gap-2 opacity-60">
                   <button onClick={speak} className="p-2 hover:text-cyan-400 transition-colors"><Volume2 className="w-4 h-4" /></button>
                   <button onClick={copyToClipboard} className="p-2 hover:text-cyan-400 transition-colors">
                     {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                   </button>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-cyan-400/5 rounded-3xl pointer-events-none"></div>
          </div>
        </div>

        {/* AI Stats Footer Bar */}
        <div className="h-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center px-6 gap-6 shadow-lg">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/30 uppercase tracking-widest mb-1 font-bold">Neural Core</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.6)]"></div>
              <span className="text-xs font-mono font-bold tracking-tighter">HYBRID-V4.2 [LTS]</span>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex-1 flex items-center gap-4">
            <div className="flex items-end gap-[3px] h-6 flex-1 opacity-30">
              {[...Array(24)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [8, Math.random() * 20 + 4, 8] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.05 }}
                  className="bg-cyan-400 w-1 rounded-full"
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Live Stream Ready</span>
          </div>
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="lg:col-span-3 space-y-4">
        {/* Context Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
          <h3 className="text-[11px] font-bold tracking-widest text-white/40 uppercase">Intelligence Analyzer</h3>
          <div className="space-y-3">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <p className="text-[9px] text-white/50 mb-1 font-bold uppercase tracking-widest">Target Tone</p>
              <select 
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold outline-none focus:text-cyan-400 transition-colors appearance-none"
              >
                <option value="neutral">Global Neutral</option>
                <option value="formal">Enterprise Formal</option>
                <option value="casual">Organic Casual</option>
                <option value="emotional">Expressive Emotion</option>
              </select>
            </div>
            {details.tone && (
              <div className="p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
                <p className="text-[9px] text-white/50 mb-1 font-bold uppercase tracking-widest">Detected Sentiment</p>
                <p className="text-xs font-semibold text-cyan-400 capitalize">{details.tone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic History */}
        <div className="flex-1 min-h-[300px]">
          <HistoryPanel />
        </div>

        {/* PWA Badge */}
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 flex items-center gap-3 group hover:bg-cyan-500/15 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white uppercase tracking-wider">OFFLINE ARCHIVE</p>
            <p className="text-[9px] text-white/50 font-medium">Auto-sync Layer Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
