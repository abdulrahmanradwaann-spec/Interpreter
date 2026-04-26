'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Volume2, Globe, Cpu, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceTranslation() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [waveforms, setWaveforms] = useState<number[]>(Array(40).fill(20));
  const recognitionRef = useRef<any>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (typeof window !== 'undefined' && ('WebkitSpeechRecognition' in window || 'speechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).WebkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ar-SA';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onend = () => {
         setIsRecording(false);
       };
     }
   }, []);

  // Waveform animation
  useEffect(() => {
    if (isRecording) {
      const updateWaveform = () => {
        setWaveforms(prev => prev.map(() => Math.random() * 60 + 10));
        animationRef.current = requestAnimationFrame(updateWaveform);
      };
      animationRef.current = requestAnimationFrame(updateWaveform);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setWaveforms(Array(40).fill(10));
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      // Simulate translation
      setTimeout(() => {
        setTranslation("This is a live translation of your speech.");
      }, 500);
    } else {
      setTranscript('');
      setTranslation('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-2">
      {/* Waveform Visualization */}
      <div className="flex-1 flex flex-col items-center justify-center glass-morphism rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
        
        <div className="flex items-end justify-center gap-1 h-32 w-full mb-8">
          {waveforms.map((height, i) => (
            <motion.div
              key={i}
              initial={{ height: 10 }}
              animate={{ height }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`w-1 rounded-full ${isRecording ? 'bg-primary shadow-neon' : 'bg-white/10'}`}
            />
          ))}
        </div>

        <button 
          onClick={toggleRecording}
          className={`relative group p-8 rounded-full transition-all duration-500 ${
            isRecording 
            ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
            : 'bg-neon-gradient shadow-neon hover:scale-105'
          }`}
        >
          {isRecording ? (
            <Square className="w-10 h-10 text-white fill-white" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-red-500 -z-10"
              />
            )}
          </AnimatePresence>
        </button>
        
        <p className={`mt-6 font-medium ${isRecording ? 'text-red-400 animate-pulse' : 'text-white/40'}`}>
          {isRecording ? 'جاري الاستماع... تحدّث الآن' : 'اضغط للبدء في التحدث'}
        </p>
      </div>

      {/* Live Subtitles / Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-morphism rounded-2xl p-4 min-h-[100px] flex flex-col">
          <span className="text-[10px] text-primary uppercase font-bold mb-2">النص الأصلي</span>
          <p className="text-lg">{transcript || (isRecording ? '...' : '')}</p>
        </div>
        <div className="glass-morphism rounded-2xl p-4 min-h-[100px] flex flex-col bg-white/5 border-secondary/20">
          <span className="text-[10px] text-secondary uppercase font-bold mb-2">الترجمة الفورية</span>
          <p className="text-lg text-secondary-light">{translation || (isRecording ? '...' : '')}</p>
          {translation && (
            <button className="self-end mt-auto p-2 rounded-lg hover:bg-white/5 text-white/40">
              <Volume2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
