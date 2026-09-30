import { mockData } from '../data/mockData';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  kycStatus: string;
  wallet: number;
  status: string;
  joinDate: string;
  phone: string;
  location: string;
  role: string;
  loginHistory: Array<{ timestamp: string; ip: string; device: string; status: string }>;
  activityLog: Array<{ timestamp: string; action: string; detail: string }>;
  kycInfo: { idType: string; status: string; document: string; selfie: string; reason?: string };
  walletInfo: { balance: number; reserved: number; ledger: Array<{ id: string; type: string; amount: number; note: string; date: string; status?: string }> };
  transactions: TransactionRecord[];
}


export interface WalletLedgerItem {
  id: string;
  user: string;
  type: 'credit' | 'debit' | 'reversal' | 'adjustment';
  amount: number;
  note: string;
  date: string;
  status: string;
}

export interface TransactionRecord {
  id: string;
  user: string;
  userId: number;
  amount: number;
  type: string;
  provider: string;
  reference: string;
  status: string;
  date: string;
  time?: string;
  paymentMethod?: string;
  bank?: string;
  description?: string;
  category?: string;
  timeline: Array<{ title: string; detail: string; time: string }>;
  auditLogs: Array<{ action: string; actor: string; time: string }>;
}

export interface ProviderOption {
  id: string;
  name: string;
  sourcePrice: number;
  sellingPrice: number;
  enabled: boolean;
  status: 'Available' | 'Unavailable';
}

export interface ServiceItem {
  id: string;
  category: string;
  name: string;
  network: string;
  plan: string;
  description: string;
  provider: string;
  providerOptions: ProviderOption[];
  sellingPrice: number;
  displayPrice: number;
  margin: number;
  status: 'Active' | 'Disabled';
  availability: 'Available' | 'Hidden';
  popular: boolean;
  promo: boolean;
  discount: number;
  order: number;
}

export interface PaymentProvider {
  id: string;
  name: string;
  type: 'flutterwave' | 'paystack' | 'monnify';
  status: 'active' | 'inactive';
  supportsVirtualAccount: boolean;
  supportsCard: boolean;
  supportsBankTransfer: boolean;
  logo: string;
}

export interface BannerItem {
  id: string;
  title: string;
  image: string;
  active: boolean;
  order: number;
  startDate: string;
  endDate: string;
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'Push' | 'In-App' | 'Email' | 'SMS' | 'Broadcast';
  audience: string;
  preview: string;
  unread?: boolean;
}

export interface NotificationItem extends NotificationPayload {
  id: string;
  status: 'Sent' | 'Scheduled' | 'Draft';
  sentDate: string;
  unread: boolean;
}

export interface KycRecord {
  id: string;
  user: string;
  userId: number;
  idType: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Resubmission';
  submittedDate: string;
  approvedDate?: string | null;
  reason?: string;
  document: string;
  selfie: string;
  history: Array<{ action: string; actor: string; reason?: string; time: string }>;
}

export interface FraudRecord {
  suspiciousTransactions: Array<{ txnId: string; user: string; amount: number; riskScore: number; type: string; date: string }>;
  failedLogins: Array<{ user: string; ip: string; time: string }>;
  deviceHistory: Array<{ user: string; device: string; time: string; status: string }>;
  ipHistory: Array<{ user: string; ip: string; location: string; time: string }>;
}

const makeProviderOptions = (basePrice: number, enabledIds: string[] = ['aidapay', 'vtu']) => [
  { id: 'aidapay', name: 'Aidapay', sourcePrice: basePrice, sellingPrice: Math.round(basePrice * 1.08), enabled: enabledIds.includes('aidapay'), status: 'Available' as const },
  { id: 'vtu', name: 'VTU.ng', sourcePrice: Math.round(basePrice * 0.98), sellingPrice: Math.round(basePrice * 1.06), enabled: enabledIds.includes('vtu'), status: 'Available' as const },
  { id: 'vtugate', name: 'VTUgate.com', sourcePrice: Math.round(basePrice * 0.95), sellingPrice: Math.round(basePrice * 1.05), enabled: enabledIds.includes('vtugate'), status: 'Available' as const },
  { id: 'cheapdatahub', name: 'CheapDataHub', sourcePrice: Math.round(basePrice * 0.94), sellingPrice: Math.round(basePrice * 1.04), enabled: enabledIds.includes('cheapdatahub'), status: 'Available' as const },
];

const makeGiftCardProviderOptions = (basePrice: number, enabledIds: string[] = ['cardtonic', 'giftcardmall']) => [
  { id: 'cardtonic', name: 'Cardtonic', sourcePrice: basePrice, sellingPrice: Math.round(basePrice * 1.07), enabled: enabledIds.includes('cardtonic'), status: 'Available' as const },
  { id: 'giftcardmall', name: 'GiftCardMall', sourcePrice: Math.round(basePrice * 0.99), sellingPrice: Math.round(basePrice * 1.05), enabled: enabledIds.includes('giftcardmall'), status: 'Available' as const },
  { id: 'giftcardzen', name: 'GiftCardZen', sourcePrice: Math.round(basePrice * 0.96), sellingPrice: Math.round(basePrice * 1.06), enabled: enabledIds.includes('giftcardzen'), status: 'Available' as const },
  { id: 'cardverse', name: 'Cardverse', sourcePrice: Math.round(basePrice * 0.94), sellingPrice: Math.round(basePrice * 1.04), enabled: enabledIds.includes('cardverse'), status: 'Available' as const },
];

const createService = ({
  id,
  category,
  name,
  network,
  plan,
  description,
  provider,
  basePrice,
  enabledProviders = ['aidapay', 'vtu'],
  providerOptions,
  sellingPrice,
  order,
  popular = false,
  promo = false,
  discount = 0,
}: {
  id: string;
  category: string;
  name: string;
  network: string;
  plan: string;
  description: string;
  provider: string;
  basePrice: number;
  enabledProviders?: string[];
  providerOptions?: ProviderOption[];
  sellingPrice?: number;
  order: number;
  popular?: boolean;
  promo?: boolean;
  discount?: number;
}) => {
  const retailPrice = sellingPrice ?? Math.round(basePrice * 1.08);
  return {
    id,
    category,
    name,
    network,
    plan,
    description,
    provider,
    providerOptions: providerOptions ?? (category === 'Gift Cards' ? makeGiftCardProviderOptions(basePrice, enabledProviders) : makeProviderOptions(basePrice, enabledProviders)),
    sellingPrice: retailPrice,
    displayPrice: retailPrice,
    margin: retailPrice - basePrice,
    status: 'Active' as const,
    availability: 'Available' as const,
    popular,
    promo,
    discount,
    order,
  };
};

const createState = () => {
  const baseUsers: AdminUser[] = mockData.users.map((user, index) => ({
    ...user,
    role: index % 2 === 0 ? 'Customer' : 'Merchant',
    phone: `+23480${index + 100}000${index + 1}`,
    location: index % 2 === 0 ? 'Lagos' : 'Abuja',
    loginHistory: [
      { timestamp: '2026-01-05 09:10', ip: '192.168.0.1', device: 'iPhone 14', status: 'Success' },
      { timestamp: '2026-01-04 18:02', ip: '192.168.0.2', device: 'Android', status: 'Success' },
    ],
    activityLog: [
      { timestamp: '2026-01-05', action: 'Wallet topped up', detail: 'Manual top-up via admin' },
      { timestamp: '2026-01-04', action: 'Purchased airtime', detail: 'MTN recharge' },
    ],
    kycInfo: {
      idType: user.kycStatus === 'Verified' ? 'National ID' : 'Passport',
      status: user.kycStatus as 'Verified' | 'Pending' | 'Rejected',
      document: '/docs/id.pdf',
      selfie: '/docs/selfie.jpg',
      reason: user.kycStatus === 'Rejected' ? 'Document mismatch' : undefined,
    },
    walletInfo: {
      balance: user.wallet,
      reserved: user.wallet > 1000 ? 200 : 0,
      ledger: [
        { id: `L${index + 1}`, type: 'credit', amount: user.wallet, note: 'Initial wallet balance', date: '2026-01-01' },
      ],
    },
    transactions: [
      { id: `TX${index + 1}`, user: user.name, userId: user.id, amount: 500, type: 'Airtime', provider: 'MTN', reference: `REF-${index + 100}`, status: 'Successful', date: '2026-01-05', time: '09:05', paymentMethod: 'Wallet', bank: 'N/A', description: 'Initial sample transaction', category: 'Airtime', timeline: [{ title: 'Initiated', detail: 'Transaction created', time: '2026-01-05 09:00' }, { title: 'Provider response', detail: 'Accepted', time: '2026-01-05 09:02' }], auditLogs: [{ action: 'Settled', actor: 'System', time: '2026-01-05 09:10' }] },
    ],
  }));

  const baseTransactions: TransactionRecord[] = mockData.transactions.map((txn, index) => ({
    ...txn,
    userId: index + 1,
    provider: index % 2 === 0 ? 'MTN' : 'Airtel',
    reference: `REF-${index + 100}`,
    timeline: [
      { title: 'Initiated', detail: 'Transaction created', time: '2026-01-05 09:00' },
      { title: 'Provider response', detail: 'Accepted', time: '2026-01-05 09:02' },
    ],
    auditLogs: [
      { action: 'Pending review', actor: 'System', time: '2026-01-05 09:00' },
    ],
  }));

  const baseLedger: WalletLedgerItem[] = [
    { id: 'WAL001', user: 'Jane Doe', type: 'credit', amount: 1000, note: 'Manual credit', date: '2026-01-05', status: 'Completed' },
    { id: 'WAL002', user: 'John Smith', type: 'debit', amount: 500, note: 'Debit for failed purchase', date: '2026-01-04', status: 'Completed' },
    { id: 'WAL003', user: 'Alice Johnson', type: 'reversal', amount: 200, note: 'Reversed duplicate charge', date: '2026-01-03', status: 'Pending' },
  ];

  const paymentProviders: PaymentProvider[] = [
    { id: 'flutterwave', name: 'Flutterwave', type: 'flutterwave', status: 'active', supportsVirtualAccount: true, supportsCard: true, supportsBankTransfer: true, logo: 'https://via.placeholder.com/40?text=FW' },
    { id: 'paystack', name: 'Paystack', type: 'paystack', status: 'inactive', supportsVirtualAccount: false, supportsCard: true, supportsBankTransfer: false, logo: 'https://via.placeholder.com/40?text=PS' },
    { id: 'monnify', name: 'Monnify', type: 'monnify', status: 'inactive', supportsVirtualAccount: true, supportsCard: false, supportsBankTransfer: true, logo: 'https://via.placeholder.com/40?text=MN' },
  ];



  const baseServices: ServiceItem[] = [
    createService({ id: 'SVC001', category: 'Data', name: 'MTN Data', network: 'MTN', plan: '1GB', description: '1GB data bundle for light browsing', provider: 'Aidapay', basePrice: 280, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 300, order: 1, popular: true, promo: true, discount: 10 }),
    createService({ id: 'SVC002', category: 'Data', name: 'MTN Data', network: 'MTN', plan: '2GB', description: '2GB data bundle for everyday use', provider: 'VTU.ng', basePrice: 520, enabledProviders: ['aidapay', 'vtu', 'cheapdatahub'], sellingPrice: 560, order: 2 }),
    createService({ id: 'SVC003', category: 'Data', name: 'MTN Data', network: 'MTN', plan: '3GB', description: '3GB data bundle for regular streaming', provider: 'Aidapay', basePrice: 780, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 820, order: 3 }),
    createService({ id: 'SVC004', category: 'Data', name: 'MTN Data', network: 'MTN', plan: '4GB', description: '4GB data bundle for video and browsing', provider: 'VTUgate.com', basePrice: 980, enabledProviders: ['aidapay', 'vtu', 'vtugate'], sellingPrice: 1010, order: 4 }),
    createService({ id: 'SVC005', category: 'Data', name: 'MTN Data', network: 'MTN', plan: '5GB', description: '5GB data bundle for larger usage', provider: 'CheapDataHub', basePrice: 1200, enabledProviders: ['vtu', 'vtugate', 'cheapdatahub'], sellingPrice: 1260, order: 5, popular: true }),
    createService({ id: 'SVC006', category: 'Data', name: 'GLO Data', network: 'GLO', plan: '1GB', description: '1GB GLO bundle for browsing', provider: 'Aidapay', basePrice: 290, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 310, order: 6 }),
    createService({ id: 'SVC007', category: 'Data', name: 'GLO Data', network: 'GLO', plan: '2GB', description: '2GB GLO bundle for video and browsing', provider: 'VTU.ng', basePrice: 560, enabledProviders: ['aidapay', 'vtu', 'cheapdatahub'], sellingPrice: 600, order: 7 }),
    createService({ id: 'SVC008', category: 'Data', name: 'GLO Data', network: 'GLO', plan: '3GB', description: '3GB GLO bundle for streaming', provider: 'CheapDataHub', basePrice: 850, enabledProviders: ['aidapay', 'vtu', 'cheapdatahub'], sellingPrice: 900, order: 8 }),
    createService({ id: 'SVC009', category: 'Data', name: 'GLO Data', network: 'GLO', plan: '5GB', description: '5GB GLO bundle for heavy usage', provider: 'CheapDataHub', basePrice: 1280, enabledProviders: ['vtu', 'vtugate', 'cheapdatahub'], sellingPrice: 1340, order: 9 }),
    createService({ id: 'SVC010', category: 'Data', name: 'Airtel Data', network: 'Airtel', plan: '1GB', description: '1GB Airtel data bundle', provider: 'Aidapay', basePrice: 300, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 320, order: 10 }),
    createService({ id: 'SVC011', category: 'Data', name: 'Airtel Data', network: 'Airtel', plan: '2GB', description: '2GB Airtel data bundle', provider: 'VTU.ng', basePrice: 580, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 620, order: 11 }),
    createService({ id: 'SVC012', category: 'Data', name: 'Airtel Data', network: 'Airtel', plan: '3GB', description: '3GB Airtel bundle for extra browsing', provider: 'VTUgate.com', basePrice: 880, enabledProviders: ['vtu', 'vtugate'], sellingPrice: 920, order: 12 }),
    createService({ id: 'SVC013', category: 'Data', name: 'Airtel Data', network: 'Airtel', plan: '5GB', description: '5GB Airtel bundle for larger usage', provider: 'VTUgate.com', basePrice: 1320, enabledProviders: ['vtu', 'vtugate'], sellingPrice: 1380, order: 13 }),
    createService({ id: 'SVC014', category: 'Data', name: '9mobile Data', network: '9mobile', plan: '1GB', description: '1GB 9mobile bundle', provider: 'VTU.ng', basePrice: 310, enabledProviders: ['vtu', 'cheapdatahub'], sellingPrice: 330, order: 14 }),
    createService({ id: 'SVC015', category: 'Data', name: '9mobile Data', network: '9mobile', plan: '2GB', description: '2GB 9mobile data bundle', provider: 'CheapDataHub', basePrice: 590, enabledProviders: ['vtu', 'cheapdatahub'], sellingPrice: 630, order: 15 }),
    createService({ id: 'SVC016', category: 'Data', name: '9mobile Data', network: '9mobile', plan: '3GB', description: '3GB 9mobile bundle', provider: 'VTUgate.com', basePrice: 890, enabledProviders: ['vtu', 'vtugate', 'cheapdatahub'], sellingPrice: 930, order: 16 }),
    createService({ id: 'SVC017', category: 'Data', name: '9mobile Data', network: '9mobile', plan: '5GB', description: '5GB 9mobile bundle', provider: 'VTUgate.com', basePrice: 1350, enabledProviders: ['vtugate', 'cheapdatahub'], sellingPrice: 1400, order: 17 }),
    createService({ id: 'SVC018', category: 'Awoof Data', name: 'MTN Awoof', network: 'MTN', plan: '1GB', description: 'MTN awoof plan for social browsing', provider: 'VTU.ng', basePrice: 250, enabledProviders: ['aidapay', 'vtu', 'cheapdatahub'], sellingPrice: 270, order: 18, popular: true, promo: true, discount: 8 }),
    createService({ id: 'SVC019', category: 'Awoof Data', name: 'MTN Awoof', network: 'MTN', plan: '2GB', description: 'MTN awoof plan for moderate use', provider: 'Aidapay', basePrice: 480, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 510, order: 19 }),
    createService({ id: 'SVC020', category: 'Awoof Data', name: 'Airtel Awoof', network: 'Airtel', plan: '1GB', description: 'Airtel awoof plan for light users', provider: 'VTUgate.com', basePrice: 270, enabledProviders: ['vtu', 'vtugate'], sellingPrice: 300, order: 20 }),
    createService({ id: 'SVC021', category: 'Awoof Data', name: 'Airtel Awoof', network: 'Airtel', plan: '2GB', description: 'Airtel awoof bundle for moderate usage', provider: 'Aidapay', basePrice: 520, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 560, order: 21 }),
    createService({ id: 'SVC022', category: 'Awoof Data', name: 'GLO Awoof', network: 'GLO', plan: '2GB', description: 'GLO awoof plan for social subscriptions', provider: 'Aidapay', basePrice: 280, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 300, order: 22 }),
    createService({ id: 'SVC023', category: 'Awoof Data', name: 'GLO Awoof', network: 'GLO', plan: '5GB', description: 'GLO 5GB awoof bundle', provider: 'VTUgate.com', basePrice: 870, enabledProviders: ['vtu', 'vtugate'], sellingPrice: 910, order: 23 }),
    createService({ id: 'SVC024', category: 'Airtime', name: 'MTN Airtime', network: 'MTN', plan: '₦100', description: '100 naira airtime recharge', provider: 'Aidapay', basePrice: 89, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 100, order: 24 }),
    createService({ id: 'SVC025', category: 'Airtime', name: 'MTN Airtime', network: 'MTN', plan: '₦200', description: '200 naira airtime recharge', provider: 'VTU.ng', basePrice: 189, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 200, order: 25 }),
    createService({ id: 'SVC026', category: 'Airtime', name: 'MTN Airtime', network: 'MTN', plan: '₦500', description: '500 naira airtime recharge', provider: 'Aidapay', basePrice: 470, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 500, order: 26 }),
    createService({ id: 'SVC027', category: 'Airtime', name: 'Airtel Airtime', network: 'Airtel', plan: '₦100', description: '100 naira Airtel top-up', provider: 'VTU.ng', basePrice: 90, enabledProviders: ['vtu', 'vtugate'], sellingPrice: 100, order: 27 }),
    createService({ id: 'SVC028', category: 'Airtime', name: 'Airtel Airtime', network: 'Airtel', plan: '₦200', description: '200 naira Airtel top-up', provider: 'Aidapay', basePrice: 190, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 200, order: 28 }),
    createService({ id: 'SVC029', category: 'Airtime', name: '9mobile Airtime', network: '9mobile', plan: '₦200', description: '200 naira 9mobile top-up', provider: 'CheapDataHub', basePrice: 188, enabledProviders: ['cheapdatahub', 'vtu'], sellingPrice: 200, order: 29 }),
    createService({ id: 'SVC030', category: 'Gift Cards', name: 'Amazon Gift Card', network: 'Amazon', plan: '$25', description: 'Amazon gift card resale with provider rate management', provider: 'Cardtonic', basePrice: 25000, enabledProviders: ['cardtonic', 'giftcardmall'], sellingPrice: 26000, order: 30, popular: true, promo: true, discount: 5 }),
    createService({ id: 'SVC031', category: 'Gift Cards', name: 'Amazon Gift Card', network: 'Amazon', plan: '$50', description: 'Amazon gift card resale for larger purchases', provider: 'GiftCardMall', basePrice: 50000, enabledProviders: ['cardtonic', 'giftcardmall', 'giftcardzen'], sellingPrice: 52000, order: 31 }),
    createService({ id: 'SVC032', category: 'Gift Cards', name: 'Amazon Gift Card', network: 'Amazon', plan: '$100', description: 'Amazon gift card resale for premium purchases', provider: 'GiftCardZen', basePrice: 100000, enabledProviders: ['giftcardmall', 'giftcardzen'], sellingPrice: 104000, order: 32 }),
    createService({ id: 'SVC033', category: 'Gift Cards', name: 'Google Play Card', network: 'Google Play', plan: '$10', description: 'Google Play gift card for app purchases', provider: 'Cardverse', basePrice: 11000, enabledProviders: ['cardverse', 'cardtonic'], sellingPrice: 11500, order: 33 }),
    createService({ id: 'SVC034', category: 'Gift Cards', name: 'Google Play Card', network: 'Google Play', plan: '$25', description: 'Google Play gift card for games and apps', provider: 'Cardtonic', basePrice: 26500, enabledProviders: ['cardtonic', 'giftcardmall'], sellingPrice: 27800, order: 34 }),
    createService({ id: 'SVC035', category: 'Gift Cards', name: 'Google Play Card', network: 'Google Play', plan: '$50', description: 'Google Play gift card for larger app bundles', provider: 'GiftCardMall', basePrice: 52000, enabledProviders: ['giftcardmall', 'cardverse'], sellingPrice: 53800, order: 35 }),
    createService({ id: 'SVC036', category: 'Gift Cards', name: 'Apple Gift Card', network: 'Apple', plan: '$15', description: 'Apple gift card for App Store purchases', provider: 'GiftCardZen', basePrice: 15000, enabledProviders: ['giftcardzen', 'cardtonic'], sellingPrice: 15500, order: 36 }),
    createService({ id: 'SVC037', category: 'Gift Cards', name: 'Apple Gift Card', network: 'Apple', plan: '$25', description: 'Apple gift card for premium App Store items', provider: 'Cardtonic', basePrice: 25000, enabledProviders: ['cardtonic', 'giftcardzen'], sellingPrice: 26000, order: 37 }),
    createService({ id: 'SVC038', category: 'Gift Cards', name: 'Apple Gift Card', network: 'Apple', plan: '$50', description: 'Apple gift card for app subscriptions and media', provider: 'GiftCardMall', basePrice: 52000, enabledProviders: ['cardtonic', 'giftcardmall'], sellingPrice: 54000, order: 38 }),
    createService({ id: 'SVC039', category: 'Gift Cards', name: 'Steam Wallet Code', network: 'Steam', plan: '$20', description: 'Steam wallet code for game purchases', provider: 'Cardverse', basePrice: 20000, enabledProviders: ['cardverse', 'giftcardzen'], sellingPrice: 20600, order: 39 }),
    createService({ id: 'SVC040', category: 'Gift Cards', name: 'Steam Wallet Code', network: 'Steam', plan: '$50', description: 'Steam wallet code for premium bundles', provider: 'GiftCardMall', basePrice: 50000, enabledProviders: ['giftcardmall', 'cardverse'], sellingPrice: 51500, order: 40 }),
    createService({ id: 'SVC041', category: 'Gift Cards', name: 'Netflix Gift Card', network: 'Netflix', plan: '$10', description: 'Netflix gift card for subscription payments', provider: 'Cardtonic', basePrice: 11000, enabledProviders: ['cardtonic', 'giftcardmall'], sellingPrice: 11500, order: 41 }),
    createService({ id: 'SVC042', category: 'Gift Cards', name: 'Netflix Gift Card', network: 'Netflix', plan: '$25', description: 'Netflix gift card for longer subscription access', provider: 'GiftCardZen', basePrice: 26000, enabledProviders: ['giftcardzen', 'giftcardmall'], sellingPrice: 27300, order: 42 }),
    createService({ id: 'SVC043', category: 'Electricity', name: 'IKEDC Token', network: 'IKEDC', plan: 'Postpaid', description: 'Electricity token purchase', provider: 'VTU.ng', basePrice: 5000, enabledProviders: ['vtu', 'vtugate'], sellingPrice: 5150, order: 43 }),
    createService({ id: 'SVC044', category: 'Electricity', name: 'EEDC Token', network: 'EEDC', plan: 'Postpaid', description: 'Electricity token purchase for EEDC', provider: 'VTUgate.com', basePrice: 5200, enabledProviders: ['vtu', 'vtugate'], sellingPrice: 5340, order: 44 }),
    createService({ id: 'SVC045', category: 'Electricity', name: 'AEDC Token', network: 'AEDC', plan: 'Postpaid', description: 'Electricity token for AEDC', provider: 'Aidapay', basePrice: 5300, enabledProviders: ['aidapay', 'cheapdatahub'], sellingPrice: 5450, order: 45 }),
    createService({ id: 'SVC046', category: 'Electricity', name: 'KEDCO Token', network: 'KEDCO', plan: 'Postpaid', description: 'Electricity token for KEDCO', provider: 'VTU.ng', basePrice: 5400, enabledProviders: ['vtu', 'cheapdatahub'], sellingPrice: 5560, order: 46 }),
    createService({ id: 'SVC047', category: 'Education', name: 'JAMB E-pin', network: 'JAMB', plan: 'UTME', description: 'Exam pin for JAMB', provider: 'VTU.ng', basePrice: 3500, enabledProviders: ['vtu', 'aidapay'], sellingPrice: 3800, order: 47, popular: true }),
    createService({ id: 'SVC048', category: 'Education', name: 'WAEC Scratch Card', network: 'WAEC', plan: 'Scratch Card', description: 'WAEC examination voucher', provider: 'Aidapay', basePrice: 4200, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 4500, order: 48 }),
    createService({ id: 'SVC049', category: 'Education', name: 'NECO Scratch Card', network: 'NECO', plan: 'Scratch Card', description: 'NECO examination voucher', provider: 'VTUgate.com', basePrice: 4000, enabledProviders: ['vtu', 'vtugate'], sellingPrice: 4300, order: 49 }),
    createService({ id: 'SVC050', category: 'Education', name: 'GCE Scratch Card', network: 'GCE', plan: 'Scratch Card', description: 'GCE examination voucher', provider: 'CheapDataHub', basePrice: 3900, enabledProviders: ['cheapdatahub', 'vtu'], sellingPrice: 4200, order: 50 }),
    createService({ id: 'SVC051', category: 'Education', name: 'Post-UTME Pin', network: 'PostUTME', plan: 'Pin', description: 'Post-UTME registration pin', provider: 'Aidapay', basePrice: 2400, enabledProviders: ['aidapay', 'vtu'], sellingPrice: 2600, order: 51 }),
    createService({ id: 'SVC052', category: 'Digital Subscriptions', name: 'Netflix Standard', network: 'Netflix', plan: 'Standard', description: 'Monthly Netflix subscription', provider: 'Aidapay', basePrice: 5000, enabledProviders: ['aidapay', 'vtugate'], sellingPrice: 5500, order: 52 }),
    createService({ id: 'SVC053', category: 'Data to Cash', name: 'Data to Cash', network: 'MTN', plan: 'Flexible', description: 'Convert unused data to cash', provider: 'VTU.ng', basePrice: 850, enabledProviders: ['vtu', 'cheapdatahub'], sellingPrice: 900, order: 53 }),
  ];

  const baseBanners: BannerItem[] = [
    { id: 'BN001', title: 'New Year Promo', image: '/images/banner1.jpg', active: true, order: 1, startDate: '2026-01-01', endDate: '2026-01-31' },
    { id: 'BN002', title: 'Gift Card Offer', image: '/images/banner2.jpg', active: true, order: 2, startDate: '2026-01-05', endDate: '2026-01-15' },
  ];

  const baseNotifications: NotificationItem[] = [
    { id: 'NT001', title: 'Glo 2GB', message: 'Get GLO 2GB for ₦300 today', type: 'Push', audience: 'All Users', preview: 'In-app popup', status: 'Sent', sentDate: '2026-01-05', unread: false },
    { id: 'NT002', title: 'MTN SME Data', message: 'MTN SME data is back', type: 'In-App', audience: 'Active Users', preview: 'Banner', status: 'Scheduled', sentDate: '2026-01-06', unread: false },
  ];

  const baseKyc: KycRecord[] = mockData.kyc.map((item, index) => ({
    ...item,
    userId: index + 1,
    status: item.status as KycRecord['status'],
    document: '/docs/id.pdf',
    selfie: '/docs/selfie.jpg',
    history: [{ action: item.status === 'Approved' ? 'Approved' : item.status === 'Rejected' ? 'Rejected' : 'Submitted', actor: 'Admin', time: item.submittedDate }],
  }));

  const baseFraud: FraudRecord = {
    suspiciousTransactions: [
      { txnId: 'TXN456', user: 'Unknown', amount: 50000, riskScore: 95, type: 'Unusual Pattern', date: '2026-01-05' },
      { txnId: 'TXN457', user: 'User-123', amount: 100000, riskScore: 88, type: 'High Value', date: '2026-01-05' },
    ],
    failedLogins: [
      { user: 'User-123', ip: '192.168.0.50', time: '2026-01-05 09:09' },
      { user: 'User-456', ip: '203.0.113.10', time: '2026-01-05 07:44' },
    ],
    deviceHistory: [
      { user: 'Jane Doe', device: 'iPhone 14', time: '2026-01-05', status: 'Active' },
      { user: 'John Smith', device: 'Samsung S21', time: '2026-01-04', status: 'Flagged' },
    ],
    ipHistory: [
      { user: 'Jane Doe', ip: '192.168.0.1', location: 'Lagos', time: '2026-01-05' },
      { user: 'John Smith', ip: '203.0.113.10', location: 'Abuja', time: '2026-01-05' },
    ],
  };

  return { users: baseUsers, transactions: baseTransactions, ledger: baseLedger, services: baseServices, banners: baseBanners, notifications: baseNotifications, kyc: baseKyc, fraud: baseFraud };
};

const state = createState();

const wait = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const adminMockService = {
  async fetchUsers() { await wait(); return state.users; },
  async fetchUser(userId: number) { await wait(); return state.users.find((u) => u.id === userId) ?? null; },
  async updateUserAction(userId: number, action: string) {
    await wait();
    const user = state.users.find((u) => u.id === userId);
    if (!user) return null;
    if (action === 'freeze') user.status = 'Frozen';
    if (action === 'unfreeze') user.status = 'Active';
    if (action === 'suspend') user.status = 'Suspended';
    if (action === 'activate') user.status = 'Active';
    if (action === 'delete') user.status = 'Deleted';
    return user;
  },
  async creditWallet(userId: number, amount: number, reason: string) {
    await wait();
    const user = state.users.find((u) => u.id === userId);
    if (!user) return null;
    user.wallet += amount;
    user.walletInfo.balance = user.wallet;
    user.walletInfo.ledger.unshift({ id: `L${Date.now()}`, type: 'credit', amount, note: reason, date: new Date().toISOString().slice(0, 10) });
    return user;
  },
  async debitWallet(userId: number, amount: number, reason: string) {
    await wait();
    const user = state.users.find((u) => u.id === userId);
    if (!user) return null;
    user.wallet = Math.max(0, user.wallet - amount);
    user.walletInfo.balance = user.wallet;
    user.walletInfo.ledger.unshift({ id: `L${Date.now()}`, type: 'debit', amount, note: reason, date: new Date().toISOString().slice(0, 10) });
    return user;
  },
  async resetPin(userId: number) { await wait(); return state.users.find((u) => u.id === userId) ?? null; },
  async resetPassword(userId: number) { await wait(); return state.users.find((u) => u.id === userId) ?? null; },
  async fetchWalletLedger() { await wait(); return state.ledger; },
  async addWalletLedger(entry: WalletLedgerItem) { await wait(); state.ledger.unshift(entry); return entry; },
  async fetchTransactions() { await wait(); return state.transactions; },
  async updateTransaction(txnId: string, action: string) {
    await wait();
    const txn = state.transactions.find((item) => item.id === txnId);
    if (!txn) return null;
    if (action === 'reverse') txn.status = 'Reversed';
    if (action === 'retry') txn.status = 'Pending';
    if (action === 'refund') txn.status = 'Refunded';
    if (action === 'approve') txn.status = 'Successful';
    if (action === 'reject') txn.status = 'Rejected';
    return txn;
  },
  async fetchServices() { await wait(); return state.services; },
  async createService(service: ServiceItem) { await wait(); state.services.unshift(service); return service; },
  async updateService(serviceId: string, updates: Partial<ServiceItem>) { await wait(); const service = state.services.find((item) => item.id === serviceId); if (!service) return null; Object.assign(service, updates); return service; },
  async deleteService(serviceId: string) { await wait(); state.services = state.services.filter((item) => item.id !== serviceId); return true; },
  async fetchBanners() { await wait(); return state.banners; },
  async updateBanner(bannerId: string, updates: Partial<BannerItem>) { await wait(); const banner = state.banners.find((item) => item.id === bannerId); if (!banner) return null; Object.assign(banner, updates); return banner; },
  async fetchNotifications() { await wait(); return state.notifications; },
  async createNotification(payload: NotificationPayload) { await wait(); const notification: NotificationItem = { ...payload, id: `NT${Date.now()}`, status: 'Sent', sentDate: new Date().toISOString().slice(0, 10), unread: true }; state.notifications.unshift(notification); return notification; },
  async fetchKyc() { await wait(); return state.kyc; },
  async updateKyc(kycId: string, action: 'approve' | 'reject' | 'resubmit') { await wait(); const item = state.kyc.find((row) => row.id === kycId); if (!item) return null; if (action === 'approve') { item.status = 'Approved'; item.approvedDate = new Date().toISOString().slice(0, 10); } if (action === 'reject') { item.status = 'Rejected'; item.reason = 'Needs clearer document'; } if (action === 'resubmit') { item.status = 'Resubmission'; item.reason = 'Please reupload'; } return item; },
  async fetchFraud() { await wait(); return state.fraud; },
  async fetchReports() { await wait(); return mockData.reports; },
  async fetchDashboardSummary() { await wait(); return { metrics: mockData.dashboard.metrics, pendingKyc: state.kyc.filter((row) => row.status === 'Pending').length, failedTransactions: state.transactions.filter((row) => row.status === 'Failed').length, providerHealth: 'Healthy' }; },
};

export default adminMockService;
