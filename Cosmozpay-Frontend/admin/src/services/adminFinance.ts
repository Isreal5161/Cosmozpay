import { requestAdminApi } from './adminAuth';

export interface AdminFinanceCurrency {
  currency: string;
  gross_transaction_volume: string;
  wallet_funding_volume: string;
  transfer_volume: string;
  withdrawal_volume: string;
  other_volume: string;
  successful_transaction_count: number;
  pending_transaction_count: number;
  failed_transaction_count: number;
  other_transaction_count: number;
  unverified_customer_charges: string;
  refund_adjustments: string;
  reversal_adjustments: string;
}

export interface AdminFinanceCategory {
  currency: string;
  category: string;
  transaction_volume: string;
}

export interface AdminFinanceProvider {
  currency: string;
  provider: string;
  transaction_volume: string;
}

export interface AdminFinanceTrend {
  date: string;
  currency: string;
  transaction_volume: string;
}

export interface AdminFinanceRevenueCurrency {
  currency: string;
  gross_amount: string;
  reversal_amount: string;
  net_amount: string;
  selling_amount: string;
  provider_cost: string;
  gross_service_margin: string;
  loss_amount: string;
  recognized_count: number;
}

export interface AdminFinanceEstimateCurrency {
  currency: string;
  selling_amount: string;
  provider_cost: string;
  estimated_margin: string;
  transaction_count: number;
}

export interface AdminFinanceServiceSalesCurrency {
  currency: string;
  selling_amount: string;
  transaction_count: number;
}

export interface AdminFinanceServiceMargin {
  service_category: string;
  currency: string;
  selling_amount: string;
  provider_cost: string;
  gross_margin: string;
  recognized_margin: string;
  reversal_amount: string;
  net_margin: string;
  loss_amount: string;
  transaction_count: number;
}

export interface AdminFinanceServiceMarginTrend {
  date: string;
  currency: string;
  gross_margin: string;
  reversal_amount: string;
  net_margin: string;
}

export interface AdminFinanceCostEvidenceGap {
  service_category: string;
  currency: string;
  provider_identifier: string;
  transaction_count: number;
  reason: string;
}

export interface AdminFinanceRevenueEvidence {
  service_category: string;
  status: string;
  cost_source: string;
  provider_identifier: string;
  provider_reference: string;
  provider_cost_reference: string;
  selling_amount: string;
  provider_cost: string;
  gross_margin: string;
  recognized_amount: string;
  reversal_amount: string;
  net_amount: string;
  currency: string;
  reversals: Array<{
    event_reference: string;
    source_reference: string | null;
    amount: string;
    currency: string;
    created_at: string | null;
  }>;
}

export interface AdminFinanceProviderCostRow {
  service_type: string;
  provider_identifier: string | null;
  currency: string;
  source_class: string;
  selling_amount: string;
  provider_cost: string | null;
  margin: string | null;
  transaction_count: number;
}

export interface AdminFinanceActivity {
  id: string;
  reference: string;
  category: string;
  transaction_type: string;
  amount: string;
  currency: string;
  charges: string;
  status: string;
  provider_name: string | null;
  provider_reference: string | null;
  created_at: string | null;
}

export interface AdminFinanceReport {
  revenue: { available: boolean; amount: string | null; currency: string | null; reason: string | null };
  revenue_by_currency: AdminFinanceRevenueCurrency[];
  estimated_service_margin_by_currency: AdminFinanceEstimateCurrency[];
  successful_service_sales_by_currency: AdminFinanceServiceSalesCurrency[];
  service_margin_breakdown: AdminFinanceServiceMargin[];
  service_margin_trends: AdminFinanceServiceMarginTrend[];
  cost_evidence_unavailable: AdminFinanceCostEvidenceGap[];
  provider_cost_breakdown: AdminFinanceProviderCostRow[];
  awaiting_cost_verification_count: number;
  currencies: AdminFinanceCurrency[];
  categories: AdminFinanceCategory[];
  available_categories: string[];
  available_currencies: string[];
  providers: AdminFinanceProvider[];
  trends: AdminFinanceTrend[];
  activity: {
    items: AdminFinanceActivity[];
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface AdminFinanceLedgerEntry {
  transaction_reference: string;
  transaction_type: string;
  entry_type: string;
  status: string;
  currency: string;
  debit_amount: string;
  credit_amount: string;
  created_at: string | null;
}

export interface AdminFinanceTransactionDetail extends AdminFinanceActivity {
  total_amount: string;
  updated_at: string | null;
  platform_revenue: {
    available: boolean;
    amount: string | null;
    gross_amount: string | null;
    reversal_amount: string | null;
    net_amount: string | null;
    currency: string;
  };
  service_margin_evidence: AdminFinanceRevenueEvidence[];
  provisional_cost_snapshot: {
    service_type: string;
    provider_identifier: string | null;
    provider_reference: string | null;
    source_class: string;
    selling_amount: string;
    provider_cost: string | null;
    estimated_margin: string | null;
    currency: string;
    reason: string | null;
    snapshot_at: string | null;
  } | null;
  ledger_entries: AdminFinanceLedgerEntry[];
}

export interface AdminFinanceQuery {
  page: number;
  page_size: number;
  search?: string;
  category?: string;
  status?: string;
  provider?: string;
  currency?: string;
  start_date?: string;
  end_date?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrap(value: unknown): unknown {
  return isRecord(value) && value.success === true && Object.prototype.hasOwnProperty.call(value, 'data')
    ? value.data
    : value;
}

function requiredString(record: Record<string, unknown>, key: string): string {
  if (typeof record[key] !== 'string') throw new Error('The server returned invalid finance data.');
  return record[key];
}

function nullableString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value !== null && value !== undefined && typeof value !== 'string') {
    throw new Error('The server returned invalid finance data.');
  }
  return typeof value === 'string' ? value : null;
}

function requiredNumber(record: Record<string, unknown>, key: string): number {
  if (typeof record[key] !== 'number' || !Number.isInteger(record[key])) {
    throw new Error('The server returned invalid finance pagination data.');
  }
  return record[key];
}

function parseActivity(value: unknown): AdminFinanceActivity {
  if (!isRecord(value)) throw new Error('The server returned an invalid finance activity record.');
  return {
    id: requiredString(value, 'id'),
    reference: requiredString(value, 'reference'),
    category: requiredString(value, 'category'),
    transaction_type: requiredString(value, 'transaction_type'),
    amount: requiredString(value, 'amount'),
    currency: requiredString(value, 'currency'),
    charges: requiredString(value, 'charges'),
    status: requiredString(value, 'status'),
    provider_name: nullableString(value, 'provider_name'),
    provider_reference: nullableString(value, 'provider_reference'),
    created_at: nullableString(value, 'created_at'),
  };
}

function parseFinanceReport(value: unknown): AdminFinanceReport {
  const response = unwrap(value);
  if (!isRecord(response) || !isRecord(response.revenue) || !Array.isArray(response.currencies)
    || !Array.isArray(response.revenue_by_currency)
    || !Array.isArray(response.estimated_service_margin_by_currency)
    || !Array.isArray(response.successful_service_sales_by_currency)
    || !Array.isArray(response.service_margin_breakdown) || !Array.isArray(response.service_margin_trends)
    || !Array.isArray(response.cost_evidence_unavailable)
    || !Array.isArray(response.provider_cost_breakdown)
    || !Array.isArray(response.categories) || !Array.isArray(response.providers) || !Array.isArray(response.trends)
    || !Array.isArray(response.available_categories) || !Array.isArray(response.available_currencies)
    || !isRecord(response.activity) || !Array.isArray(response.activity.items)) {
    throw new Error('The server returned invalid finance data.');
  }
  const revenue = response.revenue;
  if (typeof revenue.available !== 'boolean') throw new Error('The server returned invalid revenue data.');
  const currencies = response.currencies.map((value): AdminFinanceCurrency => {
    if (!isRecord(value)) throw new Error('The server returned invalid finance totals.');
    return {
      currency: requiredString(value, 'currency'),
      gross_transaction_volume: requiredString(value, 'gross_transaction_volume'),
      wallet_funding_volume: requiredString(value, 'wallet_funding_volume'),
      transfer_volume: requiredString(value, 'transfer_volume'),
      withdrawal_volume: requiredString(value, 'withdrawal_volume'),
      other_volume: requiredString(value, 'other_volume'),
      successful_transaction_count: requiredNumber(value, 'successful_transaction_count'),
      pending_transaction_count: requiredNumber(value, 'pending_transaction_count'),
      failed_transaction_count: requiredNumber(value, 'failed_transaction_count'),
      other_transaction_count: requiredNumber(value, 'other_transaction_count'),
      unverified_customer_charges: requiredString(value, 'unverified_customer_charges'),
      refund_adjustments: requiredString(value, 'refund_adjustments'),
      reversal_adjustments: requiredString(value, 'reversal_adjustments'),
    };
  });
  const categories = response.categories.map((value): AdminFinanceCategory => {
    if (!isRecord(value)) throw new Error('The server returned invalid category totals.');
    return {
      currency: requiredString(value, 'currency'),
      category: requiredString(value, 'category'),
      transaction_volume: requiredString(value, 'transaction_volume'),
    };
  });
  const providers = response.providers.map((value): AdminFinanceProvider => {
    if (!isRecord(value)) throw new Error('The server returned invalid provider totals.');
    return {
      currency: requiredString(value, 'currency'),
      provider: requiredString(value, 'provider'),
      transaction_volume: requiredString(value, 'transaction_volume'),
    };
  });
  const trends = response.trends.map((value): AdminFinanceTrend => {
    if (!isRecord(value)) throw new Error('The server returned invalid finance trend data.');
    return {
      date: requiredString(value, 'date'),
      currency: requiredString(value, 'currency'),
      transaction_volume: requiredString(value, 'transaction_volume'),
    };
  });
  const revenueByCurrency = response.revenue_by_currency.map((value): AdminFinanceRevenueCurrency => {
    if (!isRecord(value)) throw new Error('The server returned invalid platform-income totals.');
    return {
      currency: requiredString(value, 'currency'),
      gross_amount: requiredString(value, 'gross_amount'),
      reversal_amount: requiredString(value, 'reversal_amount'),
      net_amount: requiredString(value, 'net_amount'),
      selling_amount: requiredString(value, 'selling_amount'),
      provider_cost: requiredString(value, 'provider_cost'),
      gross_service_margin: requiredString(value, 'gross_service_margin'),
      loss_amount: requiredString(value, 'loss_amount'),
      recognized_count: requiredNumber(value, 'recognized_count'),
    };
  });
  const estimatedServiceMarginByCurrency = response.estimated_service_margin_by_currency.map((value): AdminFinanceEstimateCurrency => {
    if (!isRecord(value)) throw new Error('The server returned invalid provisional margin data.');
    return {
      currency: requiredString(value, 'currency'),
      selling_amount: requiredString(value, 'selling_amount'),
      provider_cost: requiredString(value, 'provider_cost'),
      estimated_margin: requiredString(value, 'estimated_margin'),
      transaction_count: requiredNumber(value, 'transaction_count'),
    };
  });
  const successfulServiceSalesByCurrency = response.successful_service_sales_by_currency.map((value): AdminFinanceServiceSalesCurrency => {
    if (!isRecord(value)) throw new Error('The server returned invalid service-sales data.');
    return {
      currency: requiredString(value, 'currency'),
      selling_amount: requiredString(value, 'selling_amount'),
      transaction_count: requiredNumber(value, 'transaction_count'),
    };
  });
  const serviceMarginBreakdown = response.service_margin_breakdown.map((value): AdminFinanceServiceMargin => {
    if (!isRecord(value)) throw new Error('The server returned invalid service-margin data.');
    return {
      service_category: requiredString(value, 'service_category'),
      currency: requiredString(value, 'currency'),
      selling_amount: requiredString(value, 'selling_amount'),
      provider_cost: requiredString(value, 'provider_cost'),
      gross_margin: requiredString(value, 'gross_margin'),
      recognized_margin: requiredString(value, 'recognized_margin'),
      reversal_amount: requiredString(value, 'reversal_amount'),
      net_margin: requiredString(value, 'net_margin'),
      loss_amount: requiredString(value, 'loss_amount'),
      transaction_count: requiredNumber(value, 'transaction_count'),
    };
  });
  const serviceMarginTrends = response.service_margin_trends.map((value): AdminFinanceServiceMarginTrend => {
    if (!isRecord(value)) throw new Error('The server returned invalid service-margin trend data.');
    return {
      date: requiredString(value, 'date'),
      currency: requiredString(value, 'currency'),
      gross_margin: requiredString(value, 'gross_margin'),
      reversal_amount: requiredString(value, 'reversal_amount'),
      net_margin: requiredString(value, 'net_margin'),
    };
  });
  const costEvidenceUnavailable = response.cost_evidence_unavailable.map((value): AdminFinanceCostEvidenceGap => {
    if (!isRecord(value)) throw new Error('The server returned invalid cost-evidence status data.');
    return {
      service_category: requiredString(value, 'service_category'),
      currency: requiredString(value, 'currency'),
      provider_identifier: requiredString(value, 'provider_identifier'),
      transaction_count: requiredNumber(value, 'transaction_count'),
      reason: requiredString(value, 'reason'),
    };
  });
  const providerCostBreakdown = response.provider_cost_breakdown.map((value): AdminFinanceProviderCostRow => {
    if (!isRecord(value)) throw new Error('The server returned invalid provider-cost reporting data.');
    return {
      service_type: requiredString(value, 'service_type'),
      provider_identifier: nullableString(value, 'provider_identifier'),
      currency: requiredString(value, 'currency'),
      source_class: requiredString(value, 'source_class'),
      selling_amount: requiredString(value, 'selling_amount'),
      provider_cost: nullableString(value, 'provider_cost'),
      margin: nullableString(value, 'margin'),
      transaction_count: requiredNumber(value, 'transaction_count'),
    };
  });
  const awaitingCostCount = requiredNumber(response, 'awaiting_cost_verification_count');
  return {
    revenue: {
      available: revenue.available,
      amount: nullableString(revenue, 'amount'),
      currency: nullableString(revenue, 'currency'),
      reason: nullableString(revenue, 'reason'),
    },
    revenue_by_currency: revenueByCurrency,
    estimated_service_margin_by_currency: estimatedServiceMarginByCurrency,
    successful_service_sales_by_currency: successfulServiceSalesByCurrency,
    service_margin_breakdown: serviceMarginBreakdown,
    service_margin_trends: serviceMarginTrends,
    cost_evidence_unavailable: costEvidenceUnavailable,
    provider_cost_breakdown: providerCostBreakdown,
    awaiting_cost_verification_count: awaitingCostCount,
    currencies,
    categories,
    available_categories: response.available_categories.filter((item): item is string => typeof item === 'string'),
    available_currencies: response.available_currencies.filter((item): item is string => typeof item === 'string'),
    providers,
    trends,
    activity: {
      items: response.activity.items.map(parseActivity),
      page: requiredNumber(response.activity, 'page'),
      page_size: requiredNumber(response.activity, 'page_size'),
      total: requiredNumber(response.activity, 'total'),
      total_pages: requiredNumber(response.activity, 'total_pages'),
    },
  };
}

export async function fetchAdminFinanceReport(query: AdminFinanceQuery): Promise<AdminFinanceReport> {
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(query.page_size),
  });
  for (const key of ['search', 'category', 'status', 'provider', 'currency', 'start_date', 'end_date'] as const) {
    const value = query[key];
    if (value) params.set(key, value);
  }
  return parseFinanceReport(await requestAdminApi(`/admin/finance?${params.toString()}`));
}

export async function fetchAdminFinanceTransaction(
  transactionId: string,
): Promise<AdminFinanceTransactionDetail> {
  const raw = unwrap(await requestAdminApi(
    `/admin/finance/transactions/${encodeURIComponent(transactionId)}`,
  ));
  if (!isRecord(raw) || !Array.isArray(raw.ledger_entries)) {
    throw new Error('The server returned invalid finance transaction details.');
  }
  const activity = parseActivity(raw);
  if (!isRecord(raw.platform_revenue) || !Array.isArray(raw.service_margin_evidence)) {
    throw new Error('The server returned invalid platform-revenue evidence.');
  }
  const platformRevenue = raw.platform_revenue;
  if (typeof platformRevenue.available !== 'boolean') {
    throw new Error('The server returned invalid platform-revenue availability.');
  }
  const serviceMarginEvidence = raw.service_margin_evidence.map((value): AdminFinanceRevenueEvidence => {
    if (!isRecord(value) || !Array.isArray(value.reversals)) {
      throw new Error('The server returned invalid provider-cost evidence.');
    }
    return {
      service_category: requiredString(value, 'service_category'),
      status: requiredString(value, 'status'),
      cost_source: requiredString(value, 'cost_source'),
      provider_identifier: requiredString(value, 'provider_identifier'),
      provider_reference: requiredString(value, 'provider_reference'),
      provider_cost_reference: requiredString(value, 'provider_cost_reference'),
      selling_amount: requiredString(value, 'selling_amount'),
      provider_cost: requiredString(value, 'provider_cost'),
      gross_margin: requiredString(value, 'gross_margin'),
      recognized_amount: requiredString(value, 'recognized_amount'),
      reversal_amount: requiredString(value, 'reversal_amount'),
      net_amount: requiredString(value, 'net_amount'),
      currency: requiredString(value, 'currency'),
      reversals: value.reversals.map((reversal) => {
        if (!isRecord(reversal)) throw new Error('The server returned invalid reversal evidence.');
        return {
          event_reference: requiredString(reversal, 'event_reference'),
          source_reference: nullableString(reversal, 'source_reference'),
          amount: requiredString(reversal, 'amount'),
          currency: requiredString(reversal, 'currency'),
          created_at: nullableString(reversal, 'created_at'),
        };
      }),
    };
  });
  let provisionalCostSnapshot: AdminFinanceTransactionDetail['provisional_cost_snapshot'] = null;
  if (raw.provisional_cost_snapshot !== null && raw.provisional_cost_snapshot !== undefined) {
    if (!isRecord(raw.provisional_cost_snapshot)) {
      throw new Error('The server returned invalid provisional provider-cost data.');
    }
    provisionalCostSnapshot = {
      service_type: requiredString(raw.provisional_cost_snapshot, 'service_type'),
      provider_identifier: nullableString(raw.provisional_cost_snapshot, 'provider_identifier'),
      provider_reference: nullableString(raw.provisional_cost_snapshot, 'provider_reference'),
      source_class: requiredString(raw.provisional_cost_snapshot, 'source_class'),
      selling_amount: requiredString(raw.provisional_cost_snapshot, 'selling_amount'),
      provider_cost: nullableString(raw.provisional_cost_snapshot, 'provider_cost'),
      estimated_margin: nullableString(raw.provisional_cost_snapshot, 'estimated_margin'),
      currency: requiredString(raw.provisional_cost_snapshot, 'currency'),
      reason: nullableString(raw.provisional_cost_snapshot, 'reason'),
      snapshot_at: nullableString(raw.provisional_cost_snapshot, 'snapshot_at'),
    };
  }
  return {
    ...activity,
    total_amount: requiredString(raw, 'total_amount'),
    updated_at: nullableString(raw, 'updated_at'),
    platform_revenue: {
      available: platformRevenue.available,
      amount: nullableString(platformRevenue, 'amount'),
      gross_amount: nullableString(platformRevenue, 'gross_amount'),
      reversal_amount: nullableString(platformRevenue, 'reversal_amount'),
      net_amount: nullableString(platformRevenue, 'net_amount'),
      currency: requiredString(platformRevenue, 'currency'),
    },
    service_margin_evidence: serviceMarginEvidence,
    provisional_cost_snapshot: provisionalCostSnapshot,
    ledger_entries: raw.ledger_entries.map((value): AdminFinanceLedgerEntry => {
      if (!isRecord(value)) throw new Error('The server returned an invalid ledger movement.');
      return {
        transaction_reference: requiredString(value, 'transaction_reference'),
        transaction_type: requiredString(value, 'transaction_type'),
        entry_type: requiredString(value, 'entry_type'),
        status: requiredString(value, 'status'),
        currency: requiredString(value, 'currency'),
        debit_amount: requiredString(value, 'debit_amount'),
        credit_amount: requiredString(value, 'credit_amount'),
        created_at: nullableString(value, 'created_at'),
      };
    }),
  };
}
