import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import FraudPage from './FraudPage';
import {
  fetchAdminFraud,
  reviewFraudSignal,
  type AdminFraudData,
} from '../services/adminFraud';

vi.mock('../services/adminFraud', () => ({
  fetchAdminFraud: vi.fn(),
  reviewFraudSignal: vi.fn(),
}));
vi.mock('../auth/AdminAuthContext', () => ({ useAdminAuth: vi.fn() }));

const fetchFraud = vi.mocked(fetchAdminFraud);
const reviewSignal = vi.mocked(reviewFraudSignal);
const adminAuth = vi.mocked(useAdminAuth);

const item = {
  signal_id: 'transaction:tx-1',
  signal_type: 'transaction' as const,
  evidence_id: 'tx-1',
  user_id: 'user-1',
  user: 'Ada Lovelace',
  risk_score: 72,
  risk_level: 'HIGH' as const,
  classification: 'suspicious_signal' as const,
  risk_reasons: ['Transaction status is failed.'],
  date_label: 'transaction_created' as const,
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

function fraudData(page = 1, items = [item]): AdminFraudData {
  return {
    items,
    page,
    page_size: 20,
    total: 21,
    total_pages: 2,
    summary: {
      total_alerts: 21,
      suspicious_transactions: 18,
      accounts_with_failed_logins: 2,
      account_security_signals: 3,
      high_risk_accounts: 4,
      risk_flags: { LOW: 1, MEDIUM: 5, HIGH: 10, CRITICAL: 5 },
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
}

function authState(role: string): ReturnType<typeof useAdminAuth> {
  return {
    admin: { id: 'admin-1', role, status: 'active', is_active: true },
    isAuthenticated: true,
    isInitializing: false,
    login: vi.fn(async () => false),
    verifyMfa: vi.fn(async () => undefined),
    logout: vi.fn(async () => undefined),
    refreshSession: vi.fn(async () => undefined),
  };
}

describe('Admin Fraud page', () => {
  beforeEach(() => {
    adminAuth.mockReturnValue(authState('admin'));
    fetchFraud.mockReset();
    reviewSignal.mockReset();
    vi.stubGlobal('confirm', vi.fn(() => true));
    fetchFraud.mockImplementation(async ({ page }) => fraudData(page));
    reviewSignal.mockResolvedValue({
      signal_id: 'transaction:tx-1',
      investigation: {
        id: 'case-1',
        state: 'in_review',
        reviewed_by_admin_id: 'admin-1',
        updated_at: '2026-01-01T12:00:00Z',
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows loading and handles API errors with retry', async () => {
    let resolveRequest!: (value: AdminFraudData) => void;
    fetchFraud.mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve; }));
    render(<FraudPage />);
    expect(screen.getByRole('status').textContent).toContain('Loading fraud data');
    resolveRequest(fraudData());
    expect(await screen.findByText('Filtered Alerts')).toBeTruthy();
    expect(screen.getByText('Accounts with Failed Logins')).toBeTruthy();

    cleanup();
    fetchFraud.mockRejectedValueOnce(new Error('Fraud API unavailable')).mockResolvedValueOnce(fraudData());
    render(<FraudPage />);
    expect((await screen.findByRole('alert')).textContent).toContain('Fraud API unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('ref-1')).toBeTruthy();
  });

  it('sends filters and pagination to the server and renders an empty page', async () => {
    fetchFraud.mockImplementation(async ({ page }) => fraudData(page, []));
    render(<FraudPage />);
    expect(await screen.findByText('No matching suspicious signals found.')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Search signals'), { target: { value: 'Ada' } });
    await waitFor(() => expect(fetchFraud).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Ada', page: 1 })));

    fireEvent.change(screen.getByLabelText('Filter by risk level'), { target: { value: 'HIGH' } });
    await waitFor(() => expect(fetchFraud).toHaveBeenLastCalledWith(expect.objectContaining({ risk_level: 'HIGH', page: 1 })));

    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'failed' } });
    await waitFor(() => expect(fetchFraud).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'failed', page: 1 })));

    fireEvent.change(screen.getByLabelText('Filter by event type'), { target: { value: 'airtime' } });
    await waitFor(() => expect(fetchFraud).toHaveBeenLastCalledWith(expect.objectContaining({ event_type: 'airtime', page: 1 })));

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(fetchFraud).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
  });

  it('renders device and IP records independently rather than pairing by array position', async () => {
    render(<FraudPage />);
    await screen.findByText('ref-1');
    const deviceSection = screen.getByRole('heading', { name: 'Device Activity' }).closest('section');
    const ipSection = screen.getByRole('heading', { name: 'IP Activity' }).closest('section');
    expect(deviceSection).not.toBeNull();
    expect(ipSection).not.toBeNull();
    expect(within(deviceSection as HTMLElement).getByText('Ada Lovelace')).toBeTruthy();
    expect(within(deviceSection as HTMLElement).getByText('192.0.2.1')).toBeTruthy();
    expect(within(ipSection as HTMLElement).getByText('Grace Hopper')).toBeTruthy();
    expect(within(ipSection as HTMLElement).getByText('192.0.2.2')).toBeTruthy();
    expect(within(deviceSection as HTMLElement).queryByText('192.0.2.2')).toBeNull();
  });

  it('confirms review, prevents duplicate submission, and shows persisted returned state', async () => {
    let resolveReview!: (value: Awaited<ReturnType<typeof reviewFraudSignal>>) => void;
    reviewSignal.mockReturnValueOnce(new Promise((resolve) => { resolveReview = resolve; }));
    render(<FraudPage />);
    await screen.findByText('ref-1');
    const reviewButton = screen.getByRole('button', { name: 'review transaction:tx-1' });
    fireEvent.click(reviewButton);

    await waitFor(() => expect(reviewSignal).toHaveBeenCalledWith({
      signal_id: 'transaction:tx-1',
      action: 'review',
    }));
    expect(window.confirm).toHaveBeenCalled();
    expect(reviewButton.hasAttribute('disabled')).toBe(true);
    fireEvent.click(reviewButton);
    expect(reviewSignal).toHaveBeenCalledTimes(1);
    resolveReview({
      signal_id: 'transaction:tx-1',
      investigation: {
        id: 'case-1',
        state: 'in_review',
        reviewed_by_admin_id: 'admin-1',
        updated_at: '2026-01-01T12:00:00Z',
      },
    });
    expect(await screen.findByText('in_review')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'resolve transaction:tx-1' })).toBeTruthy();
  });

  it.each([
    ['admin', true],
    ['super_admin', true],
    ['support', false],
    ['auditor', false],
  ])('%s can view fraud signals; review controls follow role permissions', async (role, canReview) => {
    adminAuth.mockReturnValue(authState(role));
    render(<FraudPage />);

    expect(await screen.findByText('ref-1')).toBeTruthy();
    if (canReview) {
      expect(screen.getByRole('button', { name: 'review transaction:tx-1' })).toBeTruthy();
    } else {
      expect(screen.getByText('Read-only access')).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'review transaction:tx-1' })).toBeNull();
    }
    expect(fetchFraud).toHaveBeenCalled();
  });
});
