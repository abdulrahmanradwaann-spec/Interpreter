'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageIcon, Upload, X, Loader2, Sparkles, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Tesseract from 'tesseract.js';
import { jsPDF } from 'jspdf';

export default function ImageTranslation() {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImage(result);
        processImage(result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const processImage = async (imgData: string) => {
    setIsProcessing(true);
    setProgress(0);
    try {
      const result = await Tesseract.recognize(imgData, 'ara+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });
      setOcrText(result.data.text);
    } catch (error) {
      console.error("OCR failed", error);
      setOcrText("فشل في استخراج النص من الصورة.");
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToPDF = () => {
    if (!ocrText) return;
    const doc = new jsPDF();
    doc.setFont("helvetica");
    const splitText = doc.splitTextToSize(ocrText, 180);
    doc.text(splitText, 10, 10);
    doc.save('translated-text.pdf');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  return (
    <div className="h-full flex flex-col gap-4">
      {!image ? (
        <div 
          {...getRootProps()} 
          className={`flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
        >
          <input {...getInputProps()} />
          <div className="p-6 rounded-full bg-white/5 mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-10 h-10 text-primary/50" />
          </div>
          <p className="text-lg font-medium">اسحب الصورة هنا أو اضغط للاختيار</p>
          <p className="text-sm text-white/40 mt-2">يدعم PNG, JPG, WebP</p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original Image with Scanning Animation */}
          <div className="relative rounded-3xl overflow-hidden glass-morphism border border-white/10">
            <img src={image} alt="Original" className="w-full h-full object-contain" />
            <AnimatePresence>
              {isProcessing && (
                <motion.div 
                  initial={{ top: 0 }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-neon z-10"
                />
              )}
            </AnimatePresence>
            <button 
              onClick={() => setImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
            >
              <X size={18} />
            </button>
            <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold text-white/70 flex items-center gap-2">
              <ScanLine size={12} />
              <span>معاينة الأصل</span>
            </div>
          </div>

          {/* Result Side */}
          <div className="glass-morphism rounded-3xl p-6 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <Sparkles size={18} />
                الترجمة المرئية
              </h3>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                      {progress}%
                    </div>
                  </div>
                  <p className="text-white/50 animate-pulse text-center">
                    جاري تحليل النصوص والتنسيق...
                    <br />
                    <span className="text-xs text-primary/40">قد يستغرق ذلك بضع ثوانٍ</span>
                  </p>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex-1 overflow-auto">
                    <p className="text-lg leading-relaxed">{ocrText}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => {
                        if (ocrText) {
                          navigator.clipboard.writeText(ocrText);
                        }
                      }}
                      className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                    >
                      نسخ النص
                    </button>
                    <button 
                      onClick={exportToPDF}
                      className="flex-1 py-3 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 transition-all"
                    >
                      تصدير كـ PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
