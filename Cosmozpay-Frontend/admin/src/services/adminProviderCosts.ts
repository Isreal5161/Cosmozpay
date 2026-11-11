import { requestAdminApi } from './adminAuth';

export interface ProviderCostProvider {
  id: string;
  name: string;
  code: string;
  category: string;
  is_active: boolean;
}

export interface ProviderCostConfiguration {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_code: string;
  provider_category: string;
  service_type: string;
  network_identifier: string | null;
  product_identifier: string | null;
  currency: string;
  cost_method: 'fixed_amount' | 'percentage_of_selling_amount';
  cost_value: string;
  source_class: 'ADMIN_CONFIGURED';
  is_active: boolean;
  effective_from: string;
  effective_until: string | null;
  evidence_note: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderCostSnapshot {
  transaction_id: string;
  reference: string;
  provider_identifier: string | null;
  provider_reference: string | null;
  service_type: string;
  network_identifier: string | null;
  product_identifier: string | null;
  selling_amount: string;
  currency: string;
  cost_amount: string | null;
  gross_margin: string | null;
  source_class: string;
  reason: string | null;
  configuration_id: string | null;
  created_at: string | null;
}

export interface ProviderCostAwaitingTransaction {
  transaction_id: string;
  reference: string;
  service_type: string;
  provider_identifier: string | null;
  provider_reference: string | null;
  selling_amount: string;
  currency: string;
  status: string;
  source_class: string;
  reason: string;
  created_at: string | null;
}

export interface ProviderCostPage<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ProviderCostConfigurationInput {
  provider_id: string;
  service_type: string;
  network_identifier?: string | null;
  product_identifier?: string | null;
  currency: string;
  cost_method: 'fixed_amount' | 'percentage_of_selling_amount';
  cost_value: string;
  effective_from: string;
  effective_until?: string | null;
  evidence_note: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrap(value: unknown): unknown {
  return isRecord(value) && value.success === true && Object.prototype.hasOwnProperty.call(value, 'data')
    ? value.data
    : value;
}

function string(value: Record<string, unknown>, key: string): string {
  if (typeof value[key] !== 'string') throw new Error('The server returned invalid provider cost data.');
  return value[key];
}

function nullableString(value: Record<string, unknown>, key: string): string | null {
  if (value[key] !== null && value[key] !== undefined && typeof value[key] !== 'string') {
    throw new Error('The server returned invalid provider cost data.');
  }
  return typeof value[key] === 'string' ? value[key] : null;
}

function integer(value: Record<string, unknown>, key: string): number {
  if (typeof value[key] !== 'number' || !Number.isInteger(value[key])) {
    throw new Error('The server returned invalid provider-cost pagination data.');
  }
  return value[key];
}

function parsePage<T>(value: unknown, parseItem: (item: unknown) => T): ProviderCostPage<T> {
  const data = unwrap(value);
  if (!isRecord(data) || !Array.isArray(data.items)) throw new Error('The server returned invalid provider cost data.');
  return {
    items: data.items.map(parseItem),
    page: integer(data, 'page'),
    page_size: integer(data, 'page_size'),
    total: integer(data, 'total'),
    total_pages: integer(data, 'total_pages'),
  };
}

function parseProvider(item: unknown): ProviderCostProvider {
  if (!isRecord(item) || typeof item.is_active !== 'boolean') throw new Error('The server returned invalid provider data.');
  return {
    id: string(item, 'id'),
    name: string(item, 'name'),
    code: string(item, 'code'),
    category: string(item, 'category'),
    is_active: item.is_active,
  };
}

function parseConfiguration(item: unknown): ProviderCostConfiguration {
  if (!isRecord(item) || typeof item.is_active !== 'boolean') throw new Error('The server returned invalid configuration data.');
  const method = string(item, 'cost_method');
  if (method !== 'fixed_amount' && method !== 'percentage_of_selling_amount') {
    throw new Error('The server returned an unsupported provider cost method.');
  }
  return {
    id: string(item, 'id'),
    provider_id: string(item, 'provider_id'),
    provider_name: string(item, 'provider_name'),
    provider_code: string(item, 'provider_code'),
    provider_category: string(item, 'provider_category'),
    service_type: string(item, 'service_type'),
    network_identifier: nullableString(item, 'network_identifier'),
    product_identifier: nullableString(item, 'product_identifier'),
    currency: string(item, 'currency'),
    cost_method: method,
    cost_value: string(item, 'cost_value'),
    source_class: 'ADMIN_CONFIGURED',
    is_active: item.is_active,
    effective_from: string(item, 'effective_from'),
    effective_until: nullableString(item, 'effective_until'),
    evidence_note: string(item, 'evidence_note'),
    created_by: string(item, 'created_by'),
    updated_by: string(item, 'updated_by'),
    created_at: string(item, 'created_at'),
    updated_at: string(item, 'updated_at'),
  };
}

function parseSnapshot(item: unknown): ProviderCostSnapshot {
  if (!isRecord(item)) throw new Error('The server returned invalid cost evidence.');
  return {
    transaction_id: string(item, 'transaction_id'),
    reference: string(item, 'reference'),
    provider_identifier: nullableString(item, 'provider_identifier'),
    provider_reference: nullableString(item, 'provider_reference'),
    service_type: string(item, 'service_type'),
    network_identifier: nullableString(item, 'network_identifier'),
    product_identifier: nullableString(item, 'product_identifier'),
    selling_amount: string(item, 'selling_amount'),
    currency: string(item, 'currency'),
    cost_amount: nullableString(item, 'cost_amount'),
    gross_margin: nullableString(item, 'gross_margin'),
    source_class: string(item, 'source_class'),
    reason: nullableString(item, 'reason'),
    configuration_id: nullableString(item, 'configuration_id'),
    created_at: nullableString(item, 'created_at'),
  };
}

function parseAwaiting(item: unknown): ProviderCostAwaitingTransaction {
  if (!isRecord(item)) throw new Error('The server returned invalid awaiting transaction data.');
  return {
    transaction_id: string(item, 'transaction_id'),
    reference: string(item, 'reference'),
    service_type: string(item, 'service_type'),
    provider_identifier: nullableString(item, 'provider_identifier'),
    provider_reference: nullableString(item, 'provider_reference'),
    selling_amount: string(item, 'selling_amount'),
    currency: string(item, 'currency'),
    status: string(item, 'status'),
    source_class: string(item, 'source_class'),
    reason: string(item, 'reason'),
    created_at: nullableString(item, 'created_at'),
  };
}

function queryString(filters: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}

function requireRecord(value: unknown): Record<string, unknown> {
  const data = unwrap(value);
  if (!isRecord(data)) throw new Error('The server returned invalid provider cost data.');
  return data;
}

export async function fetchProviderCostProviders(): Promise<ProviderCostProvider[]> {
  const data = unwrap(await requestAdminApi('/admin/provider-costs/providers'));
  if (!Array.isArray(data)) throw new Error('The server returned invalid provider data.');
  return data.map(parseProvider);
}

export async function fetchProviderCostConfigurations(filters: {
  page: number;
  page_size: number;
  provider_id?: string;
  service_type?: string;
  currency?: string;
  is_active?: boolean;
}): Promise<ProviderCostPage<ProviderCostConfiguration>> {
  return parsePage(
    await requestAdminApi(`/admin/provider-costs/configurations?${queryString(filters)}`),
    parseConfiguration,
  );
}

export async function createProviderCostConfiguration(
  payload: ProviderCostConfigurationInput,
): Promise<ProviderCostConfiguration> {
  return parseConfiguration(await requestAdminApi('/admin/provider-costs/configurations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
}

export async function updateProviderCostConfiguration(
  id: string,
  payload: ProviderCostConfigurationInput,
): Promise<ProviderCostConfiguration> {
  return parseConfiguration(await requestAdminApi(
    `/admin/provider-costs/configurations/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  ));
}

export async function deactivateProviderCostConfiguration(id: string): Promise<ProviderCostConfiguration> {
  return parseConfiguration(await requestAdminApi(
    `/admin/provider-costs/configurations/${encodeURIComponent(id)}/deactivate`,
    { method: 'POST' },
  ));
}

export async function fetchProviderCostHistory(
  id: string,
  page = 1,
): Promise<ProviderCostPage<ProviderCostConfiguration>> {
  return parsePage(
    await requestAdminApi(`/admin/provider-costs/configurations/${encodeURIComponent(id)}/history?page=${page}&page_size=20`),
    parseConfiguration,
  );
}

export async function fetchConfigurationTransactions(
  id: string,
  page = 1,
): Promise<ProviderCostPage<ProviderCostSnapshot>> {
  return parsePage(
    await requestAdminApi(`/admin/provider-costs/configurations/${encodeURIComponent(id)}/transactions?page=${page}&page_size=20`),
    parseSnapshot,
  );
}

export async function fetchProviderCostSnapshots(filters: {
  page: number;
  page_size: number;
  provider_id?: string;
  service_type?: string;
  currency?: string;
  source_class?: string;
}): Promise<ProviderCostPage<ProviderCostSnapshot>> {
  return parsePage(
    await requestAdminApi(`/admin/provider-costs/transactions?${queryString(filters)}`),
    parseSnapshot,
  );
}

export async function fetchAwaitingProviderCosts(filters: {
  page: number;
  page_size: number;
  provider_id?: string;
  service_type?: string;
  currency?: string;
}): Promise<ProviderCostPage<ProviderCostAwaitingTransaction>> {
  return parsePage(
    await requestAdminApi(`/admin/provider-costs/transactions/awaiting?${queryString(filters)}`),
    parseAwaiting,
  );
}

export async function fetchProviderCostConfiguration(id: string): Promise<ProviderCostConfiguration> {
  return parseConfiguration(await requestAdminApi(
    `/admin/provider-costs/configurations/${encodeURIComponent(id)}`,
  ));
}

export function parseProviderCostPage<T>(
  value: unknown,
  parseItem: (item: unknown) => T,
): ProviderCostPage<T> {
  return parsePage(value, parseItem);
}

export { parseAwaiting, parseConfiguration, parseSnapshot, requireRecord };
