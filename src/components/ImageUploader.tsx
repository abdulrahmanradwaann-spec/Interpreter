import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, X, UploadCloud, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  isProcessing: boolean;
}

export function ImageUploader({ onImageSelect, isProcessing }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setPreview(URL.createObjectURL(file));
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] } as any,
    multiple: false
  } as any);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden aspect-video bg-white/5 border border-white/10 group"
          >
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button
                onClick={() => setPreview(null)}
                className="p-3 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/40 transition-colors"
                title="Remove image"
              >
                <X className="w-6 h-6" />
              </button>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <button
                  className="p-3 rounded-full bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/40 transition-colors"
                  title="Replace image"
                >
                  <RefreshCw className="w-6 h-6" />
                </button>
              </div>
            </div>

            {isProcessing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <RefreshCw className="w-10 h-10 text-neon-blue" />
                </motion.div>
                <span className="text-sm font-medium neon-text-blue uppercase tracking-widest">Analyzing Layout...</span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            {...getRootProps()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "border-2 border-dashed rounded-3xl p-12 transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer",
              isDragActive ? "border-neon-blue bg-neon-blue/5" : "border-white/10 hover:border-white/20 hover:bg-white/5"
            )}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <UploadCloud className={cn("w-8 h-8 transition-colors", isDragActive ? "text-neon-blue" : "text-white/40")} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium mb-1">Drag & Drop Image</h3>
              <p className="text-sm text-white/40">Support for full layout preservation & OCR replacement</p>
            </div>
            <div className="px-6 py-2 rounded-full border border-white/10 text-xs text-white/60">
              Browse Files
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
