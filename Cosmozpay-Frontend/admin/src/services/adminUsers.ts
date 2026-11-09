import { AdminAuthError, requestAdminApi } from './adminAuth';

export type AdminUserStatusAction = 'suspend' | 'activate' | 'block' | 'unblock';

export type AdminUserSortField =
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'username'
  | 'phone'
  | 'status'
  | 'created_at'
  | 'updated_at'
  | 'last_login_at';

export interface AdminUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  username: string | null;
  phone: string | null;
  status: string;
  is_active: boolean;
  is_blocked: boolean;
  is_suspended: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserListQuery {
  page: number;
  page_size: number;
  search?: string;
  status?: string;
  sort_by: AdminUserSortField;
  sort_order: 'asc' | 'desc';
}

export interface AdminUserList {
  items: AdminUser[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface AdminWallet {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  wallet_reference: string | null;
  wallet_type: string;
  currency: string;
  status: string;
  available_balance: string;
  ledger_balance: string;
  locked_balance: string;
  is_active: boolean;
  is_frozen: boolean;
  is_suspended: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminLedgerEntry {
  id: string;
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
}

export interface AdminTransaction {
  id: string;
  reference: string;
  transaction_type: string;
  category: string;
  amount: string;
  currency: string;
  status: string;
  provider_name: string | null;
  provider_reference: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminKycRecord {
  id: string;
  verification_status: string;
  verification_level: string;
  document_type: string | null;
  document_verification_status: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string | null;
}

export interface AdminActivityEvent {
  id: string;
  action: string;
  category: string | null;
  description: string | null;
  actor_type: string;
  actor_id: string | null;
  created_at: string | null;
}

export interface AdminSession {
  session_id: string;
  status: string | null;
  created_at: string | null;
  last_activity_at: string | null;
  expires_at: string | null;
  device_name: string | null;
  browser: string | null;
  operating_system: string | null;
}

export interface AdminSessionEvent {
  action: string;
  timestamp: string;
}

export interface AdminPage<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface AdminWalletList extends AdminPage<AdminWallet> {
  total_wallets: number;
  currencies: string[];
}

export interface AdminTransactionQuery {
  page: number;
  page_size: number;
  status?: string;
  category?: string;
  transaction_type?: string;
  currency?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapServiceData(value: unknown): unknown {
  return isRecord(value) && value.success === true && Object.prototype.hasOwnProperty.call(value, 'data')
    ? value.data
    : value;
}

function isOptionalString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function parsePage<T>(value: unknown, parseItem: (item: unknown) => T, error: string): AdminPage<T> {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !Number.isInteger(value.page) ||
    !Number.isInteger(value.page_size) ||
    !Number.isInteger(value.total) ||
    !Number.isInteger(value.total_pages)
  ) throw new Error(error);
  return {
    items: value.items.map(parseItem),
    page: value.page as number,
    page_size: value.page_size as number,
    total: value.total as number,
    total_pages: value.total_pages as number,
  };
}

function parseWallet(value: unknown): AdminWallet {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.user_id !== 'string' ||
    !isOptionalString(value.user_name) ||
    !isOptionalString(value.user_email) ||
    !isOptionalString(value.user_phone) ||
    !isOptionalString(value.wallet_reference) ||
    typeof value.wallet_type !== 'string' ||
    typeof value.currency !== 'string' ||
    typeof value.status !== 'string' ||
    typeof value.available_balance !== 'string' ||
    typeof value.ledger_balance !== 'string' ||
    typeof value.locked_balance !== 'string' ||
    typeof value.is_active !== 'boolean' ||
    typeof value.is_frozen !== 'boolean' ||
    typeof value.is_suspended !== 'boolean' ||
    !isOptionalString(value.created_at) ||
    !isOptionalString(value.updated_at)
  ) throw new Error('The server returned an invalid wallet record.');
  return value as unknown as AdminWallet;
}

function parseLedgerEntry(value: unknown): AdminLedgerEntry {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.transaction_reference !== 'string' ||
    typeof value.wallet_id !== 'string' ||
    typeof value.user_id !== 'string' ||
    typeof value.transaction_type !== 'string' ||
    typeof value.entry_type !== 'string' ||
    typeof value.created_by !== 'string' ||
    !isOptionalString(value.adjustment_reason) ||
    !isOptionalString(value.description) ||
    typeof value.status !== 'string' ||
    typeof value.currency !== 'string' ||
    typeof value.debit_amount !== 'string' ||
    typeof value.credit_amount !== 'string' ||
    typeof value.opening_balance !== 'string' ||
    typeof value.closing_balance !== 'string' ||
    !isOptionalString(value.related_transaction_id) ||
    !isOptionalString(value.created_at)
  ) throw new Error('The server returned an invalid wallet ledger entry.');
  return value as unknown as AdminLedgerEntry;
}

function parseTransaction(value: unknown): AdminTransaction {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.reference !== 'string' ||
    typeof value.transaction_type !== 'string' ||
    typeof value.category !== 'string' ||
    typeof value.amount !== 'string' ||
    typeof value.currency !== 'string' ||
    typeof value.status !== 'string' ||
    !isOptionalString(value.provider_name) ||
    !isOptionalString(value.provider_reference) ||
    !isOptionalString(value.description) ||
    !isOptionalString(value.created_at) ||
    !isOptionalString(value.updated_at)
  ) throw new Error('The server returned an invalid transaction record.');
  return value as unknown as AdminTransaction;
}

function parseKycRecord(value: unknown): AdminKycRecord {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.verification_status !== 'string' ||
    typeof value.verification_level !== 'string' ||
    !isOptionalString(value.document_type) ||
    !isOptionalString(value.document_verification_status) ||
    !isOptionalString(value.submitted_at) ||
    !isOptionalString(value.reviewed_by) ||
    !isOptionalString(value.reviewed_at) ||
    !isOptionalString(value.approved_at) ||
    !isOptionalString(value.rejected_at) ||
    !isOptionalString(value.rejection_reason) ||
    typeof value.is_active !== 'boolean' ||
    typeof value.is_verified !== 'boolean' ||
    !isOptionalString(value.created_at)
  ) throw new Error('The server returned an invalid KYC record.');
  return value as unknown as AdminKycRecord;
}

function parseActivity(value: unknown): AdminActivityEvent {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.action !== 'string' ||
    !isOptionalString(value.category) ||
    !isOptionalString(value.description) ||
    typeof value.actor_type !== 'string' ||
    !isOptionalString(value.actor_id) ||
    !isOptionalString(value.created_at)
  ) throw new Error('The server returned an invalid user activity record.');
  return value as unknown as AdminActivityEvent;
}

function parseSession(value: unknown): AdminSession {
  if (
    !isRecord(value) ||
    typeof value.session_id !== 'string' ||
    !value.session_id.trim() ||
    !isOptionalString(value.status) ||
    !isOptionalString(value.created_at) ||
    !isOptionalString(value.last_activity_at) ||
    !isOptionalString(value.expires_at) ||
    !isOptionalString(value.device_name) ||
    !isOptionalString(value.browser) ||
    !isOptionalString(value.operating_system)
  ) throw new Error('The server returned an invalid session record.');
  return value as unknown as AdminSession;
}

function parseSessionEvent(value: unknown): AdminSessionEvent {
  if (!isRecord(value) || typeof value.action !== 'string' || typeof value.timestamp !== 'string') {
    throw new Error('The server returned an invalid session event.');
  }
  return { action: value.action, timestamp: value.timestamp };
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function parseAdminUser(value: unknown): AdminUser {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    !isNullableString(value.first_name) ||
    !isNullableString(value.last_name) ||
    typeof value.email !== 'string' ||
    !isNullableString(value.username) ||
    !isNullableString(value.phone) ||
    typeof value.status !== 'string' ||
    typeof value.is_active !== 'boolean' ||
    typeof value.is_blocked !== 'boolean' ||
    typeof value.is_suspended !== 'boolean' ||
    typeof value.is_email_verified !== 'boolean' ||
    typeof value.is_phone_verified !== 'boolean' ||
    !isNullableString(value.last_login_at) ||
    typeof value.created_at !== 'string' ||
    typeof value.updated_at !== 'string'
  ) {
    throw new Error('The server returned an invalid user profile.');
  }
  return {
    id: value.id,
    first_name: value.first_name,
    last_name: value.last_name,
    email: value.email,
    username: value.username,
    phone: value.phone,
    status: value.status,
    is_active: value.is_active,
    is_blocked: value.is_blocked,
    is_suspended: value.is_suspended,
    is_email_verified: value.is_email_verified,
    is_phone_verified: value.is_phone_verified,
    last_login_at: value.last_login_at,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

function parseAdminUserList(value: unknown): AdminUserList {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !Number.isInteger(value.page) ||
    !Number.isInteger(value.page_size) ||
    !Number.isInteger(value.total) ||
    !Number.isInteger(value.total_pages)
  ) {
    throw new Error('The server returned an invalid user list.');
  }
  return {
    items: value.items.map(parseAdminUser),
    page: value.page as number,
    page_size: value.page_size as number,
    total: value.total as number,
    total_pages: value.total_pages as number,
  };
}

export async function fetchAdminUsers(query: AdminUserListQuery): Promise<AdminUserList> {
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(query.page_size),
    sort_by: query.sort_by,
    sort_order: query.sort_order,
  });
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.status) params.set('status', query.status);
  return parseAdminUserList(await requestAdminApi(`/admin/users?${params.toString()}`));
}

export async function fetchAdminUser(userId: string): Promise<AdminUser> {
  return parseAdminUser(await requestAdminApi(`/admin/users/${encodeURIComponent(userId)}`));
}

export async function manageAdminUser(
  userId: string,
  action: AdminUserStatusAction,
  reason: string,
): Promise<AdminUser> {
  const result = await requestAdminApi(`/admin/users/${encodeURIComponent(userId)}/manage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reason: reason.trim() || null }),
  });
  if (!isRecord(result) || result.action !== action) {
    throw new Error('The server returned an invalid account-management response.');
  }
  return parseAdminUser(result.user);
}

export interface AdminWalletListQuery {
  page: number;
  page_size: number;
  search?: string;
  status?: string;
  currency?: string;
}

export async function fetchAdminWallets(query: AdminWalletListQuery): Promise<AdminWalletList> {
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(query.page_size),
  });
  if (query.search?.trim()) params.set('query', query.search.trim());
  if (query.status?.trim()) params.set('status', query.status.trim());
  if (query.currency?.trim()) params.set('currency', query.currency.trim());

  const response = unwrapServiceData(await requestAdminApi(`/admin/wallets?${params.toString()}`));
  if (
    !isRecord(response) ||
    !Array.isArray(response.items) ||
    !Number.isInteger(response.total_wallets) ||
    !Array.isArray(response.currencies) ||
    !response.currencies.every((currency) => typeof currency === 'string')
  ) {
    throw new Error('The server returned an invalid wallet list.');
  }

  const total = Number(response.total ?? 0);
  const pageSize = Number.isInteger(response.page_size) ? Number(response.page_size) : query.page_size;
  const page = Number.isInteger(response.page) ? Number(response.page) : query.page;
  const totalPages = Number.isInteger(response.total_pages)
    ? Number(response.total_pages)
    : Math.max(1, Math.ceil(total / Math.max(pageSize, 1)) || 1);

  return {
    items: response.items.map(parseWallet),
    page,
    page_size: pageSize,
    total,
    total_pages: totalPages,
    total_wallets: response.total_wallets as number,
    currencies: response.currencies as string[],
  };
}

export async function fetchAdminWalletById(walletId: string): Promise<AdminWallet> {
  const response = unwrapServiceData(await requestAdminApi(
    `/admin/wallets/${encodeURIComponent(walletId)}`,
  ));
  return parseWallet(response);
}

export async function fetchAdminWallet(userId: string): Promise<AdminWallet | null> {
  const response = await requestAdminApi(`/admin/users/${encodeURIComponent(userId)}/wallet`);
  if (!isRecord(response) || !Object.prototype.hasOwnProperty.call(response, 'wallet')) {
    throw new Error('The server returned an invalid wallet response.');
  }
  return response.wallet === null ? null : parseWallet(response.wallet);
}

export async function adjustAdminWallet(payload: {
  user_id: string;
  wallet_id: string;
  amount: string;
  currency: string;
  reason: string;
  reference: string;
}): Promise<Record<string, unknown>> {
  try {
    const response = await requestAdminApi('/admin/wallets/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, { retryOnUnauthorized: false });
    if (
      !isRecord(response) ||
      response.success !== true ||
      !isRecord(response.data) ||
      !isRecord(response.data.result) ||
      response.data.result.status !== 'success' ||
      response.data.reference !== payload.reference ||
      response.data.operation !== (payload.amount.startsWith('-') ? 'manual_debit' : 'manual_credit') ||
      typeof response.data.idempotent !== 'boolean'
    ) {
      throw new AdminWalletAdjustmentError(
        'The server response did not confirm this adjustment. Its outcome is uncertain.',
        true,
      );
    }
    return response.data;
  } catch (error) {
    if (error instanceof AdminWalletAdjustmentError) throw error;
    const outcomeUnknown = !(error instanceof AdminAuthError) ||
      error.status === undefined ||
      error.status >= 500;
    throw new AdminWalletAdjustmentError(
      error instanceof Error ? error.message : 'The adjustment outcome is uncertain.',
      outcomeUnknown,
    );
  }
}

export class AdminWalletAdjustmentError extends Error {
  constructor(message: string, readonly outcomeUnknown: boolean) {
    super(message);
    this.name = 'AdminWalletAdjustmentError';
  }
}

export async function fetchAdminWalletLedger(
  userId: string,
  walletId: string,
  page: number,
  pageSize: number,
): Promise<AdminPage<AdminLedgerEntry>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  const response = unwrapServiceData(await requestAdminApi(
    `/admin/users/${encodeURIComponent(userId)}/wallets/${encodeURIComponent(walletId)}/ledger?${params.toString()}`,
  ));
  return parsePage(response, parseLedgerEntry, 'The server returned an invalid wallet ledger.');
}

export interface AdminWalletLedgerReferenceLookup {
  total: number;
  items: AdminLedgerEntry[];
}

export async function fetchAdminWalletLedgerByReference(
  userId: string,
  walletId: string,
  transactionReference: string,
): Promise<AdminWalletLedgerReferenceLookup> {
  const params = new URLSearchParams({ transaction_reference: transactionReference });
  const response = unwrapServiceData(await requestAdminApi(
    `/admin/users/${encodeURIComponent(userId)}/wallets/${encodeURIComponent(walletId)}/ledger/reference?${params.toString()}`,
  ));
  if (
    !isRecord(response) ||
    !Number.isInteger(response.total) ||
    !Array.isArray(response.items) ||
    response.items.length > 2
  ) {
    throw new Error('The server returned an invalid wallet ledger reference lookup.');
  }
  return {
    total: response.total as number,
    items: response.items.map(parseLedgerEntry),
  };
}

export async function fetchAdminUserTransactions(
  userId: string,
  query: AdminTransactionQuery,
): Promise<AdminPage<AdminTransaction>> {
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(query.page_size),
    order_by: 'created_at',
    descending: 'true',
  });
  for (const [key, value] of Object.entries(query)) {
    if (key !== 'page' && key !== 'page_size' && value?.trim()) params.set(key, value.trim());
  }
  const response = unwrapServiceData(await requestAdminApi(
    `/admin/users/${encodeURIComponent(userId)}/transactions?${params.toString()}`,
  ));
  return parsePage(response, parseTransaction, 'The server returned an invalid transaction list.');
}

export async function fetchAdminUserTransaction(
  userId: string,
  transactionId: string,
): Promise<AdminTransaction> {
  const response = unwrapServiceData(await requestAdminApi(
    `/admin/users/${encodeURIComponent(userId)}/transactions/${encodeURIComponent(transactionId)}`,
  ));
  return parseTransaction(response);
}

export async function fetchAdminUserKyc(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<AdminPage<AdminKycRecord>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  const response = await requestAdminApi(`/admin/users/${encodeURIComponent(userId)}/kyc?${params.toString()}`);
  return parsePage(response, parseKycRecord, 'The server returned an invalid KYC response.');
}

export async function reviewAdminUserKyc(
  userId: string,
  kycId: string,
  approvalStatus: 'approved' | 'rejected',
  reviewNotes: string,
): Promise<AdminKycRecord> {
  const response = unwrapServiceData(await requestAdminApi(
    `/admin/users/${encodeURIComponent(userId)}/kyc/${encodeURIComponent(kycId)}/review`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approval_status: approvalStatus, review_notes: reviewNotes.trim() }),
    },
  ));
  return parseKycRecord(response);
}

export async function fetchAdminUserActivity(
  userId: string,
  page: number,
  pageSize: number,
): Promise<AdminPage<AdminActivityEvent>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  const response = await requestAdminApi(`/admin/users/${encodeURIComponent(userId)}/activity?${params.toString()}`);
  return parsePage(response, parseActivity, 'The server returned an invalid activity response.');
}

export async function fetchAdminUserSessions(userId: string): Promise<AdminSession[]> {
  const response = unwrapServiceData(await requestAdminApi(`/admin/users/${encodeURIComponent(userId)}/sessions`));
  if (!Array.isArray(response)) throw new Error('The server returned an invalid session list.');
  return response.map(parseSession);
}

export async function revokeAdminUserSession(
  userId: string,
  sessionId: string,
  reason: string,
): Promise<void> {
  const params = new URLSearchParams({ reason: reason.trim() });
  await requestAdminApi(
    `/admin/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}/revoke?${params.toString()}`,
    { method: 'POST' },
  );
}

export async function fetchAdminUserSessionHistory(
  userId: string,
  page: number,
  pageSize: number,
): Promise<AdminPage<AdminSessionEvent>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  const response = unwrapServiceData(await requestAdminApi(
    `/admin/users/${encodeURIComponent(userId)}/sessions/history?${params.toString()}`,
  ));
  return parsePage(response, parseSessionEvent, 'The server returned an invalid session history response.');
}

export async function revokeAdminUserSessions(userId: string, reason: string): Promise<number> {
  const params = new URLSearchParams({ reason: reason.trim() });
  const response = unwrapServiceData(await requestAdminApi(
    `/admin/users/${encodeURIComponent(userId)}/sessions/revoke-all?${params.toString()}`,
    { method: 'POST' },
  ));
  if (!isRecord(response) || typeof response.revoked_count !== 'number') {
    throw new Error('The server returned an invalid session revocation response.');
  }
  return response.revoked_count;
}
