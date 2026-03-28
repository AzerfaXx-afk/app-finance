import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Minus, Plus, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { getAccounts, addTransaction, CATEGORIES } from '../data/store';
import { t } from '../data/i18n';

export const Scanner = ({ direction }) => {
  const { navTo, showToast, refreshData } = useApp();
  const [type, setType] = useState('expense'); // expense or income
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accounts, setAccounts] = useState([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  useEffect(() => {
    const accs = getAccounts();
    setAccounts(accs);
    if (accs.length > 0 && !accountId) setAccountId(accs[0].id);
  }, []);

  const handleKeyPress = (key) => {
    if (key === '⌫') {
      setAmount(prev => prev.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) setAmount(prev => prev + '.');
    } else {
      // Limit decimals to 2
      const parts = amount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      setAmount(prev => prev + key);
    }
  };

  const handleConfirm = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      showToast('Entrez un montant valide', 'info');
      return;
    }
    if (!accountId) {
      showToast(t('scan_select_account'), 'info');
      return;
    }
    if (!title.trim()) {
      setTitle(category || 'Transaction');
    }

    const finalAmount = type === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);
    const selectedCat = CATEGORIES.find(c => c.name === category) || CATEGORIES[CATEGORIES.length - 1];

    addTransaction({
      accountId,
      title: title.trim() || category || 'Transaction',
      amount: finalAmount,
      date,
      category: category || 'Autres',
      icon: selectedCat.icon,
    });

    refreshData();
    showToast(t('toast_tx_added'), 'success');
    navTo('dashboard');
  };

  const selectedAccount = accounts.find(a => a.id === accountId);
  const selectedCategory = CATEGORIES.find(c => c.name === category);

  return (
    <motion.div 
      initial={{ opacity: 0, y: "100%" }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: "100%" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-full absolute inset-0 z-20 backdrop-blur-xl bg-black/40"
    >
      <header className="flex justify-between items-center p-6 pt-10 relative z-20">
        <button onClick={() => navTo('dashboard')} className="w-10 h-10 rounded-full bg-white/5 flex justify-center items-center active:scale-95 transition-all border border-white/10">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-sm font-medium text-white">{t('scan_title')}</h1>
        <div className="w-10 h-10"></div>
      </header>

      {/* Type Toggle */}
      <div className="px-6 mb-4">
        <div className="glass-panel p-1 flex bg-white/5 border-white/10 rounded-full">
          <button 
            onClick={() => setType('expense')}
            className={`flex-1 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${type === 'expense' ? 'bg-red-500/20 text-red-400 shadow-md' : 'text-white/40'}`}
          >
            <Minus size={14} /> {t('scan_expense')}
          </button>
          <button 
            onClick={() => setType('income')}
            className={`flex-1 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${type === 'income' ? 'bg-[#00FFAA]/20 text-[#00FFAA] shadow-md' : 'text-white/40'}`}
          >
            <Plus size={14} /> {t('scan_income')}
          </button>
        </div>
      </div>

      {/* Amount Display */}
      <div className="flex-shrink-0 flex flex-col items-center px-6 mb-4">
        <div className="relative z-30 text-center flex flex-col items-center">
          <h2 className="text-5xl font-light tracking-tight glow-text flex items-start">
            <span className={`text-2xl mt-2 mr-1 ${type === 'expense' ? 'text-red-400' : 'text-[#00FFAA]'}`}>€</span>
            {amount || '0.00'}
          </h2>
        </div>
      </div>

      {/* Form Fields */}
      <div className="px-6 flex flex-col gap-3 mb-4 flex-shrink-0">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('scan_name')}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 outline-none focus:border-[#00FFAA]/50 transition-colors"
        />

        <div className="flex gap-3">
          {/* Category picker */}
          <button 
            onClick={() => setShowCategoryPicker(true)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-left flex items-center justify-between"
          >
            <span className={category ? 'text-white' : 'text-white/30'}>
              {category || t('scan_category')}
            </span>
            <ChevronDown size={14} className="text-white/30" />
          </button>

          {/* Account picker */}
          <button 
            onClick={() => setShowAccountPicker(true)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-left flex items-center justify-between"
          >
            <span className={accountId ? 'text-white' : 'text-white/30'}>
              {selectedAccount?.name || t('scan_account')}
            </span>
            <ChevronDown size={14} className="text-white/30" />
          </button>
        </div>

        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-[#00FFAA]/50 transition-colors [color-scheme:dark]"
        />
      </div>

      {/* Numpad */}
      <div className="flex-1 glass-panel rounded-t-[40px] rounded-b-none border-b-0 border-x-0 sticky bottom-0 z-40 p-6 flex flex-col justify-between backdrop-blur-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.5)] bg-white/5">
        <div className="grid grid-cols-3 gap-y-5 text-center text-2xl font-light mt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '⌫'].map((key, i) => (
            <button 
              key={i} 
              onClick={() => handleKeyPress(key.toString())}
              className="text-gray-200 active:text-white active:scale-95 transition-all py-2 outline-none"
            >
              {key}
            </button>
          ))}
        </div>
        <button 
          onClick={handleConfirm}
          className={`w-full py-4 mt-4 rounded-[1.25rem] text-white font-medium text-xs tracking-widest shadow-[0_0_20px_rgba(0,255,170,0.15)] active:scale-95 transition-all ${
            type === 'expense' 
              ? 'bg-gradient-to-r from-red-600 to-orange-500'
              : 'bg-gradient-to-r from-[#00FFAA]/80 to-[#8B5CF6]/80'
          }`}
        >
          {t('scan_confirm')}
        </button>
      </div>

      {/* Category Picker Modal */}
      <AnimatePresence>
        {showCategoryPicker && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 backdrop-blur-2xl bg-black/60 flex flex-col justify-end"
          >
            <div className="glass-panel w-full bg-obsidian/90 border-t border-white/10 p-6 rounded-t-3xl pb-10 max-h-[60vh] overflow-y-auto scrollbar-hide">
              <h3 className="text-lg font-medium text-white mb-4">{t('scan_select_category')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.filter(c => type === 'income' ? (c.name === 'Revenus' || c.name === 'Remboursement' || c.name === 'Autres') : c.name !== 'Revenus').map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => { setCategory(cat.name); setShowCategoryPicker(false); }}
                    className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${category === cat.name ? 'border-[#00FFAA] bg-[#00FFAA]/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    </div>
                    <span className="text-xs font-medium text-white/80">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Picker Modal */}
      <AnimatePresence>
        {showAccountPicker && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 backdrop-blur-2xl bg-black/60 flex flex-col justify-end"
          >
            <div className="glass-panel w-full bg-obsidian/90 border-t border-white/10 p-6 rounded-t-3xl pb-10">
              <h3 className="text-lg font-medium text-white mb-4">{t('scan_select_account')}</h3>
              <div className="flex flex-col gap-2">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => { setAccountId(acc.id); setShowAccountPicker(false); }}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${accountId === acc.id ? 'border-[#00FFAA] bg-[#00FFAA]/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${acc.color} flex items-center justify-center text-white font-bold text-sm`}>
                        {acc.shortName}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">{acc.name}</p>
                        <p className="text-[10px] text-white/40">{acc.type} • €{acc.balance.toFixed(2)}</p>
                      </div>
                    </div>
                    {accountId === acc.id && <div className="w-2 h-2 rounded-full bg-[#00FFAA] shadow-[0_0_8px_rgba(0,255,170,0.8)]"></div>}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
