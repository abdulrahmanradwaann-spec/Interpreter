'use client';

import React, { useState, useEffect } from 'react';
import { History, Bookmark, X, Trash2, Clock, Share2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { offlineStorage, HistoryItem } from '@/lib/offline-storage';
import { cn } from '@/lib/utils';

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    const data = await offlineStorage.getHistory();
    setHistory(data);
  };

  const clearAll = async () => {
    if (confirm('هل أنت متأكد من مسح جميع السجلات؟')) {
      await offlineStorage.clearHistory();
      setHistory([]);
    }
  };

  const copyItem = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background/95 border-l border-white/10 glass-morphism z-50 p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <History className="text-primary" />
                <h2 className="text-xl font-bold">سجل الترجمة</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
                <X />
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-4 pr-2">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-white/20">
                  <Clock size={40} className="mb-2" />
                  <p>لا يوجد سجل حتى الآن</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all group relative">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2 items-center">
                        <span className={cn(
                          "text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-widest",
                          item.type === 'text' ? "bg-blue-500/20 text-blue-400" :
                          item.type === 'image' ? "bg-purple-500/20 text-purple-400" :
                          "bg-green-500/20 text-green-400"
                        )}>
                          {item.type}
                        </span>
                        <span className="text-[10px] text-white/20">{new Date(item.timestamp).toLocaleTimeString('ar-EG')}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyItem(item.translated)} className="p-1.5 hover:bg-white/10 rounded-md text-white/40 hover:text-white">
                          <Copy size={14} />
                        </button>
                        <button className="p-1.5 hover:bg-white/10 rounded-md text-white/40 hover:text-white">
                          <Share2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-1 line-clamp-2" dir="auto">{item.original}</p>
                    <p className="text-sm text-primary line-clamp-2" dir="auto">{item.translated}</p>
                  </div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <button 
                onClick={clearAll}
                className="mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
              >
                <Trash2 size={18} />
                <span>مسح الكل</span>
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
