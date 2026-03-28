import { motion } from 'framer-motion';
import { X, Check, ArrowLeft } from 'lucide-react';
import { useApp } from '../App';
import { t } from '../data/i18n';

export const Confirmation = ({ direction }) => {
  const { navTo } = useApp();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-full bg-obsidian absolute inset-0 z-20 px-6 overflow-y-auto pb-12"
    >
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-accent/10 to-transparent pointer-events-none"></div>
      <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-accent/20 blur-[80px] rounded-full pointer-events-none"></div>

      <header className="flex justify-between items-center py-6 mt-4 relative z-20">
        <button onClick={() => navTo('dashboard')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex justify-center items-center active:scale-95 transition-all">
          <X size={20} className="text-white" />
        </button>
        <h1 className="text-sm font-semibold tracking-widest text-white">Fluid</h1>
        <div className="w-10 h-10"></div>
      </header>

      <div className="flex flex-col items-center mt-12 mb-10 relative z-20">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-6 relative"
        >
          <div className="absolute inset-0 border border-accent/40 rounded-full animate-ping opacity-30" style={{ animationDuration: '2s' }}></div>
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-[0_0_40px_rgba(0,255,170,0.6)]">
            <Check size={36} strokeWidth={3.5} className="text-obsidian" />
          </div>
        </motion.div>
        
        <motion.h2 initial={{y:10, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.4}} className="text-2xl font-medium text-white mb-4">{t('conf_title')}</motion.h2>
      </div>

      <motion.button 
        initial={{y:20, opacity:0}} 
        animate={{y:0, opacity:1}} 
        transition={{delay:0.6}}
        onClick={() => navTo('dashboard')} 
        className="glass-panel w-full py-4 text-center text-sm font-medium text-white/80 hover:bg-white/5 transition-all relative z-20 active:scale-95"
      >
        {t('conf_back')}
      </motion.button>
    </motion.div>
  );
};
