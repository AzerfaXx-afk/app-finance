import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, X, Wallet, Tv, Music, Cloud, Gamepad2, ShoppingCart, Car, Coffee, MoreHorizontal, Repeat, CreditCard } from 'lucide-react';
import { useApp } from '../App';
import { getSubscriptions, addSubscription, deleteSubscription, getTransactions, getTotalExpenses, CATEGORIES } from '../data/store';
import { t } from '../data/i18n';

const pageVariants = {
  initial: (dir) => ({ x: dir > 0 ? '50%' : '-50%', opacity: 0 }),
  animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: (dir) => ({ x: dir > 0 ? '-50%' : '50%', opacity: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } })
};

const iconMap = { Tv, Music, Cloud, Gamepad2, ShoppingCart, Car, Coffee, MoreHorizontal, Repeat, CreditCard };

const SUB_ICONS = [
  { name: 'Tv', label: 'Streaming' },
  { name: 'Music', label: 'Musique' },
  { name: 'Cloud', label: 'Cloud' },
  { name: 'Gamepad2', label: 'Jeux' },
  { name: 'CreditCard', label: 'Service' },
  { name: 'Repeat', label: 'Autre' },
];

const SUB_COLORS = ['#E50914', '#1DB954', '#007AFF', '#FF6B00', '#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B'];

export const Budget = ({ direction }) => {
  const { navTo, showToast, settings, updateSettings, refreshKey } = useApp();
  const [subscriptions, setSubscriptions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', amount: '', icon: 'Tv', color: '#E50914', billingDay: 1 });
  const [budgetInput, setBudgetInput] = useState('');

  useEffect(() => {
    setSubscriptions(getSubscriptions());
  }, [refreshKey]);

  const monthlySubTotal = subscriptions.reduce((s, sub) => s + sub.amount, 0);
  
  // Get current month expenses
  const now = new Date();
  const monthTransactions = useMemo(() => {
    return getTransactions().filter(tx => {
      const d = new Date(tx.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [refreshKey]);
  
  const monthSpent = getTotalExpenses(monthTransactions);
  const budget = settings.monthlyBudget || 1500;
  const remaining = budget - monthSpent;
  const budgetPercent = Math.min(Math.round((monthSpent / budget) * 100), 100);

  const handleAddSub = () => {
    if (!newSub.name.trim() || !newSub.amount) return;
    addSubscription({
      name: newSub.name.trim(),
      amount: parseFloat(newSub.amount),
      icon: newSub.icon,
      color: newSub.color,
      billingDay: newSub.billingDay,
      category: 'Abonnements',
    });
    setSubscriptions(getSubscriptions());
    setShowAddModal(false);
    setNewSub({ name: '', amount: '', icon: 'Tv', color: '#E50914', billingDay: 1 });
    showToast(t('toast_sub_added'), 'success');
  };

  const handleDeleteSub = (id) => {
    deleteSubscription(id);
    setSubscriptions(getSubscriptions());
    showToast(t('toast_sub_deleted'), 'info');
  };

  const handleSetBudget = () => {
    const val = parseFloat(budgetInput);
    if (val > 0) {
      updateSettings('monthlyBudget', val);
      setShowBudgetModal(false);
      setBudgetInput('');
    }
  };

  return (
  <motion.div 
    custom={direction}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="flex flex-col h-full p-6 absolute inset-0 z-10 overflow-hidden pb-20"
  >
    <header className="flex justify-between items-center mb-6 mt-4 shrink-0">
      <button onClick={() => navTo('dashboard')} className="w-10 h-10 rounded-full glass-panel flex justify-center items-center bg-white/5 active:scale-95 transition-all hover:bg-white/10">
        <ArrowLeft size={20} className="text-white" />
      </button>
      <h1 className="text-[11px] font-semibold tracking-[0.2em] text-white">{t('budget_title')}</h1>
      <div className="w-10 h-10"></div>
    </header>

    <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col pb-4">
      {/* Budget Overview Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-5 mb-6 relative overflow-hidden bg-white/[0.02]"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase mb-1">{t('budget_monthly')}</h3>
            <p className="text-3xl font-light text-white">€{budget.toFixed(0)}</p>
          </div>
          <button onClick={() => { setBudgetInput(budget.toString()); setShowBudgetModal(true); }} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-white/60 hover:bg-white/10 transition-all">
            {t('budget_set')}
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${budgetPercent}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-full ${budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-orange-500' : 'bg-[#00FFAA]'}`}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${budgetPercent > 90 ? 'bg-red-500' : 'bg-[#00FFAA]'}`}></div>
            <span className="text-[10px] text-white/50">{t('budget_spent')}: €{monthSpent.toFixed(0)}</span>
          </div>
          <span className={`text-[10px] font-medium ${remaining >= 0 ? 'text-[#00FFAA]' : 'text-red-400'}`}>
            {t('budget_remaining')}: €{remaining.toFixed(0)}
          </span>
        </div>
      </motion.div>

      {/* Subscriptions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex justify-between items-end mb-3 px-1">
          <h3 className="text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">{t('budget_subscriptions')}</h3>
          <button onClick={() => setShowAddModal(true)} className="text-[10px] font-medium text-[#00FFAA] uppercase tracking-widest hover:brightness-125 transition-all outline-none flex items-center gap-1">
            <Plus size={12} /> {t('budget_add_sub')}
          </button>
        </div>

        {/* Monthly total card */}
        <div className="glass-panel p-4 mb-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Repeat size={18} className="text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('budget_monthly_total')}</p>
              <p className="text-lg font-bold text-white">€{monthlySubTotal.toFixed(2)}</p>
            </div>
          </div>
          <span className="text-[10px] text-purple-400 font-medium">{t('budget_per_month')}</span>
        </div>

        {subscriptions.length === 0 && (
          <div className="glass-panel p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
            <Wallet size={32} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">{t('budget_no_subs')}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {subscriptions.map((sub, idx) => {
            const Icon = iconMap[sub.icon] || CreditCard;
            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + idx * 0.05 }}
                className="glass-panel p-4 flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: sub.color + '20', borderColor: sub.color + '30', borderWidth: 1 }}>
                    <Icon size={18} style={{ color: sub.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">{sub.name}</p>
                    <p className="text-[10px] text-white/40">
                      {sub.billingDay ? `Jour ${sub.billingDay}` : ''} {sub.category ? `• ${sub.category}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">€{sub.amount.toFixed(2)}</span>
                  <button onClick={() => handleDeleteSub(sub.id)} className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>

    {/* Add Subscription Modal */}
    <AnimatePresence>
      {showAddModal && (
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
              <h3 className="text-lg font-medium text-white">{t('budget_add_sub')}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-2 block">{t('budget_sub_name')}</label>
                <input 
                  type="text"
                  value={newSub.name}
                  onChange={(e) => setNewSub({...newSub, name: e.target.value})}
                  placeholder="Ex: Netflix, Spotify, Disney+..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-[#00FFAA]/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-2 block">{t('budget_sub_amount')}</label>
                <input 
                  type="number"
                  step="0.01"
                  value={newSub.amount}
                  onChange={(e) => setNewSub({...newSub, amount: e.target.value})}
                  placeholder="9.99"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-[#00FFAA]/50 transition-colors"
                />
              </div>

              {/* Icon picker */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-2 block">Icône</label>
                <div className="flex gap-2 flex-wrap">
                  {SUB_ICONS.map((ic) => {
                    const Ic = iconMap[ic.name] || CreditCard;
                    return (
                      <button
                        key={ic.name}
                        onClick={() => setNewSub({...newSub, icon: ic.name})}
                        className={`p-2.5 rounded-xl border transition-all ${newSub.icon === ic.name ? 'border-[#00FFAA] bg-[#00FFAA]/10' : 'border-white/10 bg-white/5'}`}
                      >
                        <Ic size={16} className="text-white/70" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-2 block">Couleur</label>
                <div className="flex gap-2">
                  {SUB_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewSub({...newSub, color})}
                      className={`w-8 h-8 rounded-full transition-all ${newSub.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0A0A0C] scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium active:scale-95 transition-all">
                {t('cancel')}
              </button>
              <button onClick={handleAddSub} className="flex-1 py-3 rounded-xl bg-[#00FFAA] text-obsidian text-sm font-bold active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,170,0.3)]">
                {t('confirm')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Budget Set Modal */}
    <AnimatePresence>
      {showBudgetModal && (
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
            <h3 className="text-lg font-medium text-white mb-4">{t('budget_set')}</h3>
            <input 
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="1500"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-[#00FFAA]/50 transition-colors mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowBudgetModal(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium active:scale-95 transition-all">
                {t('cancel')}
              </button>
              <button onClick={handleSetBudget} className="flex-1 py-3 rounded-xl bg-[#00FFAA] text-obsidian text-sm font-bold active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,170,0.3)]">
                {t('save')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
  );
};
