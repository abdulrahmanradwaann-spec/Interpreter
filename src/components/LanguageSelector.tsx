import { Language, SUPPORTED_LANGUAGES } from "../types";
import { cn } from "../lib/utils";
import { ChevronDown, Globe, Languages } from "lucide-react";
import { useState } from "react";

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  allowAuto?: boolean;
}

export function LanguageSelector({ value, onChange, label, allowAuto = false }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = SUPPORTED_LANGUAGES.find(l => l.code === value) || (value === 'auto' ? { name: 'Auto Detect' } : null);

  return (
    <div className="relative">
      {label && <span className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">{label}</span>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors w-full justify-between"
      >
        <div className="flex items-center gap-2">
          {value === 'auto' ? (
            <Globe className="w-4 h-4 text-cyan-400" />
          ) : (
            <Languages className="w-4 h-4 text-cyan-400" />
          )}
          <span className="font-medium text-sm">{selected?.name}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 py-2 glass-panel rounded-2xl z-50 max-h-64 overflow-y-auto">
          {allowAuto && (
            <button
              onClick={() => { onChange('auto'); setIsOpen(false); }}
              className="flex items-center gap-3 px-4 py-2 w-full hover:bg-white/10 transition-colors text-sm"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Auto Detect</span>
            </button>
          )}
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { onChange(lang.code); setIsOpen(false); }}
              className={cn(
                "flex items-center gap-3 px-4 py-2 w-full hover:bg-white/10 transition-colors text-sm",
                value === lang.code && "bg-white/10 text-neon-blue"
              )}
            >
              <Languages className="w-4 h-4 text-cyan-400" />
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
