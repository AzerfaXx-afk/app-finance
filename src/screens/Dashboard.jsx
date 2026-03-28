import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { User as UserIcon, ArrowRight, Download, Tv, ShoppingCart, Coffee, ArrowDownLeft, MonitorSmartphone, Plus, Car, Gamepad2, Home, Heart, ShoppingBag, Music, Cloud, MoreHorizontal, Repeat, X, Trash2, Banknote } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useApp } from '../App';
import { getAccounts, getTransactions, addAccount, deleteAccount, deleteTransaction } from '../data/store';
import { t } from '../data/i18n';

const AnimatedNumber = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(2));
  useEffect(() => {
    const controls = animate(count, value, { duration: 2.5, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [count, value]);
  return <motion.span>{rounded}</motion.span>;
};

const pageVariants = {
  initial: (dir) => ({ x: dir > 0 ? '50%' : '-50%', opacity: 0 }),
  animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: (dir) => ({ x: dir > 0 ? '-50%' : '50%', opacity: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } })
};

const iconMap = { Tv, ShoppingCart, Coffee, ArrowDownLeft, MonitorSmartphone, Car, Gamepad2, Home, Heart, ShoppingBag, Music, Cloud, MoreHorizontal, Repeat, Default: ArrowDownLeft };

function getRelativeDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today - txDate) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t('dash_today');
  if (diffDays === 1) return t('dash_yesterday');
  return t('dash_days_ago', { n: diffDays });
}

export const Dashboard = ({ direction, deferredPrompt }) => {
  const { navTo, showToast, refreshData, refreshKey, swUpdate, applyUpdate } = useApp();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filterAccountId, setFilterAccountId] = useState(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newBank, setNewBank] = useState({ name: '', type: 'Compte Courant', balance: '' });
  const [isStandalone, setIsStandalone] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(() => sessionStorage.getItem('install_dismissed') === '1');

  // Pull to refresh state
  const scrollRef = useRef(null);
  const startY = useRef(0);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setAccounts(getAccounts());
    setTransactions(getTransactions());
  }, [refreshKey]);

  const handleTouchStart = (e) => {
    if (scrollRef.current && scrollRef.current.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (isRefreshing || startY.current === 0) return;
    if (scrollRef.current && scrollRef.current.scrollTop > 0) return;
    const y = e.touches[0].clientY;
    const diff = y - startY.current;
    if (diff > 0) {
      setPullY(Math.min(diff * 0.4, 80));
    }
  };

  const handleTouchEnd = () => {
    if (pullY > 60 && !isRefreshing) {
      setIsRefreshing(true);
      refreshData();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullY(0);
      }, 1200);
    } else {
      setPullY(0);
    }
    startY.current = 0;
  };

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
  };

  const handleAddBank = () => {
    if (!newBank.name.trim()) return;
    addAccount({ name: newBank.name.trim(), type: newBank.type, balance: parseFloat(newBank.balance) || 0 });
    setNewBank({ name: '', type: 'Compte Courant', balance: '' });
    setShowAddAccount(false);
    setAccounts(getAccounts());
    setTransactions(getTransactions());
    refreshData();
    showToast(t('toast_account_added'), 'success');
  };

  const handleDeleteAccount = (id, e) => {
    e.stopPropagation();
    deleteAccount(id);
    setAccounts(getAccounts());
    setTransactions(getTransactions());
    if (filterAccountId === id) setFilterAccountId(null);
    refreshData();
    showToast(t('toast_account_deleted'), 'info');
  };

  const handleDeleteTransaction = (id) => {
    deleteTransaction(id);
    setAccounts(getAccounts());
    setTransactions(getTransactions());
    refreshData();
    showToast(t('toast_tx_deleted'), 'info');
  };

  const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);
  
  const filteredTransactions = filterAccountId
    ? transactions.filter(tx => tx.accountId === filterAccountId)
    : transactions;

  const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const isEmpty = accounts.length === 0;

  return (
  <motion.div 
    custom={direction}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="flex flex-col h-full absolute inset-0 z-10 overflow-hidden"
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
  >
    {/* Pull to refresh indicator */}
    <div 
      className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none z-50 overflow-visible"
      style={{ height: pullY > 0 || isRefreshing ? 60 : 0, opacity: pullY / 60 }}
    >
       <motion.div 
         animate={{ rotate: isRefreshing ? 360 : pullY * 2 }}
         transition={{ repeat: isRefreshing ? Infinity : 0, ease: "linear", duration: 1 }}
         className="w-8 h-8 rounded-[12px] bg-obsidian overflow-hidden p-[1px] bg-gradient-to-tr from-[var(--color-accent)] via-[#8B5CF6] to-[#F97316] shadow-[0_0_15px_var(--color-accent)] mt-8"
       >
         <img src="/fluid-icon.png" alt="Refreshing" className="w-full h-full object-cover rounded-[11px]" />
       </motion.div>
    </div>

    {/* ═══ FIXED HEADER ZONE ═══ */}
    <motion.div 
      className="flex-shrink-0 px-6 pt-6 relative"
      animate={{ y: isRefreshing ? 20 : pullY * 0.5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Header */}
      <header className="flex justify-between items-center mb-5 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[12px] shadow-[0_0_15px_color-mix(in srgb, var(--color-accent) 30%, transparent)] bg-obsidian overflow-hidden border-none shrink-0 bg-gradient-to-tr from-[var(--color-accent)] via-[#8B5CF6] to-[#F97316] p-[1px]">
             <img src="/fluid-icon.png" alt="Fluid Logo" className="w-full h-full object-cover rounded-[11px]" />
          </div>
          <h1 className="text-sm font-semibold tracking-[0.3em] text-white">FLUID</h1>
        </div>
        <button onClick={() => navTo('profile')} className="w-10 h-10 rounded-full glass-panel flex justify-center items-center bg-white/5 relative hover:bg-white/10 transition-colors">
          <UserIcon size={18} className="text-white/80" />
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent shadow-[0_0_5px_color-mix(in srgb, var(--color-accent) 80%, transparent)]"></div>
        </button>
      </header>

      {/* Balance */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center mb-5 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-accent)]/5 via-[#8B5CF6]/5 to-transparent blur-[60px] rounded-full w-64 h-64 mx-auto top-[-40px] z-0 pointer-events-none"></div>
        
        <div className="glass-panel px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 mb-3 flex items-center gap-2 relative z-10">
           <span className="w-2 h-2 rounded-full bg-white/20"></span>
           <span className="text-[10px] font-medium tracking-[0.2em] text-white/60 uppercase">{t('dash_cumulated')}</span>
        </div>
        
        <h2 className="text-[3rem] font-light relative z-10 bg-gradient-to-b from-white via-white to-white/40 text-transparent bg-clip-text drop-shadow-2xl flex items-start mb-1 leading-none tracking-tight">
          <span className="text-2xl mt-1.5 mr-1 text-white/40">€</span>
          <AnimatedNumber value={totalBalance} />
        </h2>
        <p className="text-[10px] text-white/40 font-medium tracking-wide relative z-10 uppercase mt-1">
          {isEmpty ? t('dash_no_accounts') : t('dash_all_accounts')}
        </p>
      </motion.div>

      {/* Bank accounts */}
      <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4"
      >
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">{t('dash_your_banks')}</h3>
          <button onClick={() => setShowAddAccount(true)} className="text-[10px] font-medium text-accent uppercase tracking-widest hover:brightness-125 transition-all outline-none flex items-center gap-1">
            <Plus size={12} /> {t('dash_add_bank')}
          </button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2 snap-x">
          {isEmpty && (
            <button onClick={() => setShowAddAccount(true)} className="flex flex-col justify-center items-center flex-shrink-0 w-36 h-36 p-4 rounded-3xl border-2 border-dashed border-white/10 text-white/30 hover:border-accent/30 hover:text-accent/50 transition-all snap-center">
              <Banknote size={28} className="mb-2" />
              <span className="text-[10px] font-medium text-center">{t('dash_no_accounts')}</span>
            </button>
          )}
          {accounts.map((account) => (
            <motion.div 
              whileTap={{ scale: 0.95 }}
              key={account.id} 
              className={`flex flex-col justify-between flex-shrink-0 w-36 h-36 p-3.5 rounded-3xl bg-gradient-to-br ${account.color} relative overflow-hidden shadow-lg snap-center outline-none border ${account.borderColor} cursor-pointer`}
              onClick={() => setFilterAccountId(filterAccountId === account.id ? null : account.id)}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 pointer-events-none"></div>
              {filterAccountId === account.id && (
                <div className="absolute inset-0 border-2 border-white/60 rounded-3xl z-20 pointer-events-none"></div>
              )}
              
              <div className="relative z-10 flex justify-between items-start">
                 <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-xs shadow-inner border border-white/30">
                   {account.shortName}
                 </div>
                 <button onClick={(e) => handleDeleteAccount(account.id, e)} className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors z-30">
                   <X size={10} />
                 </button>
              </div>
              
              <div className="relative z-10 mt-auto">
                 <h4 className="text-white/90 font-medium text-[11px] mb-0.5">{account.name}</h4>
                 <p className="text-white font-bold text-lg drop-shadow-md">€{account.balance.toFixed(2)}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filter indicator */}
        {filterAccountId && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex items-center justify-center gap-2">
            <span className="text-[10px] text-accent font-medium">
              {accounts.find(a => a.id === filterAccountId)?.name}
            </span>
            <button onClick={() => setFilterAccountId(null)} className="text-white/40 hover:text-white">
              <X size={12} />
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Transaction header */}
      <div className="flex justify-between items-end mb-3 px-1">
        <h3 className="text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">{t('dash_transactions')}</h3>
        {transactions.length > 0 && (
          <button onClick={() => navTo('analytics')} className="text-[10px] font-medium text-accent uppercase tracking-widest hover:brightness-125 transition-all outline-none">{t('dash_analyze')}</button>
        )}
      </div>
    </motion.div>

    {/* ═══ SCROLLABLE TRANSACTIONS ZONE ═══ */}
    <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-36">
      <div className="flex flex-col gap-2">
         {sortedTransactions.length === 0 && (
           <div className="glass-panel p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
             <Banknote size={32} className="text-white/15 mx-auto mb-3" />
             <p className="text-white/30 text-sm">{isEmpty ? t('dash_no_accounts') : t('dash_no_transactions')}</p>
           </div>
         )}
         {sortedTransactions.map((tx, idx) => {
            const account = accounts.find(a => a.id === tx.accountId);
            const isPositive = tx.amount > 0;
            const Icon = iconMap[tx.icon] || ArrowRight;
            
            return (
               <motion.div 
                 key={tx.id}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: Math.min(0.1 + (idx * 0.03), 0.5), duration: 0.3 }}
                 className="relative overflow-hidden glass-panel p-3.5 flex items-center justify-between bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors rounded-2xl group"
               >
                  <div className="flex items-center gap-3 relative z-10 w-full">
                     <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center bg-black/40 border ${account?.borderColor || 'border-white/10'} shadow-inner shrink-0`}>
                         <Icon size={16} className={isPositive ? 'text-accent' : 'text-white/70'} />
                         {account && (
                           <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br ${account.color} border-2 border-obsidian flex items-center justify-center text-[5px] font-bold text-white`}>
                              {account.shortName}
                           </div>
                         )}
                     </div>
                     
                     <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center">
                            <span className="text-sm font-medium tracking-wide text-white/90 truncate">{tx.title}</span>
                            <span className={`text-sm font-bold ml-2 shrink-0 ${isPositive ? 'text-accent' : 'text-white'}`}>
                               {isPositive ? '+' : ''}{tx.amount.toFixed(2)}€
                            </span>
                         </div>
                         <div className="flex justify-between items-center mt-0.5">
                            <span className="text-[10px] text-white/40">{getRelativeDate(tx.date)} • {tx.category}</span>
                            <span className="text-[9px] font-medium text-white/30 uppercase">{account?.name}</span>
                         </div>
                     </div>

                     <button onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(tx.id); }} className="opacity-0 group-hover:opacity-100 ml-1 text-red-400/60 hover:text-red-400 transition-all shrink-0">
                       <Trash2 size={14} />
                     </button>
                  </div>
               </motion.div>
            );
         })}
      </div>

      {/* SW Update prompt */}
      <AnimatePresence>
        {swUpdate && !installDismissed && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 left-4 right-4 z-[60] glass-panel p-3 border border-blue-500/50 bg-blue-900/60 rounded-2xl flex items-center justify-between shadow-2xl backdrop-blur-3xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-300 shrink-0">
                <Download size={14} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white uppercase tracking-wider">Mise à jour dispo</p>
                <p className="text-[9px] text-white/50">Applique la pour les nouveautés</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => applyUpdate()} className="px-3 py-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider active:scale-95 transition-all">
                Actualiser
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install prompt */}
      <AnimatePresence>
        {!isStandalone && deferredPrompt && !installDismissed && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-4 left-4 right-4 z-[60] glass-panel p-3 border border-accent/30 bg-black/80 rounded-2xl flex items-center justify-between shadow-2xl backdrop-blur-3xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent shrink-0">
                <Download size={14} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white uppercase tracking-wider">{t('dash_install')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleInstallClick} className="px-3 py-1.5 bg-accent text-obsidian text-[10px] font-bold rounded-lg uppercase tracking-wider active:scale-95 transition-all">
                Installer
              </button>
              <button 
                onClick={() => { setInstallDismissed(true); sessionStorage.setItem('install_dismissed', '1'); }} 
                className="p-1 text-white/40 hover:text-white transition-colors active:scale-95"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Add Account Modal */}
    <AnimatePresence>
      {showAddAccount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 backdrop-blur-2xl bg-black/60 flex items-center justify-center px-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-panel w-full p-6 bg-obsidian/90 border border-white/10 rounded-3xl shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-white">{t('add_account_title')}</h3>
              <button onClick={() => setShowAddAccount(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-2 block">{t('add_account_name')}</label>
                <input 
                  type="text" 
                  value={newBank.name}
                  onChange={(e) => setNewBank({...newBank, name: e.target.value})}
                  placeholder="Ex: Boursorama, N26, Revolut..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-2 block">{t('add_account_type')}</label>
                <select 
                  value={newBank.type}
                  onChange={(e) => setNewBank({...newBank, type: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-accent/50 transition-colors appearance-none"
                >
                  <option value="Compte Courant" className="bg-[#0A0A0C]">Compte Courant</option>
                  <option value="Livret A" className="bg-[#0A0A0C]">Livret A</option>
                  <option value="PEA" className="bg-[#0A0A0C]">PEA</option>
                  <option value="Assurance Vie" className="bg-[#0A0A0C]">Assurance Vie</option>
                  <option value="Crypto" className="bg-[#0A0A0C]">Crypto</option>
                  <option value="Principal" className="bg-[#0A0A0C]">Principal</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-2 block">{t('add_account_balance')}</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newBank.balance}
                  onChange={(e) => setNewBank({...newBank, balance: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-accent/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddAccount(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium active:scale-95 transition-all">
                {t('add_account_cancel')}
              </button>
              <button onClick={handleAddBank} className="flex-1 py-3 rounded-xl bg-accent text-obsidian text-sm font-bold active:scale-95 transition-all shadow-[0_0_20px_color-mix(in srgb, var(--color-accent) 30%, transparent)]">
                {t('add_account_save')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
  );
};
