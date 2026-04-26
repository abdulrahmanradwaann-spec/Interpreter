'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Languages, 
  Mic, 
  Image as ImageIcon, 
  Settings, 
  History, 
  Bookmark,
  Share2,
  Copy,
  Volume2,
  Maximize2,
  Cpu,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiCore } from '@/lib/ai-core';
import ImageTranslation from '@/components/ImageTranslation';
import VoiceTranslation from '@/components/VoiceTranslation';
import Sidebar from '@/components/Sidebar';
import { offlineStorage } from '@/lib/offline-storage';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'voice'>('text');
  const [isOffline, setIsOffline] = useState(false);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedDialect, setDetectedDialect] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: 'input' | 'output') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopySuccess(type);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Handle translation
  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const result = await aiCore.translate(inputText, sourceLang, targetLang);
      setTranslatedText(result.text);
      
      if (result.detectedLanguage) {
        const detection = await aiCore.detectLanguage(inputText);
        setDetectedDialect(detection.dialect || null);
      }

      // Save to history
      await offlineStorage.saveHistory({
        id: Date.now().toString(),
        original: inputText,
        translated: result.text,
        from: sourceLang,
        to: targetLang,
        timestamp: Date.now(),
        type: 'text'
      });
    } catch (error) {
      console.error("Translation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Init local models
    aiCore.initLocalModels();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen text-white p-4 md:p-8 flex flex-col items-center justify-center font-sans overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="w-full max-w-6xl mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-neon-gradient shadow-neon animate-pulse-neon">
            <Languages className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-secondary">
              ترجمة AI
            </h1>
            <p className="text-xs text-primary/70 tracking-widest uppercase">Next-Gen Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
            isOffline ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"
          )}>
            {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
            {isOffline ? "أوفلاين" : "أونلاين"}
          </div>
          <button className="p-2 rounded-full glass-morphism hover:bg-white/10 transition-all">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        
        {/* Navigation Sidebar */}
        <nav className="lg:col-span-1 flex lg:flex-col flex-row justify-center items-center gap-4 py-4 lg:py-0">
          <NavButton 
            active={activeTab === 'text'} 
            onClick={() => setActiveTab('text')} 
            icon={<Languages size={24} />} 
            label="نص" 
          />
          <NavButton 
            active={activeTab === 'image'} 
            onClick={() => setActiveTab('image')} 
            icon={<ImageIcon size={24} />} 
            label="صور" 
          />
          <NavButton 
            active={activeTab === 'voice'} 
            onClick={() => setActiveTab('voice')} 
            icon={<Mic size={24} />} 
            label="صوت" 
          />
          <div className="w-full h-px lg:h-8 lg:w-px bg-white/10 my-2" />
          <NavButton 
            onClick={() => setIsSidebarOpen(true)} 
            icon={<History size={24} />} 
            label="سجل" 
          />
          <NavButton icon={<Bookmark size={24} />} label="محفوظات" />
        </nav>

        {/* Sidebar Component */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Translation Area */}
        <div className="lg:col-span-11 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {activeTab === 'text' && (
              <motion.div 
                key="text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-[400px]"
              >
                {/* Input Side */}
                <div className="glass-morphism rounded-3xl p-6 flex flex-col relative group transition-all duration-500 hover:border-primary/30">
                  <div className="flex justify-between items-center mb-4">
                    <select 
                      className="bg-transparent border-none text-primary font-medium focus:ring-0 cursor-pointer"
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                    >
                      <option value="auto">كشف اللغة تلقائياً</option>
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                    <div className="flex gap-2 items-center">
                      {detectedDialect && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                          لهجة: {detectedDialect}
                        </span>
                      )}
                      <button 
                        onClick={() => copyToClipboard(inputText, 'input')}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          copySuccess === 'input' ? "bg-green-500/20 text-green-400" : "hover:bg-white/5 text-white/50 hover:text-white"
                        )}
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <textarea 
                    className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-xl placeholder:text-white/20"
                    placeholder="أدخل النص هنا..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    dir={sourceLang === 'ar' || sourceLang === 'auto' ? 'rtl' : 'ltr'}
                  />

                  <div className="mt-4 flex justify-between items-center text-white/40 text-xs">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-yellow-400" />
                      <span>معالجة ذكية مفعلة</span>
                    </div>
                    <span>{inputText.length} حرف</span>
                  </div>
                </div>

                {/* Output Side */}
                <div className="glass-morphism rounded-3xl p-6 flex flex-col relative bg-gradient-to-br from-white/5 to-primary/5 border-primary/20">
                  <div className="flex justify-between items-center mb-4">
                    <select 
                      className="bg-transparent border-none text-secondary font-medium focus:ring-0 cursor-pointer"
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                      <option value="fr">French</option>
                    </select>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => copyToClipboard(translatedText, 'output')}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          copySuccess === 'output' ? "bg-green-500/20 text-green-400" : "hover:bg-white/5 text-white/50 hover:text-white"
                        )}
                      >
                        <Copy size={18} />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-all">
                        <Volume2 size={18} />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-all">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className={cn(
                    "flex-1 text-xl",
                    !translatedText && "text-white/20 italic"
                  )}>
                    {translatedText || "الترجمة ستظهر هنا..."}
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-[10px] font-bold tracking-widest uppercase">
                      <Cpu size={12} />
                      <span>NMT Core v4.0</span>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-all">
                      <Maximize2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'image' && (
              <motion.div 
                key="image"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full min-h-[400px]"
              >
                <ImageTranslation />
              </motion.div>
            )}

            {activeTab === 'voice' && (
              <motion.div 
                key="voice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full min-h-[400px]"
              >
                <VoiceTranslation />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Footer */}
          {activeTab === 'text' && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-morphism rounded-2xl">
            <div className="flex gap-2">
              <button 
                onClick={handleTranslate}
                disabled={isLoading}
                className={cn(
                  "px-6 py-3 rounded-xl bg-neon-gradient text-white font-bold shadow-neon hover:scale-105 transition-all duration-300 flex items-center gap-2",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <span>{isLoading ? 'جاري المعالجة...' : 'ترجمة فورية'}</span>
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap size={18} />
                )}
              </button>
              <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all duration-300">
                تحسين بواسطة AI
              </button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-white/40 uppercase tracking-tighter">المطور</span>
                <span className="text-sm font-semibold text-primary">عبدالرحمن رضوان</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active?: boolean, icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-500 group",
        active ? "bg-primary/20 text-primary shadow-neon border border-primary/30" : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
