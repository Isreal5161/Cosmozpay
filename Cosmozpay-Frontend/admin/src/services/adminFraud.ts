import { requestAdminApi } from './adminAuth';

export type FraudRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FraudInvestigationState = 'open' | 'in_review' | 'escalated' | 'dismissed' | 'resolved';
export type FraudReviewAction = 'review' | 'dismiss' | 'escalate' | 'resolve';

export interface FraudSummary {
  total_alerts: number;
  suspicious_transactions: number;
  accounts_with_failed_logins: number;
  account_security_signals: number;
  high_risk_accounts: number;
  risk_flags: Record<FraudRiskLevel, number>;
}

export interface FraudInvestigation {
  id: string;
  state: FraudInvestigationState;
  reviewed_by_admin_id: string;
  updated_at: string;
}

export interface FraudSignal {
  signal_id: string;
  signal_type: 'transaction' | 'account_security';
  evidence_id: string;
  user_id: string;
  user: string;
  risk_score: number;
  risk_level: FraudRiskLevel;
  classification: 'suspicious_signal';
  risk_reasons: string[];
  date_label: 'transaction_created' | 'account_record_updated';
  txn_id: string | null;
  amount: string | null;
  type: string;
  event_type: string;
  provider: string | null;
  date: string;
  status: string;
  failed_attempts: number | null;
  locked_until: string | null;
  investigation: FraudInvestigation | null;
}

export interface FraudDeviceEvent {
  id: string;
  user_id: string | null;
  user: string;
  device: string;
  status: string;
  time: string;
  ip_address: string | null;
}

export interface FraudIpEvent {
  id: string;
  user_id: string | null;
  user: string;
  ip: string | null;
  time: string;
}

export interface AdminFraudData {
  items: FraudSignal[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  summary: FraudSummary;
  device_history: FraudDeviceEvent[];
  ip_history: FraudIpEvent[];
}

export interface FraudFilters {
  page: number;
  page_size: number;
  search?: string;
  status?: string;
  risk_level?: FraudRiskLevel | '';
  event_type?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`The fraud service returned an invalid ${label}.`);
  return value;
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`The fraud service returned an invalid ${label}.`);
  return value;
}

function requiredNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`The fraud service returned an invalid ${label}.`);
  }
  return value;
}

function nullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return requiredString(value, label);
}

function parseRiskLevel(value: unknown): FraudRiskLevel {
  if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'CRITICAL') return value;
  throw new Error('The fraud service returned an invalid risk level.');
}

function parseInvestigation(value: unknown): FraudInvestigation | null {
  if (value === null) return null;
  const record = requireRecord(value, 'investigation');
  const state = requiredString(record.state, 'investigation state');
  if (!['open', 'in_review', 'escalated', 'dismissed', 'resolved'].includes(state)) {
    throw new Error('The fraud service returned an invalid investigation state.');
  }
  return {
    id: requiredString(record.id, 'investigation id'),
    state: state as FraudInvestigationState,
    reviewed_by_admin_id: requiredString(record.reviewed_by_admin_id, 'reviewer id'),
    updated_at: requiredString(record.updated_at, 'investigation update time'),
  };
}

function parseFraudSignal(value: unknown): FraudSignal {
  const record = requireRecord(value, 'signal');
  const signalType = requiredString(record.signal_type, 'signal type');
  if (signalType !== 'transaction' && signalType !== 'account_security') {
    throw new Error('The fraud service returned an unsupported signal type.');
  }
  if (record.classification !== 'suspicious_signal') {
    throw new Error('The fraud service returned an invalid signal classification.');
  }
  if (!Array.isArray(record.risk_reasons) || !record.risk_reasons.every((reason) => typeof reason === 'string')) {
    throw new Error('The fraud service returned invalid signal explanations.');
  }
  const riskScore = requiredNumber(record.risk_score, 'risk score');
  const dateLabel = requiredString(record.date_label, 'signal time label');
  if (dateLabel !== 'transaction_created' && dateLabel !== 'account_record_updated') {
    throw new Error('The fraud service returned an invalid signal time label.');
  }
  const failedAttempts = record.failed_attempts === null
    ? null
    : requiredNumber(record.failed_attempts, 'failed-attempt count');
  return {
    signal_id: requiredString(record.signal_id, 'signal id'),
    signal_type: signalType,
    evidence_id: requiredString(record.evidence_id, 'evidence id'),
    user_id: requiredString(record.user_id, 'user id'),
    user: requiredString(record.user, 'user label'),
    risk_score: riskScore,
    risk_level: parseRiskLevel(record.risk_level),
    classification: 'suspicious_signal',
    risk_reasons: record.risk_reasons,
    date_label: dateLabel,
    txn_id: nullableString(record.txn_id, 'transaction reference'),
    amount: nullableString(record.amount, 'amount'),
    type: requiredString(record.type, 'signal category'),
    event_type: requiredString(record.event_type, 'event type'),
    provider: nullableString(record.provider, 'provider'),
    date: requiredString(record.date, 'signal time'),
    status: requiredString(record.status, 'signal status'),
    failed_attempts: failedAttempts,
    locked_until: nullableString(record.locked_until, 'lock expiration'),
    investigation: parseInvestigation(record.investigation),
  };
}

export function parseAdminFraudData(value: unknown): AdminFraudData {
  const record = requireRecord(value, 'response data');
  if (!Array.isArray(record.items) || !Array.isArray(record.device_history) || !Array.isArray(record.ip_history)) {
    throw new Error('The fraud service returned incomplete lists.');
  }
  const summaryRecord = requireRecord(record.summary, 'summary');
  const riskRecord = requireRecord(summaryRecord.risk_flags, 'risk distribution');
  const riskFlags = {
    LOW: requiredNumber(riskRecord.LOW, 'LOW risk count'),
    MEDIUM: requiredNumber(riskRecord.MEDIUM, 'MEDIUM risk count'),
    HIGH: requiredNumber(riskRecord.HIGH, 'HIGH risk count'),
    CRITICAL: requiredNumber(riskRecord.CRITICAL, 'CRITICAL risk count'),
  };
  const deviceHistory = record.device_history.map((item) => {
    const row = requireRecord(item, 'device activity');
    return {
      id: requiredString(row.id, 'device activity id'),
      user_id: nullableString(row.user_id, 'device activity user id'),
      user: requiredString(row.user, 'device activity user'),
      device: requiredString(row.device, 'device reference'),
      status: requiredString(row.status, 'device activity status'),
      time: requiredString(row.time, 'device activity time'),
      ip_address: nullableString(row.ip_address, 'device activity IP address'),
    };
  });
  const ipHistory = record.ip_history.map((item) => {
    const row = requireRecord(item, 'IP activity');
    return {
      id: requiredString(row.id, 'IP activity id'),
      user_id: nullableString(row.user_id, 'IP activity user id'),
      user: requiredString(row.user, 'IP activity user'),
      ip: nullableString(row.ip, 'IP address'),
      time: requiredString(row.time, 'IP activity time'),
    };
  });
  return {
    items: record.items.map(parseFraudSignal),
    page: requiredNumber(record.page, 'page'),
    page_size: requiredNumber(record.page_size, 'page size'),
    total: requiredNumber(record.total, 'total count'),
    total_pages: requiredNumber(record.total_pages, 'total pages'),
    summary: {
      total_alerts: requiredNumber(summaryRecord.total_alerts, 'alert count'),
      suspicious_transactions: requiredNumber(summaryRecord.suspicious_transactions, 'transaction count'),
      accounts_with_failed_logins: requiredNumber(
        summaryRecord.accounts_with_failed_logins,
        'accounts with failed-logins count',
      ),
      account_security_signals: requiredNumber(summaryRecord.account_security_signals, 'account-security signal count'),
      high_risk_accounts: requiredNumber(summaryRecord.high_risk_accounts, 'high-risk account count'),
      risk_flags: riskFlags,
    },
    device_history: deviceHistory,
    ip_history: ipHistory,
  };
}

export async function fetchAdminFraud(filters: FraudFilters): Promise<AdminFraudData> {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('page_size', String(filters.page_size));
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.status) params.set('status', filters.status);
  if (filters.risk_level) params.set('risk_level', filters.risk_level);
  if (filters.event_type?.trim()) params.set('event_type', filters.event_type.trim());
  const data = await requestAdminApi(`/admin/fraud?${params.toString()}`);
  return parseAdminFraudData(data);
}

export async function reviewFraudSignal(input: {
  signal_id: string;
  action: FraudReviewAction;
  reason?: string;
}): Promise<{ signal_id: string; investigation: FraudInvestigation }> {
  const raw = requireRecord(
    await requestAdminApi('/admin/fraud/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
    'review response',
  );
  const investigation = parseInvestigation(raw.investigation);
  if (!investigation) throw new Error('The fraud service did not return the saved investigation.');
  return {
    signal_id: requiredString(raw.signal_id, 'reviewed signal id'),
    investigation,
  };
}
