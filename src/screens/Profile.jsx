import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LogOut, Camera, Flame, Globe, Palette, Bell, ChevronRight, HelpCircle, Star, Fingerprint, Image as ImageIcon, Search, X, Edit2, Shield, Lock, Download, Trash2 } from 'lucide-react';
import { useApp } from '../App';
import { getProfile, saveProfile, getStreak, getPin, setPin as storeSetPin, getAccounts, getTransactions, getSubscriptions } from '../data/store';
import { t, SUPPORTED_LANGUAGES, getThemeNames } from '../data/i18n';

const pageVariants = {
  initial: (dir) => ({ x: dir > 0 ? '50%' : '-50%', opacity: 0 }),
  animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: (dir) => ({ x: dir > 0 ? '-50%' : '50%', opacity: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } })
};

const Toggle = ({ enabled, setEnabled, onChange }) => (
  <button 
    onClick={() => {
      const newVal = !enabled;
      setEnabled(newVal);
      if(onChange) onChange(newVal);
    }}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${enabled ? 'bg-[#00FFAA]' : 'bg-white/10'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

export const Profile = ({ direction }) => {
  const { navTo, showToast, settings, updateSettings, refreshData } = useApp();
  
  const [notifications, setNotifications] = useState(settings.notifications || false);
  const [faceId, setFaceId] = useState(settings.biometric ?? true);
  const [profile, setProfile] = useState(getProfile());
  const [streakDays, setStreakDays] = useState(0);
  
  const [showLangModal, setShowLangModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // PIN change states
  const [pinStep, setPinStep] = useState('current'); // current, new, confirm
  const [pinInput, setPinInput] = useState('');
  const [newPinTemp, setNewPinTemp] = useState('');
  const [pinError, setPinError] = useState('');

  const fileInputRef = useRef(null);
  const avatars = ['😡', '😀', '😢', '😎', '🤑', '🦊', '💎', '🐱', '🦁', '🔥'];
  const themes = getThemeNames();

  const themeColors = [
    { bg: 'bg-gradient-to-br from-emerald-900/50 to-black', accent: '#00FFAA' },
    { bg: 'bg-black', accent: '#FFFFFF' },
    { bg: 'bg-gradient-to-br from-orange-900/50 to-black', accent: '#F97316' },
    { bg: 'bg-gradient-to-br from-indigo-900/50 to-black', accent: '#818CF8' },
    { bg: 'bg-gradient-to-br from-rose-900/50 to-black', accent: '#F43F5E' },
  ];

  useEffect(() => {
    const streak = getStreak();
    const target = streak.count || 0;
    if (target === 0) { setStreakDays(0); return; }
    let current = 0;
    const interval = setInterval(() => {
      if (current < target) {
        current += 1;
        setStreakDays(current);
      } else clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const streakProgress = Math.min((streakDays / 100) * 100, 100);
  const streakColor = streakDays > 50 ? '#00FFAA' : (streakDays > 10 ? '#F97316' : '#EF4444');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
       const reader = new FileReader();
       reader.onloadend = () => {
          const updated = { ...profile, avatarUrl: reader.result };
          setProfile(updated);
          saveProfile(updated);
          showToast(t('toast_photo'), 'success');
       };
       reader.readAsDataURL(file);
    }
  };

  const handleNotificationToggle = (enabled) => {
    updateSettings('notifications', enabled);
    if (enabled) {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
             try { new Notification('Fluid Finance', { body: t('toast_notif_on') + ' 🚀', icon: '/fluid-icon.png' }); } catch(e) {}
          }
        });
      }
      showToast(t('toast_notif_on'), 'notification');
    } else {
      showToast(t('toast_notif_off'), 'info');
    }
  };

  const handleFaceIdToggle = (enabled) => {
    updateSettings('biometric', enabled);
    showToast(enabled ? t('toast_bio_on') : t('toast_bio_off'), enabled ? 'success' : 'info');
  };

  const selectLanguage = (code) => {
    updateSettings('language', code);
    setShowLangModal(false);
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    showToast(t('toast_lang', { name: lang?.name || code }), 'info');
  };

  const selectTheme = (idx) => {
    updateSettings('themeIndex', idx);
    setShowThemeModal(false);
    showToast(t('toast_theme', { name: themes[idx] }), 'info');
  };

  const handleNameChange = (name) => {
    const updated = { ...profile, name };
    setProfile(updated);
    saveProfile(updated);
  };

  const handleExport = () => {
    const data = {
      accounts: getAccounts(),
      transactions: getTransactions(),
      subscriptions: getSubscriptions(),
      profile: getProfile(),
      settings,
      exportDate: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      showToast(t('toast_exported'), 'success');
    }).catch(() => {
      // Fallback: download as file
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fluid-finance-backup.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast(t('toast_exported'), 'success');
    });
  };

  const handleReset = () => {
    if (window.confirm(t('profile_reset_confirm'))) {
      localStorage.clear();
      sessionStorage.clear();
      showToast(t('toast_reset_done'), 'info');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('fluid_session_auth');
    window.location.reload();
  };

  // PIN change handlers
  const handlePinKeyPress = (key) => {
    if (key === 'delete') {
      setPinInput(prev => prev.slice(0, -1));
      setPinError('');
      return;
    }
    if (pinInput.length >= 4) return;
    const newVal = pinInput + key;
    setPinInput(newVal);

    if (newVal.length === 4) {
      if (pinStep === 'current') {
        if (newVal === getPin()) {
          setTimeout(() => { setPinStep('new'); setPinInput(''); setPinError(''); }, 300);
        } else {
          setPinError(t('pin_wrong'));
          setTimeout(() => { setPinInput(''); setPinError(''); }, 1200);
        }
      } else if (pinStep === 'new') {
        setNewPinTemp(newVal);
        setTimeout(() => { setPinStep('confirm'); setPinInput(''); }, 300);
      } else if (pinStep === 'confirm') {
        if (newVal === newPinTemp) {
          storeSetPin(newVal);
          showToast(t('pin_changed'), 'success');
          setShowPinModal(false);
          setPinStep('current');
          setPinInput('');
          setNewPinTemp('');
        } else {
          setPinError(t('pin_mismatch'));
          setTimeout(() => { setPinStep('new'); setPinInput(''); setNewPinTemp(''); setPinError(''); }, 1200);
        }
      }
    }
  };

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === settings.language) || SUPPORTED_LANGUAGES[0];

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
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
          <h1 className="text-[11px] font-semibold tracking-[0.2em] text-white">{t('profile_title')}</h1>
          <button onClick={handleLogout} className="w-10 h-10 rounded-full glass-panel flex justify-center items-center bg-white/5 hover:bg-white/10 transition-colors">
            <LogOut size={18} className="text-gray-300" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col pb-4">
          {/* Profile Header */}
          <div className="glass-panel p-6 flex flex-col items-center mb-6 relative bg-white/[0.02]">
            <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-indigo/10 to-transparent pointer-events-none rounded-t-3xl"></div>
            
            <div className="relative mb-4 group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
              <div className="w-24 h-24 rounded-full p-[2px] shadow-[0_0_25px_rgba(0,255,170,0.15)] bg-gradient-to-tr from-[#00FFAA] via-[#8B5CF6] to-[#F97316]">
                <div className="w-full h-full rounded-full bg-obsidian overflow-hidden border-2 border-obsidian relative flex items-center justify-center">
                   {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                      <span className="text-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{avatars[profile.avatarIndex || 0]}</span>
                   )}
                   <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                      <ImageIcon size={20} className="text-white mb-1" />
                   </div>
                </div>
              </div>
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#FF6B00] border-2 border-obsidian flex items-center justify-center shadow-lg z-10">
                 <Star size={10} fill="currentColor" className="text-white" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-1 relative z-10 group">
               {isEditingName ? (
                 <input 
                   autoFocus
                   type="text" 
                   value={profile.name} 
                   onChange={(e) => handleNameChange(e.target.value)}
                   onBlur={() => setIsEditingName(false)}
                   onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                   className="bg-white/10 outline-none border border-white/20 px-2 py-0.5 rounded text-white text-center font-medium"
                 />
               ) : (
                 <>
                   <h2 className="text-2xl font-medium text-white">{profile.name}</h2>
                   <button onClick={() => setIsEditingName(true)} className="opacity-40 hover:opacity-100 transition-opacity">
                     <Edit2 size={12} />
                   </button>
                 </>
               )}
            </div>
            
            <p className="text-xs text-white/40 mb-3 relative z-10">{t('profile_local')}</p>
          </div>

          {/* Streak */}
          <motion.div 
             initial={{ scale: 0.95, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="glass-panel p-5 mb-8 relative overflow-hidden flex items-center justify-between group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="flex items-center gap-4 relative z-10">
               <div className="relative w-12 h-12 flex items-center justify-center">
                 <motion.div 
                   animate={{ scale: [1, 1.1, 1] }} 
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute inset-0 rounded-full opacity-30 blur-md transition-colors duration-1000"
                   style={{ backgroundColor: streakColor }}
                 ></motion.div>
                 <Flame size={28} style={{ color: streakColor }} className="relative z-10 drop-shadow-lg transition-colors duration-1000" />
               </div>
               <div>
                 <h3 className="text-sm font-semibold text-white mb-0.5">{t('profile_streak')}</h3>
                 <p className="text-[10px] text-white/50">{t('profile_days_left', { n: Math.max(0, 100 - streakDays) })}</p>
               </div>
            </div>
            <div className="flex flex-col items-end relative z-10">
               <span className="text-2xl font-light transition-colors duration-1000" style={{ color: streakColor }}>
                 {streakDays}<span className="text-sm text-white/30 ml-1">j</span>
               </span>
               <div className="w-16 h-1 mt-1 bg-white/10 rounded-full overflow-hidden">
                 <motion.div 
                    animate={{ width: `${streakProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full transition-colors duration-1000"
                    style={{ backgroundColor: streakColor }}
                 ></motion.div>
               </div>
            </div>
          </motion.div>

          {/* Appearance */}
          <div className="flex flex-col gap-2 mb-6">
            <h3 className="text-[10px] font-semibold tracking-[0.2em] text-white/40 ml-2 mb-1 uppercase">{t('profile_appearance')}</h3>
            <div className="glass-panel bg-white/[0.02] divide-y divide-white/5 overflow-hidden border border-white/5">
              <div onClick={() => setShowLangModal(true)} className="p-4 flex items-center justify-between active:bg-white/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/10">
                      <Globe size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white/90">{t('profile_language')}</span>
                      <span className="text-[10px] text-white/40 mt-0.5">{currentLang.flag} {currentLang.name}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/30" />
              </div>
              <div onClick={() => setShowThemeModal(true)} className="p-4 flex items-center justify-between active:bg-white/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                      <Palette size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white/90">{t('profile_theme')}</span>
                      <span className="text-[10px] text-white/40 mt-0.5">{themes[settings.themeIndex || 0]}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/30" />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="flex flex-col gap-2 mb-6">
            <h3 className="text-[10px] font-semibold tracking-[0.2em] text-white/40 ml-2 mb-1 uppercase">{t('profile_preferences')}</h3>
            <div className="glass-panel bg-white/[0.02] divide-y divide-white/5 overflow-hidden border border-white/5">
              <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/10">
                      <Bell size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white/90">{t('profile_notifications')}</span>
                      <span className="text-[10px] text-white/40 mt-0.5">{t('profile_notif_desc')}</span>
                    </div>
                  </div>
                  <Toggle enabled={notifications} setEnabled={setNotifications} onChange={handleNotificationToggle} />
              </div>
              <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-[#00FFAA]/10 flex items-center justify-center text-[#00FFAA] border border-[#00FFAA]/10">
                      <Fingerprint size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white/90">{t('profile_biometric')}</span>
                      <span className="text-[10px] text-white/40 mt-0.5">{t('profile_biometric_desc')}</span>
                    </div>
                  </div>
                  <Toggle enabled={faceId} setEnabled={setFaceId} onChange={handleFaceIdToggle} />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="flex flex-col gap-2 mb-6">
            <h3 className="text-[10px] font-semibold tracking-[0.2em] text-white/40 ml-2 mb-1 uppercase">{t('profile_security')}</h3>
            <div className="glass-panel bg-white/[0.02] divide-y divide-white/5 overflow-hidden border border-white/5">
              <div onClick={() => { setShowPinModal(true); setPinStep('current'); setPinInput(''); setNewPinTemp(''); setPinError(''); }} className="p-4 flex items-center justify-between active:bg-white/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/10">
                      <Lock size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white/90">{t('profile_change_pin')}</span>
                      <span className="text-[10px] text-white/40 mt-0.5">{t('profile_change_pin_desc')}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/30" />
              </div>
            </div>
          </div>

          {/* Data */}
          <div className="flex flex-col gap-2 mb-6">
            <h3 className="text-[10px] font-semibold tracking-[0.2em] text-white/40 ml-2 mb-1 uppercase">{t('profile_data')}</h3>
            <div className="glass-panel bg-white/[0.02] divide-y divide-white/5 overflow-hidden border border-white/5">
              <div onClick={handleExport} className="p-4 flex items-center justify-between active:bg-white/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/10">
                      <Download size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white/90">{t('profile_export')}</span>
                      <span className="text-[10px] text-white/40 mt-0.5">{t('profile_export_desc')}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/30" />
              </div>
              <div onClick={handleReset} className="p-4 flex items-center justify-between active:bg-white/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/10">
                      <Trash2 size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white/90">{t('profile_reset')}</span>
                      <span className="text-[10px] text-white/40 mt-0.5">{t('profile_reset_desc')}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/30" />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 mb-8">
            <button onClick={() => showToast("Assistance en ligne disponible bientôt", 'notification')} className="w-full glass-panel p-4 flex items-center justify-between text-white bg-white/[0.02] active:bg-white/5 transition-all border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-gray-500/10 flex items-center justify-center text-gray-300 border border-gray-500/10">
                  <HelpCircle size={18} />
                </div>
                <span className="text-sm font-medium text-white/90">{t('profile_help')}</span>
              </div>
              <ChevronRight size={18} className="text-white/30" />
            </button>
          </div>
          
          <div className="text-center pb-20">
          </div>
        </div>
      </motion.div>

      {/* Language Modal */}
      <AnimatePresence>
        {showLangModal && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 backdrop-blur-2xl bg-black/60 flex flex-col pt-12"
          >
             <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent pointer-events-none"></div>
             <div className="flex justify-between items-center px-6 mb-6 relative z-10">
               <h2 className="text-lg font-medium text-white">{t('profile_choose_lang')}</h2>
               <button onClick={() => setShowLangModal(false)} className="w-10 h-10 rounded-full glass-panel flex justify-center items-center bg-white/5">
                 <X size={20} className="text-white" />
               </button>
             </div>

             <div className="px-6 mb-6 relative z-10">
               <div className="relative">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                 <input 
                   type="text" 
                   placeholder={t('profile_search_lang')}
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-[#00FFAA]/50 transition-colors"
                 />
               </div>
             </div>

             <div className="flex-1 overflow-y-auto px-6 pb-12 relative z-10 scrollbar-hide">
               {filteredLanguages.length > 0 ? (
                 <div className="glass-panel divide-y divide-white/5 overflow-hidden border border-white/5 bg-white/[0.02]">
                   {filteredLanguages.map((lang) => {
                     const isSelected = lang.code === settings.language;
                     return (
                       <button 
                         key={lang.code}
                         onClick={() => selectLanguage(lang.code)}
                         className={`w-full p-5 flex items-center justify-between transition-colors ${isSelected ? 'bg-white/10' : 'active:bg-white/5'}`}
                       >
                         <div className="flex items-center gap-3">
                           <span className="text-xl">{lang.flag}</span>
                           <span className={`text-sm ${isSelected ? 'font-semibold text-white' : 'font-medium text-white/80'}`}>{lang.name}</span>
                         </div>
                         {isSelected && <div className="w-2 h-2 rounded-full bg-[#00FFAA] shadow-[0_0_8px_rgba(0,255,170,0.8)]"></div>}
                       </button>
                     );
                   })}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center pt-20 text-white/40">
                   <Globe size={48} className="mb-4 opacity-20" />
                   <p className="text-sm">{t('profile_no_lang')}</p>
                 </div>
               )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme Wheel Modal */}
      <AnimatePresence>
        {showThemeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 backdrop-blur-3xl bg-black/70 flex flex-col justify-center items-center px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel w-full p-6 bg-obsidian/90 border border-white/10 rounded-3xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-white">{t('profile_choose_theme')}</h3>
                <button onClick={() => setShowThemeModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>

              {/* Circular theme selector */}
              <div className="relative w-64 h-64 mx-auto mb-6">
                {themes.map((theme, idx) => {
                  const angle = (idx / themes.length) * 360 - 90;
                  const rad = (angle * Math.PI) / 180;
                  const radius = 90;
                  const x = 128 + radius * Math.cos(rad) - 32;
                  const y = 128 + radius * Math.sin(rad) - 32;
                  const isSelected = idx === (settings.themeIndex || 0);

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => selectTheme(idx)}
                      whileTap={{ scale: 0.9 }}
                      className={`absolute w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${themeColors[idx].bg} border-2 ${isSelected ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-110' : 'border-white/10 hover:border-white/30'}`}
                      style={{ left: x, top: y }}
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: themeColors[idx].accent, boxShadow: isSelected ? `0 0 12px ${themeColors[idx].accent}` : 'none' }}></div>
                    </motion.button>
                  );
                })}

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Palette size={24} className="text-white/40" />
                  </div>
                </div>
              </div>

              <p className="text-center text-sm font-medium text-white/70">{themes[settings.themeIndex || 0]}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 backdrop-blur-3xl bg-black/60 flex flex-col justify-center items-center px-6"
          >
             <div className="glass-panel w-full p-6 bg-obsidian/80 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative rounded-3xl">
                <button onClick={() => setShowAvatarModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
                <h3 className="text-lg font-medium text-white mb-6">{t('profile_avatar_title')}</h3>
                
                <div className="grid grid-cols-5 gap-3 mb-6">
                  {avatars.map((emoji, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        const updated = { ...profile, avatarIndex: idx, avatarUrl: null };
                        setProfile(updated);
                        saveProfile(updated);
                        setShowAvatarModal(false);
                      }}
                      className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-2xl transition-all ${idx === profile.avatarIndex && !profile.avatarUrl ? 'bg-white/20 border border-white/30 scale-110 shadow-lg' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
                    >
                      <span className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]">{emoji}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{t('profile_or')}</span>
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                </div>

                <button onClick={() => { if(fileInputRef.current) fileInputRef.current.click(); setShowAvatarModal(false); }} className="w-full mt-6 py-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-sm font-medium text-white hover:bg-white/10 transition-colors active:scale-95">
                  <Camera size={16} /> {t('profile_import_photo')}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Change Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 backdrop-blur-3xl bg-black/80 flex flex-col items-center justify-between py-16 px-6"
          >
            <div className="flex flex-col items-center mt-12 w-full">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-8 border border-amber-500/20">
                <Shield size={24} className="text-amber-400" />
              </div>

              {/* PIN dots */}
              <div className="flex gap-5 mb-6">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div 
                    key={i} 
                    animate={{ 
                      scale: pinInput.length > i ? [1, 1.2, 1] : 1, 
                      backgroundColor: pinInput.length > i ? '#00FFAA' : 'rgba(255,255,255,0.1)' 
                    }}
                    transition={{ duration: 0.2 }}
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ boxShadow: pinInput.length > i ? '0 0 15px rgba(0,255,170,0.6)' : 'none' }}
                  />
                ))}
              </div>

              <p className={`text-[11px] tracking-widest uppercase font-medium h-4 ${pinError ? 'text-red-400' : 'text-white/50'}`}>
                {pinError || (pinStep === 'current' ? t('pin_current') : pinStep === 'new' ? t('pin_new') : t('pin_confirm'))}
              </p>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-x-8 gap-y-6 w-full max-w-[280px] mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                  key={num}
                  onClick={() => handlePinKeyPress(num.toString())}
                  className="w-16 h-16 mx-auto rounded-full glass-panel bg-white/[0.03] border border-white/5 text-2xl font-light text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all outline-none"
                >
                  {num}
                </button>
              ))}
              <button onClick={() => { setShowPinModal(false); setPinInput(''); setPinStep('current'); }} className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-red-400/60 hover:text-red-400 transition-all outline-none">
                <X size={22} />
              </button>
              <button onClick={() => handlePinKeyPress('0')} className="w-16 h-16 mx-auto rounded-full glass-panel bg-white/[0.03] border border-white/5 text-2xl font-light text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all outline-none">
                0
              </button>
              <button onClick={() => handlePinKeyPress('delete')} className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white/30 hover:text-white active:scale-95 transition-all text-2xl outline-none">
                ⌫
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
