import { requestAdminApi } from './adminAuth';

export interface AdminTransactionUser {
  id: string;
  name: string | null;
  email: string;
}

export interface AdminTransactionLedgerEntry {
  id: string;
  source: string;
  transaction_reference: string;
  transaction_type: string;
  entry_type: string;
  status: string;
  currency: string;
  debit_amount: string;
  credit_amount: string;
  opening_balance: string;
  closing_balance: string;
  created_by: string;
  description: string | null;
  created_at: string | null;
}

export interface AdminTransaction {
  id: string;
  reference: string;
  user_id: string;
  wallet_id: string | null;
  transaction_type: string;
  category: string;
  amount: string;
  currency: string;
  charges: string | null;
  total_amount: string | null;
  status: string;
  provider_name: string | null;
  provider_reference: string | null;
  provider_transaction_id: string | null;
  external_reference: string | null;
  description: string | null;
  card_amount: string | null;
  card_currency: string | null;
  payout_amount: string | null;
  payout_currency: string | null;
  credited_amount: string | null;
  credited_currency: string | null;
  user: AdminTransactionUser | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminTransactionDetail extends AdminTransaction {
  metadata: Record<string, string | number | boolean>;
  ledger_entries: AdminTransactionLedgerEntry[];
}

export interface AdminPayment extends AdminTransaction {
  payment_type: string;
  method: string | null;
}

export interface AdminPaymentDetail extends AdminTransactionDetail {
  payment_type: string;
  method: string | null;
  recipient: AdminTransactionUser | null;
}

export interface AdminPaymentQuery {
  page: number;
  page_size: number;
  payment_category?: 'wallet_funding' | 'payment' | 'transfer' | 'bank_payout';
  status?: string;
  method?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  descending?: boolean;
}

export interface AdminPaymentPage {
  items: AdminPayment[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  summary: AdminTransactionSummary;
}

export interface AdminTransactionTimelineEvent {
  at: string | null;
  event: string;
  actor_type: string;
  actor_id: string | null;
  description: string | null;
}

export interface AdminTransactionSummary {
  total: number;
  successful: number;
  pending: number;
  failed: number;
}

export interface AdminTransactionPage {
  items: AdminTransaction[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  summary: AdminTransactionSummary;
}

export interface AdminTransactionQuery {
  page: number;
  page_size: number;
  search?: string;
  status?: string;
  category?: string;
  transaction_type?: string;
  provider?: string;
  start_date?: string;
  end_date?: string;
  order_by?: 'created_at' | 'updated_at' | 'status' | 'amount' | 'category' | 'transaction_type' | 'currency' | 'reference';
  descending?: boolean;
}

export interface AdminWalletAdjustment {
  id: string;
  source: 'ledger_adjustment';
  transaction_reference: string;
  wallet_id: string;
  user_id: string;
  transaction_type: string;
  entry_type: string;
  created_by: string;
  adjustment_reason: string | null;
  description: string | null;
  status: string;
  currency: string;
  debit_amount: string;
  credit_amount: string;
  opening_balance: string;
  closing_balance: string;
  related_transaction_id: string | null;
  created_at: string | null;
  user: AdminTransactionUser | null;
}

export interface AdminWalletAdjustmentPage {
  items: AdminWalletAdjustment[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
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
  if (typeof record[key] !== 'string') throw new Error('The server returned an invalid transaction response.');
  return record[key];
}

function nullableString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value !== null && value !== undefined && typeof value !== 'string') {
    throw new Error('The server returned an invalid transaction response.');
  }
  return typeof value === 'string' ? value : null;
}

function parseUser(value: unknown): AdminTransactionUser | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.email !== 'string') {
    throw new Error('The server returned an invalid transaction owner.');
  }
  return {
    id: value.id,
    email: value.email,
    name: typeof value.name === 'string' ? value.name : null,
  };
}

function parseTransaction(value: unknown): AdminTransaction {
  if (!isRecord(value)) throw new Error('The server returned an invalid transaction record.');
  return {
    id: requiredString(value, 'id'),
    reference: requiredString(value, 'reference'),
    user_id: requiredString(value, 'user_id'),
    wallet_id: nullableString(value, 'wallet_id'),
    transaction_type: requiredString(value, 'transaction_type'),
    category: requiredString(value, 'category'),
    amount: requiredString(value, 'amount'),
    currency: requiredString(value, 'currency'),
    charges: nullableString(value, 'charges'),
    total_amount: nullableString(value, 'total_amount'),
    status: requiredString(value, 'status'),
    provider_name: nullableString(value, 'provider_name'),
    provider_reference: nullableString(value, 'provider_reference'),
    provider_transaction_id: nullableString(value, 'provider_transaction_id'),
    external_reference: nullableString(value, 'external_reference'),
    description: nullableString(value, 'description'),
    card_amount: nullableString(value, 'card_amount'),
    card_currency: nullableString(value, 'card_currency'),
    payout_amount: nullableString(value, 'payout_amount'),
    payout_currency: nullableString(value, 'payout_currency'),
    credited_amount: nullableString(value, 'credited_amount'),
    credited_currency: nullableString(value, 'credited_currency'),
    user: parseUser(value.user),
    created_at: nullableString(value, 'created_at'),
    updated_at: nullableString(value, 'updated_at'),
  };
}

function parsePage<T>(
  value: unknown,
  parseItem: (item: unknown) => T,
): { items: T[]; page: number; page_size: number; total: number; total_pages: number } {
  const response = unwrap(value);
  if (
    !isRecord(response) ||
    !Array.isArray(response.items) ||
    !Number.isInteger(response.page) ||
    !Number.isInteger(response.page_size) ||
    !Number.isInteger(response.total) ||
    !Number.isInteger(response.total_pages)
  ) {
    throw new Error('The server returned an invalid transaction list.');
  }
  return {
    items: response.items.map(parseItem),
    page: response.page as number,
    page_size: response.page_size as number,
    total: response.total as number,
    total_pages: response.total_pages as number,
  };
}

function addQueryValues(params: URLSearchParams, query: AdminTransactionQuery): void {
  for (const key of ['search', 'status', 'category', 'transaction_type', 'provider', 'start_date', 'end_date'] as const) {
    const value = query[key]?.trim();
    if (value) params.set(key, value);
  }
  if (query.order_by) params.set('order_by', query.order_by);
  if (typeof query.descending === 'boolean') params.set('descending', String(query.descending));
}

export async function fetchAdminTransactions(query: AdminTransactionQuery): Promise<AdminTransactionPage> {
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(query.page_size),
  });
  addQueryValues(params, query);
  const raw = await requestAdminApi(`/admin/transactions?${params.toString()}`);
  const response = parsePage(raw, parseTransaction);
  const data = unwrap(raw);
  if (!isRecord(data) || !isRecord(data.summary)) {
    throw new Error('The server returned invalid transaction summary data.');
  }
  const summary = data.summary;
  for (const key of ['total', 'successful', 'pending', 'failed'] as const) {
    if (!Number.isInteger(summary[key])) throw new Error('The server returned invalid transaction summary data.');
  }
  return { ...response, summary: summary as unknown as AdminTransactionSummary };
}

export async function fetchAdminPayments(query: AdminPaymentQuery): Promise<AdminPaymentPage> {
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(query.page_size),
  });
  for (const key of ['payment_category', 'status', 'method', 'search', 'start_date', 'end_date'] as const) {
    const value = query[key]?.trim();
    if (value) params.set(key, value);
  }
  if (typeof query.descending === 'boolean') params.set('descending', String(query.descending));
  const raw = await requestAdminApi(`/admin/payments?${params.toString()}`);
  const response = parsePage(raw, parsePayment);
  const data = unwrap(raw);
  if (!isRecord(data) || !isRecord(data.summary)) {
    throw new Error('The server returned invalid payment summary data.');
  }
  const summary = data.summary;
  for (const key of ['total', 'successful', 'pending', 'failed'] as const) {
    if (!Number.isInteger(summary[key])) throw new Error('The server returned invalid payment summary data.');
  }
  return { ...response, summary: summary as unknown as AdminTransactionSummary };
}

function parsePayment(value: unknown): AdminPayment {
  if (!isRecord(value) || typeof value.payment_type !== 'string') {
    throw new Error('The server returned an invalid payment record.');
  }
  return {
    ...parseTransaction(value),
    payment_type: value.payment_type,
    method: typeof value.method === 'string' ? value.method : null,
  };
}

export async function fetchAdminTransactionDetails(transactionId: string): Promise<AdminTransactionDetail> {
  const raw = unwrap(await requestAdminApi(`/admin/transactions/${encodeURIComponent(transactionId)}`));
  return parseTransactionDetail(raw);
}

export async function fetchAdminPaymentDetails(transactionId: string): Promise<AdminPaymentDetail> {
  const raw = unwrap(await requestAdminApi(`/admin/payments/${encodeURIComponent(transactionId)}`));
  if (!isRecord(raw) || typeof raw.payment_type !== 'string') {
    throw new Error('The server returned invalid payment detail data.');
  }
  const base = parseTransactionDetail(raw);
  return {
    ...base,
    payment_type: raw.payment_type,
    method: typeof raw.method === 'string' ? raw.method : null,
    recipient: parseUser(raw.recipient),
  };
}

function parseTransactionDetail(raw: unknown): AdminTransactionDetail {
  if (!isRecord(raw) || !Array.isArray(raw.ledger_entries) || !isRecord(raw.metadata)) {
    throw new Error('The server returned invalid transaction detail data.');
  }
  const response = parseTransaction(raw);
  const metadata: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(raw.metadata)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') metadata[key] = value;
  }
  return {
    ...response,
    metadata,
    ledger_entries: raw.ledger_entries.map(parseLedgerEntry),
  };
}

function parseLedgerEntry(value: unknown): AdminTransactionLedgerEntry {
  if (!isRecord(value)) throw new Error('The server returned an invalid ledger entry.');
  return {
    id: requiredString(value, 'id'),
    source: requiredString(value, 'source'),
    transaction_reference: requiredString(value, 'transaction_reference'),
    transaction_type: requiredString(value, 'transaction_type'),
    entry_type: requiredString(value, 'entry_type'),
    status: requiredString(value, 'status'),
    currency: requiredString(value, 'currency'),
    debit_amount: requiredString(value, 'debit_amount'),
    credit_amount: requiredString(value, 'credit_amount'),
    opening_balance: requiredString(value, 'opening_balance'),
    closing_balance: requiredString(value, 'closing_balance'),
    created_by: requiredString(value, 'created_by'),
    description: nullableString(value, 'description'),
    created_at: nullableString(value, 'created_at'),
  };
}

export async function fetchAdminTransactionTimeline(
  transactionId: string,
): Promise<AdminTransactionTimelineEvent[]> {
  const response = unwrap(await requestAdminApi(
    `/admin/transactions/${encodeURIComponent(transactionId)}/timeline`,
  ));
  if (!isRecord(response) || !Array.isArray(response.timeline)) {
    throw new Error('The server returned invalid transaction timeline data.');
  }
  return response.timeline.map((item): AdminTransactionTimelineEvent => {
    if (!isRecord(item) || typeof item.event !== 'string' || typeof item.actor_type !== 'string') {
      throw new Error('The server returned an invalid transaction timeline event.');
    }
    return {
      at: typeof item.at === 'string' ? item.at : null,
      event: item.event,
      actor_type: item.actor_type,
      actor_id: typeof item.actor_id === 'string' ? item.actor_id : null,
      description: typeof item.description === 'string' ? item.description : null,
    };
  });
}

export async function fetchAdminWalletAdjustments(
  query: Omit<AdminTransactionQuery, 'status' | 'category' | 'transaction_type' | 'provider'>,
): Promise<AdminWalletAdjustmentPage> {
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(query.page_size),
  });
  addQueryValues(params, query);
  return parsePage(
    await requestAdminApi(`/admin/wallet-adjustments?${params.toString()}`),
    parseWalletAdjustment,
  );
}

function parseWalletAdjustment(value: unknown): AdminWalletAdjustment {
  if (!isRecord(value) || value.source !== 'ledger_adjustment') {
    throw new Error('The server returned an invalid wallet adjustment.');
  }
  return {
    id: requiredString(value, 'id'),
    source: 'ledger_adjustment',
    transaction_reference: requiredString(value, 'transaction_reference'),
    wallet_id: requiredString(value, 'wallet_id'),
    user_id: requiredString(value, 'user_id'),
    transaction_type: requiredString(value, 'transaction_type'),
    entry_type: requiredString(value, 'entry_type'),
    created_by: requiredString(value, 'created_by'),
    adjustment_reason: nullableString(value, 'adjustment_reason'),
    description: nullableString(value, 'description'),
    status: requiredString(value, 'status'),
    currency: requiredString(value, 'currency'),
    debit_amount: requiredString(value, 'debit_amount'),
    credit_amount: requiredString(value, 'credit_amount'),
    opening_balance: requiredString(value, 'opening_balance'),
    closing_balance: requiredString(value, 'closing_balance'),
    related_transaction_id: nullableString(value, 'related_transaction_id'),
    created_at: nullableString(value, 'created_at'),
    user: parseUser(value.user),
  };
}
