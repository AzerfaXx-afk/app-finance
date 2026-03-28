import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Calendar, ArrowLeft, ShoppingCart, Car, Coffee, Gamepad2, ArrowDownLeft, MonitorSmartphone, Home as HomeIcon, Heart, ShoppingBag, MoreHorizontal, Repeat, X, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useApp } from '../App';
import { getTransactions, getAccounts, getCategoryTotals, getTotalExpenses, getTotalIncome, CATEGORIES } from '../data/store';
import { t } from '../data/i18n';

const pageVariants = {
  initial: (dir) => ({ x: dir > 0 ? '50%' : '-50%', opacity: 0 }),
  animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: (dir) => ({ x: dir > 0 ? '-50%' : '50%', opacity: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } })
};

const CATEGORY_COLORS = {};
CATEGORIES.forEach(c => { CATEGORY_COLORS[c.name] = c.color; });

export const Analytics = ({ direction }) => {
  const { navTo, settings } = useApp();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [filterAccountId, setFilterAccountId] = useState(null);

  const allTransactions = getTransactions();
  const accounts = getAccounts();

  const monthTransactions = useMemo(() => {
    return allTransactions.filter(tx => {
      const d = new Date(tx.date);
      const matchesMonth = d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      const matchesAccount = !filterAccountId || tx.accountId === filterAccountId;
      return matchesMonth && matchesAccount;
    });
  }, [allTransactions, selectedYear, selectedMonth, filterAccountId]);

  const totalSpent = getTotalExpenses(monthTransactions);
  const totalIncome = getTotalIncome(monthTransactions);
  const balance = totalIncome - totalSpent;
  const categoryTotals = getCategoryTotals(monthTransactions);
  
  const budget = settings.monthlyBudget || 1500;
  const budgetPercent = Math.min(Math.round((totalSpent / budget) * 100), 100);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const todayDay = (selectedYear === now.getFullYear() && selectedMonth === now.getMonth()) ? now.getDate() : daysInMonth;
  const dailyAvg = todayDay > 0 ? (totalSpent / todayDay) : 0;

  const topExpense = monthTransactions.filter(tx => tx.amount < 0).sort((a, b) => a.amount - b.amount)[0];

  const donutSegments = useMemo(() => {
    if (totalSpent === 0) return [];
    let offset = 0;
    const circumference = 2 * Math.PI * 42;
    return categoryTotals.map(cat => {
      const percent = cat.total / totalSpent;
      const length = percent * circumference;
      const segment = { ...cat, offset, length, color: CATEGORY_COLORS[cat.name] || '#9CA3AF' };
      offset += length;
      return segment;
    });
  }, [categoryTotals, totalSpent]);

  const monthOptions = useMemo(() => {
    const months = [];
    for (let y = now.getFullYear(); y >= now.getFullYear() - 1; y--) {
      for (let m = 11; m >= 0; m--) {
        if (y === now.getFullYear() && m > now.getMonth()) continue;
        months.push({ year: y, month: m });
      }
    }
    return months;
  }, []);

  const isEmpty = allTransactions.length === 0;

  return (
  <motion.div 
    custom={direction}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="flex flex-col h-full absolute inset-0 z-10 overflow-hidden"
  >
    {/* ═══ FIXED HEADER ═══ */}
    <div className="flex-shrink-0 px-6 pt-6">
      <header className="flex justify-between items-center mb-4 mt-2">
        <button onClick={() => navTo('dashboard')} className="w-10 h-10 rounded-full glass-panel flex justify-center items-center bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-[10px] font-semibold tracking-[0.3em] text-white/90 uppercase">{t('stats_title')}</h1>
        <button onClick={() => setShowDatePicker(true)} className="w-10 h-10 rounded-full glass-panel flex justify-center items-center bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
          <Calendar size={16} className="text-gray-300" />
        </button>
      </header>

      {/* Period + Account filter */}
      <div className="flex flex-col items-center mb-3">
        <button onClick={() => setShowDatePicker(true)} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-3 backdrop-blur-md flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
          <p className="text-[9px] font-medium tracking-[0.2em] text-gray-400 uppercase">
            {t(`month_${selectedMonth}`)} {selectedYear}
          </p>
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        <button 
          onClick={() => setFilterAccountId(null)}
          className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all whitespace-nowrap ${
            !filterAccountId ? 'bg-[#00FFAA]/20 text-[#00FFAA] border border-[#00FFAA]/30' : 'bg-white/5 text-white/50 border border-white/10'
          }`}
        >
          {t('dash_all')}
        </button>
        {accounts.map((acc) => (
          <button 
            key={acc.id}
            onClick={() => setFilterAccountId(filterAccountId === acc.id ? null : acc.id)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all whitespace-nowrap ${
              filterAccountId === acc.id ? 'bg-[#00FFAA]/20 text-[#00FFAA] border border-[#00FFAA]/30' : 'bg-white/5 text-white/50 border border-white/10'
            }`}
          >
            {acc.name}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="glass-panel p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
          <TrendingDown size={14} className="text-red-400 mx-auto mb-1" />
          <p className="text-[8px] text-white/40 uppercase tracking-wider mb-0.5">{t('stats_expenses')}</p>
          <p className="text-sm font-bold text-red-400">€{totalSpent.toFixed(0)}</p>
        </div>
        <div className="glass-panel p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
          <TrendingUp size={14} className="text-[#00FFAA] mx-auto mb-1" />
          <p className="text-[8px] text-white/40 uppercase tracking-wider mb-0.5">{t('stats_income')}</p>
          <p className="text-sm font-bold text-[#00FFAA]">€{totalIncome.toFixed(0)}</p>
        </div>
        <div className="glass-panel p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
          <Wallet size={14} className="text-white/60 mx-auto mb-1" />
          <p className="text-[8px] text-white/40 uppercase tracking-wider mb-0.5">{t('stats_balance')}</p>
          <p className={`text-sm font-bold ${balance >= 0 ? 'text-[#00FFAA]' : 'text-red-400'}`}>
            {balance >= 0 ? '+' : ''}€{balance.toFixed(0)}
          </p>
        </div>
      </div>
    </div>

    {/* ═══ SCROLLABLE CONTENT ═══ */}
    <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-36">
      {isEmpty ? (
        <div className="glass-panel p-10 text-center bg-white/[0.02] border border-white/5 rounded-2xl mt-4">
          <TrendingDown size={36} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">{t('stats_no_data')}</p>
        </div>
      ) : (
        <>
          {/* Donut chart */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="relative w-40 h-40 mx-auto mb-4 flex items-center justify-center group"
          >
            <div className="absolute inset-2 rounded-full border border-white/5 bg-white/[0.01] backdrop-blur-3xl shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"></div>
            
            <svg className="w-full h-full transform -rotate-90 relative z-10 drop-shadow-2xl" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
              {donutSegments.map((seg, i) => (
                <motion.circle
                  key={seg.name}
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="8"
                  strokeDasharray={`${seg.length} ${2 * Math.PI * 42 - seg.length}`}
                  strokeDashoffset={-seg.offset}
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                />
              ))}
            </svg>
            
            <div className="absolute flex flex-col items-center justify-center w-full h-full">
              <div className="w-20 h-20 rounded-full bg-obsidian/40 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center shadow-xl">
                 <p className="text-[7px] font-semibold tracking-[0.25em] text-white/50 mb-0.5">{t('stats_budget')}</p>
                 <p className="text-2xl font-light text-white">{budgetPercent}<span className="text-sm text-white/40">%</span></p>
              </div>
            </div>
          </motion.div>

          {/* Extra stats */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 glass-panel p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-[8px] text-white/40 uppercase tracking-wider mb-1">{t('stats_daily_avg')}</p>
              <p className="text-lg font-bold text-white">€{dailyAvg.toFixed(0)}</p>
            </div>
            {topExpense && (
              <div className="flex-1 glass-panel p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                <p className="text-[8px] text-white/40 uppercase tracking-wider mb-1">{t('stats_top_expense')}</p>
                <p className="text-sm font-bold text-red-400 truncate">{topExpense.title}</p>
                <p className="text-[10px] text-white/40">{Math.abs(topExpense.amount).toFixed(2)}€</p>
              </div>
            )}
          </div>

          {/* Categories header */}
          <div className="flex justify-between items-end mb-3 px-1">
            <h3 className="text-[10px] font-semibold tracking-[0.15em] text-white/60 uppercase">{t('stats_categories')}</h3>
          </div>

          {/* Category list */}
          <div className="flex flex-col gap-2">
            {categoryTotals.length === 0 && (
              <div className="glass-panel p-6 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
                <p className="text-white/40 text-sm">{t('stats_no_data')}</p>
              </div>
            )}
            {categoryTotals.map((cat, i) => {
              const catDef = CATEGORIES.find(c => c.name === cat.name);
              const color = catDef?.color || '#9CA3AF';
              const percent = totalSpent > 0 ? Math.round((cat.total / totalSpent) * 100) : 0;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (i * 0.05), duration: 0.4 }}
                  key={cat.name} 
                  className="relative overflow-hidden glass-panel p-4 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors rounded-2xl"
                >
                  <div className="flex items-center gap-4 relative z-10 w-full">
                    <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center bg-black/40 border border-white/5 shadow-inner shrink-0">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium tracking-wide text-white/90">{cat.name}</span>
                        <span className="text-sm font-medium text-white">€{cat.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1.5">
                        <div className="flex-1 mr-3">
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-white/40 font-medium">{percent}% {t('stats_of_total')}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>

    {/* Date Picker Modal */}
    <AnimatePresence>
      {showDatePicker && (
        <motion.div
           initial={{ opacity: 0, y: "100%" }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: "100%" }}
           transition={{ type: "spring", damping: 25, stiffness: 200 }}
           className="absolute inset-0 z-50 backdrop-blur-2xl bg-black/60 flex flex-col justify-end"
        >
          <div className="glass-panel w-full bg-obsidian/90 border-t border-white/10 p-6 rounded-t-3xl pb-32">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-medium text-white">{t('stats_choose_period')}</h3>
               <button onClick={() => setShowDatePicker(false)} className="text-white/40 hover:text-white transition-colors">
                 <X size={20} />
               </button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto scrollbar-hide py-2 px-1">
               {monthOptions.map(({ year, month }) => {
                 const isSelected = year === selectedYear && month === selectedMonth;
                 return (
                   <button 
                     key={`${year}-${month}`}
                     onClick={() => { setSelectedYear(year); setSelectedMonth(month); setShowDatePicker(false); }}
                     className={`p-3 rounded-xl border flex items-center justify-center transition-all ${isSelected ? 'border-[#00FFAA] bg-[#00FFAA]/10 text-[#00FFAA]' : 'border-white/5 bg-white/5 text-white/70 hover:bg-white/10'}`}
                   >
                     <span className="text-xs font-semibold">{t(`month_${month}`)} {year}</span>
                   </button>
                 );
               })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
  );
};
