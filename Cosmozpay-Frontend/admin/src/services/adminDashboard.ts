import { requestAdminApi } from './adminAuth';

export type DashboardMetricName =
  | 'total_users'
  | 'active_users_today'
  | 'new_registrations_today'
  | 'total_transactions'
  | 'pending_transactions'
  | 'failed_transactions';

export interface DashboardPeriodRange {
  start: string;
  end: string;
}

export interface MetricPeriodComparison {
  current: number;
  previous: number | null;
  change: number | null;
  current_period: DashboardPeriodRange | null;
  previous_period: DashboardPeriodRange | null;
  unavailable_reason?: string | null;
}

export interface DashboardMetrics {
  total_users: number;
  active_users_today: number;
  new_registrations_today: number;
  total_transactions: number;
  pending_transactions: number;
  failed_transactions: number;
  period_comparison: Partial<Record<DashboardMetricName, MetricPeriodComparison>>;
}

export interface CurrencyBalance {
  currency: string;
  ledger_balance: string;
  available_balance: string;
  locked_balance: string;
}

export interface CurrencyVolume {
  currency: string;
  amount: string;
}

export interface FinancialMetrics {
  revenue: null;
  profit: null;
  revenue_unavailable_reason: string;
  profit_unavailable_reason: string;
}

export interface AnalyticsBucket {
  bucket: string;
  registrations: number;
  transactions: number;
  transaction_volume: CurrencyVolume[];
}

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

export interface CategoryBreakdown {
  category: string;
  provider: string | null;
  currency: string;
  transaction_count: number;
  transaction_volume: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  wallet_balances: CurrencyBalance[];
  transaction_volume: CurrencyVolume[];
  financial_metrics: FinancialMetrics;
  analytics: Record<AnalyticsPeriod, AnalyticsBucket[]>;
  category_breakdown: CategoryBreakdown[];
}

export interface DashboardDataView {
  metrics?: Partial<DashboardMetrics>;
  wallet_balances?: CurrencyBalance[];
  transaction_volume?: CurrencyVolume[];
  financial_metrics?: Partial<FinancialMetrics>;
  analytics?: Partial<Record<AnalyticsPeriod, AnalyticsBucket[]>>;
  category_breakdown?: CategoryBreakdown[];
}

export interface DashboardParseResult {
  data: DashboardDataView;
  issues: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isAmount(value: unknown): value is string {
  return typeof value === 'string' && /^-?(?:\d+|\d*\.\d+)(?:[eE][+-]?\d+)?$/.test(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPeriodComparison(value: unknown): value is MetricPeriodComparison {
  return isRecord(value) &&
    isFiniteNumber(value.current) &&
    (value.previous === null || isFiniteNumber(value.previous)) &&
    (value.change === null || isFiniteNumber(value.change)) &&
    (value.current_period === null || isPeriodRange(value.current_period)) &&
    (value.previous_period === null || isPeriodRange(value.previous_period)) &&
    (value.unavailable_reason === undefined ||
      value.unavailable_reason === null ||
      typeof value.unavailable_reason === 'string');
}

function isPeriodRange(value: unknown): value is DashboardPeriodRange {
  return isRecord(value) && isText(value.start) && isText(value.end);
}

function parseRows<T>(
  value: unknown,
  section: string,
  isRow: (row: unknown) => row is T,
  issues: string[],
): T[] | undefined {
  if (!Array.isArray(value)) {
    issues.push(`${section} is missing or has an invalid shape.`);
    return undefined;
  }
  const rows = value.filter(isRow);
  if (rows.length !== value.length) {
    issues.push(`${section} contains invalid rows; valid rows are shown.`);
  }
  return rows;
}

function isCurrencyBalance(value: unknown): value is CurrencyBalance {
  return isRecord(value) &&
    isText(value.currency) &&
    isAmount(value.ledger_balance) &&
    isAmount(value.available_balance) &&
    isAmount(value.locked_balance);
}

function isCurrencyVolume(value: unknown): value is CurrencyVolume {
  return isRecord(value) && isText(value.currency) && isAmount(value.amount);
}

function isAnalyticsBucket(value: unknown): value is AnalyticsBucket {
  return isRecord(value) &&
    isText(value.bucket) &&
    isCount(value.registrations) &&
    isCount(value.transactions) &&
    Array.isArray(value.transaction_volume) &&
    value.transaction_volume.every(isCurrencyVolume);
}

function isCategoryBreakdown(value: unknown): value is CategoryBreakdown {
  return isRecord(value) &&
    isText(value.category) &&
    (value.provider === null || isText(value.provider)) &&
    isText(value.currency) &&
    isCount(value.transaction_count) &&
    isAmount(value.transaction_volume);
}

export function parseDashboardData(value: unknown): DashboardParseResult {
  const data: DashboardDataView = {};
  const issues: string[] = [];

  if (!isRecord(value)) {
    return { data, issues: ['The dashboard response has an invalid shape.'] };
  }

  if (isRecord(value.metrics)) {
    const metrics: Partial<DashboardMetrics> = {};
    const keys: DashboardMetricName[] = [
      'total_users',
      'active_users_today',
      'new_registrations_today',
      'total_transactions',
      'pending_transactions',
      'failed_transactions',
    ];
    for (const key of keys) {
      if (isCount(value.metrics[key])) metrics[key] = value.metrics[key];
      else issues.push(`metrics.${key} is missing or invalid.`);
    }
    if (isRecord(value.metrics.period_comparison)) {
      const periodComparison: Partial<Record<DashboardMetricName, MetricPeriodComparison>> = {};
      for (const key of keys) {
        const comparison = value.metrics.period_comparison[key];
        if (isPeriodComparison(comparison)) periodComparison[key] = comparison;
        else issues.push(`metrics.period_comparison.${key} is missing or invalid.`);
      }
      metrics.period_comparison = periodComparison;
    } else {
      issues.push('metrics.period_comparison is missing or has an invalid shape.');
    }
    data.metrics = metrics;
  } else {
    issues.push('metrics is missing or has an invalid shape.');
  }

  data.wallet_balances = parseRows(
    value.wallet_balances,
    'wallet_balances',
    isCurrencyBalance,
    issues,
  );
  data.transaction_volume = parseRows(
    value.transaction_volume,
    'transaction_volume',
    isCurrencyVolume,
    issues,
  );

  if (isRecord(value.financial_metrics)) {
    const financialMetrics: Partial<FinancialMetrics> = {};
    if (value.financial_metrics.revenue === null) financialMetrics.revenue = null;
    else issues.push('financial_metrics.revenue is missing or invalid.');
    if (value.financial_metrics.profit === null) financialMetrics.profit = null;
    else issues.push('financial_metrics.profit is missing or invalid.');
    if (isText(value.financial_metrics.revenue_unavailable_reason)) {
      financialMetrics.revenue_unavailable_reason = value.financial_metrics.revenue_unavailable_reason;
    } else issues.push('financial_metrics.revenue_unavailable_reason is missing or invalid.');
    if (isText(value.financial_metrics.profit_unavailable_reason)) {
      financialMetrics.profit_unavailable_reason = value.financial_metrics.profit_unavailable_reason;
    } else issues.push('financial_metrics.profit_unavailable_reason is missing or invalid.');
    data.financial_metrics = financialMetrics;
  } else {
    issues.push('financial_metrics is missing or has an invalid shape.');
  }

  if (isRecord(value.analytics)) {
    const analytics: Partial<Record<AnalyticsPeriod, AnalyticsBucket[]>> = {};
    for (const period of ['daily', 'weekly', 'monthly'] as const) {
      analytics[period] = parseRows(
        value.analytics[period],
        `analytics.${period}`,
        isAnalyticsBucket,
        issues,
      );
    }
    data.analytics = analytics;
  } else {
    issues.push('analytics is missing or has an invalid shape.');
  }

  data.category_breakdown = parseRows(
    value.category_breakdown,
    'category_breakdown',
    isCategoryBreakdown,
    issues,
  );

  return { data, issues };
}

export async function fetchAdminDashboard(): Promise<unknown> {
  return requestAdminApi('/admin/dashboard');
}
