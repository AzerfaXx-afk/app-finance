import { Home, PieChart, Plus, Wallet, User } from 'lucide-react';
import { motion } from 'framer-motion';

export const NavBar = ({ current, navTo }) => {
  const navItems = [
    { id: 'dashboard', icon: Home, color: '#FFFFFF', activeColor: '#FFFFFF', glow: 'rgba(255,255,255,0.4)' },
    { id: 'analytics', icon: PieChart, color: '#9CA3AF', activeColor: 'var(--color-accent)', glow: 'color-mix(in srgb, var(--color-accent) 60%, transparent)' },
    { id: 'center', placeholder: true },
    { id: 'budget', icon: Wallet, color: '#9CA3AF', activeColor: '#F97316', glow: 'rgba(249,115,22,0.6)' },
    { id: 'profile', icon: User, color: '#9CA3AF', activeColor: '#FFFFFF', glow: 'rgba(255,255,255,0.4)' }
  ];

  return (
    <div className="absolute bottom-0 w-full px-4 pb-4 z-50 flex justify-center pointer-events-none">
      <div className="relative w-full max-w-[360px] pointer-events-auto">
        
        <div className="relative h-[72px] rounded-[2.5rem] bg-obsidian/40 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] flex justify-between items-center px-6 overflow-visible">
          
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-orange-500/10 rounded-[3rem] blur-2xl -z-10"></div>

          {navItems.map((item) => {
            if (item.placeholder) {
              return <div key="placeholder" className="w-12" />;
            }

            const isActive = current === item.id;
            const Icon = item.icon;

            return (
              <button 
                key={item.id}
                onClick={() => navTo(item.id)}
                className="relative group flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-white/5 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className="relative z-10 transition-all duration-300"
                  style={{
                    color: isActive ? item.activeColor : item.color,
                    filter: isActive ? `drop-shadow(0 0 8px ${item.glow})` : 'none'
                  }}
                />
                
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -bottom-1.5 w-1 h-1 rounded-full"
                    style={{ backgroundColor: item.activeColor, boxShadow: `0 0 10px 2px ${item.glow}` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="absolute left-1/2 -top-6 -translate-x-1/2 flex flex-col items-center">
          <button 
            onClick={() => navTo('scanner')} 
            className="group relative w-[68px] h-[68px] rounded-full flex justify-center items-center active:scale-95 transition-all duration-300 pointer-events-auto"
          >
            <div className="absolute inset-0 bg-[#0A0A0C] rounded-full"></div>
            <div className="absolute inset-1 bg-gradient-to-tr from-[var(--color-accent)]/60 via-[#8B5CF6]/60 to-[#F97316]/50 rounded-full blur-[20px] opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/20 backdrop-blur-3xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] flex justify-center items-center z-10">
               <Plus size={30} className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
            </div>
          </button>
        </div>
        
      </div>
    </div>
  );
};
