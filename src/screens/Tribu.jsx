import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Link, QrCode, PlusCircle, MessageCircle, User } from 'lucide-react';

const pageVariants = {
  initial: (dir) => ({ x: dir > 0 ? '50%' : '-50%', opacity: 0 }),
  animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: (dir) => ({ x: dir > 0 ? '-50%' : '50%', opacity: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } })
};

export const Tribu = ({ navTo, direction }) => (
  <motion.div 
    custom={direction}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col h-full p-6 absolute inset-0 z-10 overflow-hidden pb-20"
  >
    <header className="flex justify-between items-center mb-6 mt-4 shrink-0">
      <button onClick={() => navTo('dashboard')} className="w-10 h-10 rounded-full glass-panel flex justify-center items-center bg-white/5 active:scale-95 transition-all hover:bg-white/10">
        <ArrowLeft size={20} className="text-white" />
      </button>
      <h1 className="text-[11px] font-semibold tracking-[0.2em] text-white">MA TRIBU</h1>
      <button className="w-10 h-10 rounded-full glass-panel flex justify-center items-center bg-white/5 relative">
        <Bell size={18} className="text-gray-300" />
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent"></div>
      </button>
    </header>

    <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col pb-4">
      <div className="flex flex-col gap-3 mb-8">
      <h3 className="text-[10px] font-semibold tracking-[0.2em] text-gray-500 ml-2 mb-1">PARTAGER MON PROFIL</h3>
      <div className="flex gap-4">
        <button className="flex-1 glass-panel p-4 flex flex-col items-center justify-center gap-3 bg-white/[0.02] active:bg-white/5 transition-all">
          <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00] border border-[#FF6B00]/20">
            <Link size={18} />
          </div>
          <span className="text-[11px] font-medium text-gray-300">Lien de partage</span>
        </button>
        <button className="flex-1 glass-panel p-4 flex flex-col items-center justify-center gap-3 bg-white/[0.02] active:bg-white/5 transition-all">
          <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00] border border-[#FF6B00]/20">
            <QrCode size={18} />
          </div>
          <span className="text-[11px] font-medium text-gray-300">Code QR</span>
        </button>
      </div>
    </div>

    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-[10px] font-semibold tracking-[0.2em] text-gray-500 ml-2">MES CERCLES</h3>
        <button className="text-gray-400 hover:text-white transition-colors">
          <PlusCircle size={16} />
        </button>
      </div>
      
      <div className="glass-panel p-1.5 flex mb-4 bg-white/5 border-white/10 rounded-full">
        <button className="flex-1 py-1.5 rounded-full bg-[#FF6B00] text-obsidian text-xs font-semibold shadow-md">Amis</button>
        <button className="flex-1 py-1.5 rounded-full text-gray-400 text-xs font-medium hover:text-white transition-colors">Famille</button>
      </div>

      {[
        { name: 'Léa', status: 'Amie • Lyon, FR', health: 'w-[75%] bg-accent', dot: 'bg-accent' },
        { name: 'Marc', status: 'Frère • Paris, FR', health: 'w-[40%] bg-[#FF6B00]', dot: 'bg-gray-500' },
        { name: 'Julien', status: 'Ami • Bordeaux, FR', health: 'w-[90%] bg-accent', dot: 'bg-transparent border-2 border-gray-600' }
      ].map((user, i) => (
        <div key={i} className="glass-panel p-4 flex items-center justify-between bg-white/[0.02] mb-3">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                <User size={20} className="text-gray-400" />
              </div>
              <div className={`absolute bottom-0 right-[-2px] w-3.5 h-3.5 rounded-full border-[2.5px] border-obsidian ${user.dot}`}></div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">{user.name}</h4>
              <p className="text-[10px] font-medium text-gray-500 mt-0.5">{user.status}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[8px] tracking-widest text-gray-500 uppercase">Santé Fi</span>
                <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full ${user.health} rounded-full`}></div>
                </div>
              </div>
            </div>
          </div>
          <button className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00] border border-[#FF6B00]/20 active:scale-90 transition-all">
            <MessageCircle size={18} fill="currentColor" className="opacity-90" />
          </button>
        </div>
      ))}
      </div>
    </div>
  </motion.div>
);
