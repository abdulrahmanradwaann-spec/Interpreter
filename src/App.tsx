import { TranslationDashboard } from './components/TranslationDashboard';
import { motion } from 'motion/react';
import { Languages } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#020408]">
      {/* Dynamic Background Blobs */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[150px]" />
        
        {/* Grainy Noise Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay pointer-events-none" />
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-20 h-16 flex items-center justify-between px-8 border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Languages className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tighter text-xl uppercase">Interpreter <span className="text-cyan-400">AI</span></span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex bg-black/40 p-1 rounded-full border border-white/5">
            <button className="px-4 py-1 text-[10px] font-bold rounded-full bg-white/10 text-white tracking-widest uppercase">Translate</button>
            <button className="px-4 py-1 text-[10px] font-bold text-white/40 hover:text-white tracking-widest uppercase transition-colors">Vision</button>
            <button className="px-4 py-1 text-[10px] font-bold text-white/40 hover:text-white tracking-widest uppercase transition-colors">History</button>
          </div>
          <div className="h-4 w-px bg-white/20 hidden md:block"></div>
          <span className="text-[9px] text-white/50 tracking-widest uppercase hidden lg:block">System Status: Optimal</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <TranslationDashboard />
        </motion.div>
      </main>

      {/* Footer Meta */}
      <footer className="relative z-10 h-12 bg-black/40 border-t border-white/5 flex items-center justify-between px-8 text-[9px] text-white/30 tracking-[0.2em] uppercase">
        <div className="flex items-center gap-6">
          <span>Latency: 14ms</span>
          <span className="hidden sm:inline">Accuracy: 99.8%</span>
          <span className="hidden sm:inline text-cyan-500/60 font-bold">Secure Neural Link</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline">© 2026 Abdulrahman Radwan</span>
          <span className="text-cyan-500 font-bold">LTS VERSION 2.0</span>
        </div>
      </footer>
    </div>
  );
}

