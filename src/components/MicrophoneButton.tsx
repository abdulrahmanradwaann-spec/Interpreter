import { Mic, Square } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface MicrophoneButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function MicrophoneButton({ isRecording, onToggle, disabled }: MicrophoneButtonProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
        isRecording 
          ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]" 
          : "bg-neon-blue/20 border border-neon-blue/30 hover:bg-neon-blue/30 shadow-[0_0_20px_rgba(0,242,255,0.1)]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <AnimatePresence mode="wait">
        {isRecording ? (
          <motion.div
            key="stop"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Square className="w-6 h-6 fill-white text-white" />
          </motion.div>
        ) : (
          <motion.div
            key="mic"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Mic className="w-6 h-6 text-neon-blue" />
          </motion.div>
        )}
      </AnimatePresence>

      {isRecording && (
        <>
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full bg-red-500"
          />
          <div className="absolute -bottom-8 flex gap-1 h-4 items-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                animate={{ height: [4, Math.random() * 12 + 4, 4] }}
                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                className="w-1 bg-red-400 rounded-full"
              />
            ))}
          </div>
        </>
      )}
    </button>
  );
}
