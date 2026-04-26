import { useState, useEffect } from "react";
import { db } from "../services/db";
import { TranslationHistory } from "../types";
import { GlassPanel } from "./GlassPanel";
import { Clock, Trash2, ExternalLink, Type, Mic, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function HistoryPanel() {
  const [history, setHistory] = useState<TranslationHistory[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await db.translations.orderBy('timestamp').reverse().toArray();
    setHistory(data);
  };

  const deleteItem = async (id?: number) => {
    if (!id) return;
    await db.translations.delete(id);
    loadHistory();
  };

  const clearAll = async () => {
    await db.translations.clear();
    loadHistory();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'speech': return <Mic className="w-3 h-3 text-cyan-400" />;
      case 'image': return <ImageIcon className="w-3 h-3 text-cyan-400" />;
      default: return <Type className="w-3 h-3 text-cyan-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold tracking-widest text-white/40 uppercase">History Hub</h3>
        {history.length > 0 && (
          <button onClick={clearAll} className="text-[10px] text-cyan-400 hover:underline cursor-pointer uppercase font-bold tracking-widest">
            Flush All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
        <AnimatePresence initial={false}>
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 gap-3 py-12">
              <Clock className="w-8 h-8" />
              <p className="text-[10px] uppercase tracking-widest font-bold">No Neural Records</p>
            </div>
          ) : (
            history.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="group relative p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-white/5">
                      {getTypeIcon(item.type)}
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">
                      {item.sourceLang} → {item.targetLang}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500/60 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                
                <p className="text-[11px] text-white/80 line-clamp-1 font-medium">{item.sourceText}</p>
                <p className="text-[10px] text-white/30 mt-1">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
