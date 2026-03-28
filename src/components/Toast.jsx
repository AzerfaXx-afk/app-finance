import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, Info } from 'lucide-react';

export const Toast = ({ message, type = 'info', onDismiss }) => {
  const Icon = type === 'success' ? CheckCircle : type === 'notification' ? Bell : Info;
  const color = type === 'success' ? 'text-accent' : type === 'notification' ? 'text-purple-400' : 'text-blue-400';
  const bgColor = type === 'success' ? 'bg-accent/10' : type === 'notification' ? 'bg-purple-500/10' : 'bg-blue-500/10';

  return (
    <div className="absolute top-4 left-0 right-0 flex justify-center z-[300] pointer-events-none px-4">
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="w-full max-w-[320px] pointer-events-auto cursor-pointer"
        onClick={onDismiss}
      >
        <div className="glass-panel bg-[#111111]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-start gap-4 mx-auto">
          <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center shrink-0 shadow-inner`}>
            <Icon size={20} className={color} />
          </div>
          <div className="flex-1 pt-0.5">
            <h4 className="text-sm font-semibold text-white mb-1">Fluid App</h4>
            <p className="text-xs text-white/70 leading-relaxed">{message}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
