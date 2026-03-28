// ─── Fluid Finance Store ─── localStorage-based persistence ───

const KEYS = {
  accounts: 'fluid_accounts',
  transactions: 'fluid_transactions',
  subscriptions: 'fluid_subscriptions',
  profile: 'fluid_profile',
  settings: 'fluid_settings',
  streak: 'fluid_streak',
  pin: 'fluid_user_pin',
  initialized: 'fluid_initialized',
};

// ─── Helpers ───
const load = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const genId = () => '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// ─── Defaults (empty on first launch) ───
const DEFAULT_PROFILE = {
  name: 'Utilisateur',
  avatarIndex: 3,
  avatarUrl: null,
};

const DEFAULT_SETTINGS = {
  language: 'fr',
  themeIndex: 0,
  notifications: false,
  biometric: true,
  currency: '€',
  monthlyBudget: 1500,
};

// ─── Initialize on first launch ───
export function initStore() {
  if (!load(KEYS.initialized)) {
    save(KEYS.accounts, []);
    save(KEYS.transactions, []);
    save(KEYS.subscriptions, []);
    save(KEYS.profile, DEFAULT_PROFILE);
    save(KEYS.settings, DEFAULT_SETTINGS);
    save(KEYS.initialized, true);
  }
}

// ─── Accounts ───
export function getAccounts() { return load(KEYS.accounts, []); }
export function saveAccounts(accounts) { save(KEYS.accounts, accounts); }
export function addAccount(account) {
  const accounts = getAccounts();
  const COLORS = [
    { color: 'from-pink-600 to-rose-500', borderColor: 'border-pink-500/30' },
    { color: 'from-blue-600 to-cyan-500', borderColor: 'border-cyan-500/30' },
    { color: 'from-red-600 to-orange-500', borderColor: 'border-red-500/30' },
    { color: 'from-purple-600 to-violet-500', borderColor: 'border-purple-500/30' },
    { color: 'from-emerald-600 to-green-500', borderColor: 'border-emerald-500/30' },
    { color: 'from-amber-600 to-yellow-500', borderColor: 'border-amber-500/30' },
    { color: 'from-teal-600 to-cyan-400', borderColor: 'border-teal-500/30' },
  ];
  const colorSet = COLORS[accounts.length % COLORS.length];
  const newAcc = {
    id: genId(),
    name: account.name,
    type: account.type || 'Compte Courant',
    balance: account.balance || 0,
    shortName: account.name.substring(0, 2).toUpperCase(),
    ...colorSet,
  };
  accounts.push(newAcc);
  save(KEYS.accounts, accounts);
  return newAcc;
}
export function updateAccount(id, updates) {
  const accounts = getAccounts().map(a => a.id === id ? { ...a, ...updates } : a);
  save(KEYS.accounts, accounts);
}
export function deleteAccount(id) {
  save(KEYS.accounts, getAccounts().filter(a => a.id !== id));
  // Also remove transactions for this account
  save(KEYS.transactions, getTransactions().filter(t => t.accountId !== id));
}

// ─── Transactions ───
export function getTransactions() { return load(KEYS.transactions, []); }
export function saveTransactions(txs) { save(KEYS.transactions, txs); }
export function addTransaction(tx) {
  const txs = getTransactions();
  const newTx = { id: genId(), date: new Date().toISOString().split('T')[0], ...tx };
  txs.unshift(newTx);
  save(KEYS.transactions, txs);
  // Update account balance
  const accounts = getAccounts();
  const acc = accounts.find(a => a.id === tx.accountId);
  if (acc) {
    acc.balance += tx.amount;
    save(KEYS.accounts, accounts);
  }
  return newTx;
}
export function deleteTransaction(id) {
  const txs = getTransactions();
  const tx = txs.find(t => t.id === id);
  if (tx) {
    // Reverse the balance change
    const accounts = getAccounts();
    const acc = accounts.find(a => a.id === tx.accountId);
    if (acc) {
      acc.balance -= tx.amount;
      save(KEYS.accounts, accounts);
    }
  }
  save(KEYS.transactions, txs.filter(t => t.id !== id));
}

// ─── Subscriptions ───
export function getSubscriptions() { return load(KEYS.subscriptions, []); }
export function addSubscription(sub) {
  const subs = getSubscriptions();
  subs.push({ id: genId(), ...sub });
  save(KEYS.subscriptions, subs);
}
export function deleteSubscription(id) {
  save(KEYS.subscriptions, getSubscriptions().filter(s => s.id !== id));
}

// ─── Profile ───
export function getProfile() { return load(KEYS.profile, DEFAULT_PROFILE); }
export function saveProfile(profile) { save(KEYS.profile, profile); }

// ─── Settings ───
export function getSettings() { return load(KEYS.settings, DEFAULT_SETTINGS); }
export function saveSettings(settings) { save(KEYS.settings, settings); }
export function getSetting(key) { return getSettings()[key]; }
export function setSetting(key, value) {
  const s = getSettings();
  s[key] = value;
  save(KEYS.settings, s);
}

// ─── Streak ───
export function getStreak() { return load(KEYS.streak, { count: 0, lastUpdate: 0 }); }
export function saveStreak(streak) { save(KEYS.streak, streak); }

// ─── PIN ───
export function getPin() { return localStorage.getItem(KEYS.pin); }
export function setPin(pin) { localStorage.setItem(KEYS.pin, pin); }
export function removePin() { localStorage.removeItem(KEYS.pin); }

// ─── Stats helpers ───
export function getTransactionsForMonth(year, month) {
  return getTransactions().filter(tx => {
    const d = new Date(tx.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function getCategoryTotals(transactions) {
  const cats = {};
  transactions.forEach(tx => {
    if (tx.amount < 0) {
      const cat = tx.category || 'Autres';
      cats[cat] = (cats[cat] || 0) + Math.abs(tx.amount);
    }
  });
  return Object.entries(cats)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}

export function getTotalExpenses(transactions) {
  return transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
}

export function getTotalIncome(transactions) {
  return transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
}

// ─── Categories ───
export const CATEGORIES = [
  { name: 'Alimentation', icon: 'ShoppingCart', color: 'var(--color-accent)' },
  { name: 'Transport', icon: 'Car', color: '#8B5CF6' },
  { name: 'Restaurants', icon: 'Coffee', color: '#F97316' },
  { name: 'Loisirs', icon: 'Gamepad2', color: '#EC4899' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#06B6D4' },
  { name: 'High-Tech', icon: 'MonitorSmartphone', color: '#3B82F6' },
  { name: 'Logement', icon: 'Home', color: '#EF4444' },
  { name: 'Santé', icon: 'Heart', color: '#10B981' },
  { name: 'Revenus', icon: 'ArrowDownLeft', color: '#22C55E' },
  { name: 'Remboursement', icon: 'ArrowDownLeft', color: '#14B8A6' },
  { name: 'Abonnements', icon: 'Repeat', color: '#A855F7' },
  { name: 'Autres', icon: 'MoreHorizontal', color: '#9CA3AF' },
];

export const BANK_COLORS = [
  { color: 'from-pink-600 to-rose-500', borderColor: 'border-pink-500/30' },
  { color: 'from-blue-600 to-cyan-500', borderColor: 'border-cyan-500/30' },
  { color: 'from-red-600 to-orange-500', borderColor: 'border-red-500/30' },
  { color: 'from-purple-600 to-violet-500', borderColor: 'border-purple-500/30' },
  { color: 'from-emerald-600 to-green-500', borderColor: 'border-emerald-500/30' },
  { color: 'from-amber-600 to-yellow-500', borderColor: 'border-amber-500/30' },
  { color: 'from-teal-600 to-cyan-400', borderColor: 'border-teal-500/30' },
];
