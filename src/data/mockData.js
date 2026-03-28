export const MOCK_ACCOUNTS = [
  {
    id: 'acc_1',
    name: 'Boursorama',
    type: 'Compte Courant',
    balance: 2450.75,
    logoUrl: '/banks/boursorama.png', // Fallbacks to short name
    shortName: 'B',
    color: 'from-pink-600 to-rose-500',
    borderColor: 'border-pink-500/30'
  },
  {
    id: 'acc_2',
    name: 'Revolut',
    type: 'Principal',
    balance: 1240.20,
    logoUrl: '/banks/revolut.png',
    shortName: 'R',
    color: 'from-blue-600 to-cyan-500',
    borderColor: 'border-cyan-500/30'
  },
  {
    id: 'acc_3',
    name: 'Caisse Epargne',
    type: 'Livret A',
    balance: 8500.00,
    logoUrl: '/banks/caisse.png',
    shortName: 'CE',
    color: 'from-red-600 to-orange-500',
    borderColor: 'border-red-500/30'
  }
];

export const MOCK_TRANSACTIONS = [
  {
    id: 'tx_1',
    accountId: 'acc_2', // Revolut
    title: 'Netflix',
    amount: -13.99,
    date: "Aujourd'hui",
    category: 'Loisirs',
    icon: 'Tv'
  },
  {
    id: 'tx_2',
    accountId: 'acc_1', // Boursorama
    title: 'Carrefour Market',
    amount: -84.50,
    date: 'Hier',
    category: 'Alimentation',
    icon: 'ShoppingCart'
  },
  {
    id: 'tx_3',
    accountId: 'acc_2', // Revolut
    title: 'Uber Eat',
    amount: -22.90,
    date: 'Hier',
    category: 'Restaurants',
    icon: 'Coffee'
  },
  {
    id: 'tx_4',
    accountId: 'acc_3', // Caisse Epargne
    title: 'Intérêts Livret A',
    amount: +125.00,
    date: 'Il y a 3 jours',
    category: 'Revenus',
    icon: 'ArrowDownLeft'
  },
  {
    id: 'tx_5',
    accountId: 'acc_1', // Boursorama
    title: 'Apple Store',
    amount: -99.00,
    date: 'Il y a 5 jours',
    category: 'High-Tech',
    icon: 'MonitorSmartphone'
  },
  {
    id: 'tx_6',
    accountId: 'acc_2', // Revolut
    title: 'Remboursement Spotify',
    amount: +10.99,
    date: 'Il y a 6 jours',
    category: 'Remboursement',
    icon: 'ArrowDownLeft'
  }
];
