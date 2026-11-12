import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestAdminApi } from './adminAuth';
import { fetchAdminFraud, parseAdminFraudData, reviewFraudSignal } from './adminFraud';

vi.mock('./adminAuth', () => ({ requestAdminApi: vi.fn() }));

const request = vi.mocked(requestAdminApi);

const signal = {
  signal_id: 'transaction:tx-1',
  signal_type: 'transaction',
  evidence_id: 'tx-1',
  user_id: 'user-1',
  user: 'Ada Lovelace',
  risk_score: 72,
  risk_level: 'HIGH',
  classification: 'suspicious_signal',
  risk_reasons: ['Transaction status is failed.'],
  date_label: 'transaction_created',
  txn_id: 'ref-1',
  amount: '100.00',
  type: 'purchase',
  event_type: 'airtime',
  provider: null,
  date: '2026-01-01T10:00:00Z',
  status: 'failed',
  failed_attempts: null,
  locked_until: null,
  investigation: null,
};

const response = {
  items: [signal],
  page: 2,
  page_size: 10,
  total: 11,
  total_pages: 2,
  summary: {
    total_alerts: 11,
    suspicious_transactions: 8,
    accounts_with_failed_logins: 2,
    account_security_signals: 3,
    high_risk_accounts: 2,
    risk_flags: { LOW: 1, MEDIUM: 2, HIGH: 5, CRITICAL: 3 },
  },
  device_history: [{
    id: 'audit-device',
    user_id: 'user-1',
    user: 'Ada Lovelace',
    device: 'device-1',
    status: 'Login Succeeded',
    time: '2026-01-01T10:00:00Z',
    ip_address: '192.0.2.1',
  }],
  ip_history: [{
    id: 'audit-ip',
    user_id: 'user-2',
    user: 'Grace Hopper',
    ip: '192.0.2.2',
    time: '2026-01-01T11:00:00Z',
  }],
};

describe('admin fraud API service', () => {
  beforeEach(() => request.mockReset());

  it('parses the paginated response and independent device/IP events', () => {
    const accountSignal = {
      ...signal,
      signal_id: 'account_security:user-2',
      signal_type: 'account_security',
      evidence_id: 'user-2',
      classification: 'suspicious_signal',
      risk_reasons: ['Currently recorded failed-login attempts: 3.'],
      date_label: 'account_record_updated',
      txn_id: null,
      amount: null,
      type: 'authentication',
      event_type: 'authentication',
      status: 'locked',
      failed_attempts: 3,
      locked_until: '2026-01-01T11:00:00Z',
    };
    const parsed = parseAdminFraudData({ ...response, items: [signal, accountSignal] });
    expect(parsed).toMatchObject({
      page: 2,
      page_size: 10,
      total: 11,
      total_pages: 2,
      summary: {
        total_alerts: 11,
        accounts_with_failed_logins: 2,
        risk_flags: { HIGH: 5 },
      },
      items: [
        { signal_id: 'transaction:tx-1', classification: 'suspicious_signal' },
        { signal_id: 'account_security:user-2', date_label: 'account_record_updated' },
      ],
      device_history: [{ id: 'audit-device', ip_address: '192.0.2.1' }],
      ip_history: [{ id: 'audit-ip', user_id: 'user-2', ip: '192.0.2.2' }],
    });
    expect(parsed.items[1]).toMatchObject({
      signal_type: 'account_security',
      date_label: 'account_record_updated',
    });
  });

  it('sends supported server-side filters and page parameters', async () => {
    request.mockResolvedValue(response);

    await fetchAdminFraud({
      page: 2,
      page_size: 10,
      search: ' Ada ',
      status: 'failed',
      risk_level: 'HIGH',
      event_type: 'airtime',
    });

    expect(request).toHaveBeenCalledWith(
      '/admin/fraud?page=2&page_size=10&search=Ada&status=failed&risk_level=HIGH&event_type=airtime',
    );
  });

  it('posts only the signal and supported action and parses saved review state', async () => {
    request.mockResolvedValue({
      signal_id: 'transaction:tx-1',
      investigation: {
        id: 'case-1',
        state: 'in_review',
        reviewed_by_admin_id: 'admin-1',
        updated_at: '2026-01-01T12:00:00Z',
      },
    });

    const result = await reviewFraudSignal({ signal_id: 'transaction:tx-1', action: 'review' });

    expect(result.investigation.state).toBe('in_review');
    expect(request).toHaveBeenCalledWith(
      '/admin/fraud/review',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ signal_id: 'transaction:tx-1', action: 'review' }),
      }),
    );
  });

  it('rejects incomplete or fabricated response shapes instead of silently defaulting', () => {
    expect(() => parseAdminFraudData({ ...response, total: undefined })).toThrow(/total count/);
    expect(() => parseAdminFraudData({
      ...response,
      summary: { ...response.summary, accounts_with_failed_logins: undefined },
    })).toThrow(/accounts with failed-logins count/);
    expect(() => parseAdminFraudData({
      ...response,
      items: [{ ...signal, classification: 'confirmed_fraud' }],
    })).toThrow(/classification/);
  });
});
