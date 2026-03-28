import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, Fingerprint } from 'lucide-react';

import { NavBar } from './components/NavBar';
import { Toast } from './components/Toast';
import { Dashboard } from './screens/Dashboard';
import { Analytics } from './screens/Analytics';
import { Scanner } from './screens/Scanner';
import { Profile } from './screens/Profile';
import { Budget } from './screens/Budget';
import { Confirmation } from './screens/Confirmation';
import { initStore, getSettings, saveSettings, getStreak, saveStreak, getPin, setPin, removePin } from './data/store';
import { t, setLanguage, getLanguage } from './data/i18n';

// ─── Global App Context ───
export const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

const SCREEN_ORDER = {
  dashboard: 0,
  analytics: 1,
  scanner: 2,
  budget: 3,
  profile: 4,
  confirmation: 5
};

// ─── Auth Screen ───
const AuthScreen = ({ onAuth, lang }) => {
  const savedPin = getPin();
  const [mode, setMode] = useState(savedPin ? 'LOGIN' : 'SETUP_1');
  const [tempPin, setTempPin] = useState('');
  const [pin, setPinState] = useState('');
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(parseInt(localStorage.getItem('fluid_failed_attempts') || '0', 10));
  const [lockedUntil, setLockedUntil] = useState(parseInt(localStorage.getItem('fluid_lockout') || '0', 10));
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (lockedUntil > Date.now()) {
       setCountdown(Math.ceil((lockedUntil - Date.now()) / 1000));
       timer = setInterval(() => {
          const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
          if (remaining <= 0) {
             setCountdown(0);
             setLockedUntil(0);
             setFailedAttempts(0);
             localStorage.setItem('fluid_failed_attempts', '0');
             localStorage.setItem('fluid_lockout', '0');
             clearInterval(timer);
          } else {
             setCountdown(remaining);
          }
       }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const handleKeyPress = (key) => {
    if (scanning || countdown > 0) return;
    
    if (key === 'delete') {
      setPinState(prev => prev.slice(0, -1));
      setErrorMsg('');
    } else if (pin.length < 4) {
      const newPin = pin + key;
      setPinState(newPin);
      
      if (newPin.length === 4) {
        if (mode === 'SETUP_1') {
           setTempPin(newPin);
           setTimeout(() => {
             setPinState('');
             setMode('SETUP_2');
             setErrorMsg('');
           }, 200);
        } else if (mode === 'SETUP_2') {
           if (newPin === tempPin) {
              setPin(newPin);
              setTimeout(() => onAuth(), 300);
           } else {
              setErrorMsg(t('pin_mismatch'));
              setTimeout(() => {
                setPinState('');
                setTempPin('');
                setMode('SETUP_1');
                setErrorMsg('');
              }, 1500);
           }
        } else if (mode === 'LOGIN') {
           if (newPin === savedPin) {
              setFailedAttempts(0);
              localStorage.setItem('fluid_failed_attempts', '0');
              setTimeout(() => onAuth(), 300);
           } else {
              const newFails = failedAttempts + 1;
              setFailedAttempts(newFails);
              localStorage.setItem('fluid_failed_attempts', newFails.toString());
              setPinState('');
              if (newFails >= 3) {
                 const lockoutEnd = Date.now() + 30000;
                 setLockedUntil(lockoutEnd);
                 localStorage.setItem('fluid_lockout', lockoutEnd.toString());
                 setErrorMsg(t('pin_too_many'));
              } else {
                 setErrorMsg(t('pin_incorrect', { n: 3 - newFails }));
                 setTimeout(() => setErrorMsg(''), 1500);
              }
           }
        }
      }
    }
  };

  const handleBiometricAuth = async () => {
    if (scanning || countdown > 0) return;
    setScanning(true);
    setErrorMsg('');

    try {
      if (!window.PublicKeyCredential) {
        throw new Error("Biometric not supported");
      }

      const savedCredId = localStorage.getItem('fluid_webauthn_id');
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      if (!savedCredId) {
        const userId = new Uint8Array(16);
        window.crypto.getRandomValues(userId);
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: "Fluid Finance", id: window.location.hostname },
            user: { id: userId, name: "user@fluid.app", displayName: "Fluid User" },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
            authenticatorSelection: { userVerification: "required" },
            timeout: 60000,
            attestation: "none"
          }
        });
        if (credential) {
          const rawId = Array.from(new Uint8Array(credential.rawId));
          localStorage.setItem('fluid_webauthn_id', JSON.stringify(rawId));
          setTimeout(() => onAuth(), 500);
        }
      } else {
        const credIdArray = JSON.parse(savedCredId);
        const credId = new Uint8Array(credIdArray);
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            rpId: window.location.hostname,
            allowCredentials: [{ type: "public-key", id: credId }],
            userVerification: "required",
            timeout: 60000
          }
        });
        if (assertion) {
          setTimeout(() => onAuth(), 500);
        }
      }
    } catch (err) {
      console.warn("Biometric Error:", err);
      if (err.name === 'NotAllowedError') {
         setErrorMsg("Operation cancelled.");
         setTimeout(() => setErrorMsg(''), 2500);
      } else {
         // Fallback for demo
         setErrorMsg("Bypass: simulated login...");
         setTimeout(() => onAuth(), 1500);
      }
      setScanning(false);
    }
  };

  const getPromptText = () => {
     if (countdown > 0) return t('pin_locked', { n: countdown });
     if (errorMsg) return errorMsg;
     if (scanning) return t('pin_bio_verify');
     if (mode === 'SETUP_1') return t('pin_welcome');
     if (mode === 'SETUP_2') return t('pin_confirm_setup');
     return t('pin_enter');
  };

  const handleForgotPassword = () => {
    if (window.confirm(t('pin_reset_confirm'))) {
       removePin();
       localStorage.removeItem('fluid_webauthn_id');
       setMode('SETUP_1');
       setPinState('');
       setTempPin('');
       setErrorMsg(t('pin_reset_ok'));
       setTimeout(() => setErrorMsg(''), 2500);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="absolute inset-0 z-[200] flex flex-col items-center justify-between py-16 px-6 backdrop-blur-3xl bg-obsidian/95"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#00FFAA]/5 to-transparent pointer-events-none"></div>
      
      <div className="flex flex-col items-center mt-6 relative z-10 w-full">
        <div className="w-16 h-16 rounded-[20px] shadow-[0_0_30px_rgba(0,255,170,0.2)] mb-10 relative group overflow-hidden border border-white/10">
           <img src="/fluid-icon.png" alt="Fluid Logo" className="w-full h-full object-cover rounded-[20px]" />
        </div>
        
        <div className="flex gap-5 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <motion.div 
              key={i} 
              animate={{ 
                scale: pin.length > i ? [1, 1.2, 1] : 1, 
                backgroundColor: pin.length > i ? '#00FFAA' : 'rgba(255,255,255,0.1)' 
              }}
              transition={{ duration: 0.2 }}
              className="w-3.5 h-3.5 rounded-full"
              style={{ boxShadow: pin.length > i ? '0 0 15px rgba(0,255,170,0.6)' : 'none' }}
            />
          ))}
        </div>

        <p className={`text-[11px] tracking-widest uppercase font-medium h-4 ${errorMsg || countdown > 0 ? 'text-red-400' : 'text-white/40'}`}>
          {getPromptText()}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-x-8 gap-y-7 w-full max-w-[280px] mb-6 relative z-10">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button 
            key={num} 
            onClick={() => handleKeyPress(num.toString())}
            className="w-16 h-16 mx-auto rounded-full glass-panel bg-white/[0.03] border border-white/5 text-2xl font-light text-white flex items-center justify-center hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all outline-none"
          >
            {num}
          </button>
        ))}
        
        <button 
          onClick={handleBiometricAuth}
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-[#00FFAA] hover:bg-[#00FFAA]/10 active:scale-95 transition-transform outline-none"
        >
          {scanning ? (
             <ShieldCheck size={28} className="animate-pulse drop-shadow-[0_0_10px_rgba(0,255,170,0.8)]" />
          ) : (
             <Fingerprint size={30} />
          )}
        </button>
        
        <button 
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 mx-auto rounded-full glass-panel bg-white/[0.03] border border-white/5 text-2xl font-light text-white flex items-center justify-center hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all outline-none"
        >
          0
        </button>
        
        <button 
          onClick={() => handleKeyPress('delete')}
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white/30 hover:text-white active:scale-95 transition-all text-2xl outline-none"
        >
          ⌫
        </button>
      </div>

      <AnimatePresence>
        {mode === 'LOGIN' && (
          <motion.button
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            onClick={handleForgotPassword}
            className="mt-2 mb-4 text-[11px] font-medium text-white/30 hover:text-white/70 active:scale-95 transition-all outline-none tracking-wide"
          >
            {t('pin_forgot')}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main App ───
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('fluid_session_auth') === 'true');
  const [[currentScreen, direction], setScreenState] = useState(['dashboard', 0]);
  const [toast, setToast] = useState(null);
  const [settings, setSettingsState] = useState(() => {
    initStore();
    return getSettings();
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Keep i18n in sync
  useEffect(() => {
    setLanguage(settings.language || 'fr');
  }, [settings.language]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
         sessionStorage.setItem('fluid_last_hidden', Date.now().toString());
      } else {
         const lastHidden = sessionStorage.getItem('fluid_last_hidden');
         if (lastHidden) {
            const timeDiff = Date.now() - parseInt(lastHidden, 10);
            if (timeDiff > 2000) {
               setIsAuthenticated(false);
               sessionStorage.removeItem('fluid_session_auth');
            }
         }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('fluid_session_auth', 'true');
    sessionStorage.removeItem('fluid_last_hidden');
  };

  const navTo = (newScreen) => {
    if (newScreen === currentScreen) return;
    const currentIdx = SCREEN_ORDER[currentScreen] ?? 0;
    const newIdx = SCREEN_ORDER[newScreen] ?? 0;
    const newDirection = newIdx > currentIdx ? 1 : -1;
    setScreenState([newScreen, newDirection]);
  };

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const updateSettings = useCallback((key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettingsState(newSettings);
    saveSettings(newSettings);
    if (key === 'language') {
      setLanguage(value);
      setRefreshKey(k => k + 1);
    }
  }, [settings]);

  const refreshData = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Streak system with notifications
  useEffect(() => {
    if (isAuthenticated) {
      const now = new Date();
      if (now.getHours() >= 8) {
        let streakData = getStreak();
        
        const lastDate = new Date(streakData.lastUpdate);
        lastDate.setHours(0,0,0,0);
        const today = new Date(now);
        today.setHours(0,0,0,0);
        
        const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        
        if (streakData.lastUpdate === 0 || diffDays > 1) {
          streakData = { count: 1, lastUpdate: now.getTime() };
          showToast(t('toast_streak_start'), 'success');
          sendSystemNotification(t('toast_streak_start'));
        } else if (diffDays === 1) {
          streakData.count += 1;
          streakData.lastUpdate = now.getTime();
          showToast(t('toast_streak', { n: streakData.count }), 'success');
          sendSystemNotification(t('toast_streak', { n: streakData.count }));
        }
        saveStreak(streakData);
      }
    }
  }, [isAuthenticated, showToast]);

  // Send system notification
  const sendSystemNotification = (body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Fluid Finance', {
          body,
          icon: '/fluid-icon.png',
          badge: '/fluid-icon.png',
        });
      } catch(e) {}
    }
  };

  const themeClasses = [
    'bg-obsidian liquid-bg',
    'bg-black',
    'bg-gradient-to-br from-orange-950 to-black',
    'bg-gradient-to-br from-indigo-950 to-black',
    'bg-gradient-to-br from-rose-950 to-black'
  ];

  const currentThemeClass = themeClasses[settings.themeIndex % themeClasses.length];

  const contextValue = {
    settings,
    updateSettings,
    showToast,
    navTo,
    refreshData,
    refreshKey,
    t,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div key={refreshKey} className={`w-full h-[100dvh] text-white font-sans sm:max-w-[420px] sm:mx-auto overflow-hidden sm:border sm:border-white/10 sm:rounded-[3rem] sm:h-[900px] sm:my-8 shadow-2xl relative transition-colors duration-1000 ${currentThemeClass}`}>
        
        <AnimatePresence>
          {!isAuthenticated && <AuthScreen key="auth" onAuth={handleAuthSuccess} lang={settings.language} />}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <Toast 
              key="toast" 
              message={toast.message} 
              type={toast.type} 
              onDismiss={() => setToast(null)} 
            />
          )}
        </AnimatePresence>

        {isAuthenticated && (
          <>
            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
              {currentScreen === 'dashboard' && <Dashboard key="dashboard" direction={direction} deferredPrompt={deferredPrompt} />}
              {currentScreen === 'analytics' && <Analytics key="analytics" direction={direction} />}
              {currentScreen === 'scanner' && <Scanner key="scanner" direction={direction} />}
              {currentScreen === 'profile' && <Profile key="profile" direction={direction} />}
              {currentScreen === 'budget' && <Budget key="budget" direction={direction} />}
              {currentScreen === 'confirmation' && <Confirmation key="confirmation" direction={direction} />}
            </AnimatePresence>
            
            {currentScreen !== 'confirmation' && (
              <NavBar current={currentScreen} navTo={navTo} />
            )}
          </>
        )}
      </div>
    </AppContext.Provider>
  );
}
