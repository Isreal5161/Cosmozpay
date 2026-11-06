import type { AdminUser, KycRecord, TransactionRecord } from '../services/mockAdminService';

type MockRow = Record<string, string | number>;

// Mock data for all admin pages
export const mockData = {
  // Remove fixture data — use live backend or show empty states in UI
  users: [] as AdminUser[],
  wallets: [] as MockRow[],
  transactions: [] as TransactionRecord[],
  payments: [] as MockRow[],
  finance: {
    companyEarnings: 0,
    feesCollected: 0,
    commissionsReceived: 0,
    profit: 0,
    taxes: 0,
    payoutScheduled: 0,
    reports: [] as MockRow[],
  },
  kyc: [] as KycRecord[],
  fraud: {
    suspiciousTransactions: [] as MockRow[],
    fraudAlerts: [] as MockRow[],
    blockedAccounts: 0,
    blacklistEntries: 0,
  },
  support: [] as MockRow[],
  notifications: [] as MockRow[],
  reports: {
    userGrowth: [] as MockRow[],
    transactionTrends: [] as MockRow[],
    revenueAnalytics: [] as MockRow[],
  },
  products: [] as MockRow[],
  merchants: [] as MockRow[],
  staff: [] as MockRow[],
  settings: {
    platformName: 'CosmozPay',
    transactionLimit: 1000000,
    dailyLimit: 5000000,
    monthlyFee: 500,
    commissionRate: 2.5,
    paymentGateway: 'Flutterwave',
    maintenanceMode: false,
  },
  security: {
    loginAttempts: [] as MockRow[],
    deviceManagement: [] as MockRow[],
    twoFactorStatus: { enabled: 0, disabled: 0 },
  },
  marketing: [] as MockRow[],
  audit: [] as MockRow[],
  api: {
    keys: [] as MockRow[],
    webhooks: [] as MockRow[],
    usage: { today: 0, thisMonth: 0, rateLimit: 0 },
  },
  monitoring: {
    serverStatus: { cpu: 0, memory: 0, disk: 0, status: 'Unknown' },
    databaseHealth: { status: 'Unknown', connections: 0, maxConnections: 0 },
    paymentGatewayStatus: { status: 'Unknown', lastCheck: '' },
    queueStatus: [] as MockRow[],
    errorLogs: [] as MockRow[],
    uptime: 0,
  },
};
