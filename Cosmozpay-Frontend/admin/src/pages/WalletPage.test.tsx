import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import WalletPage from './WalletPage';
import { fetchAdminWallets, type AdminWalletList } from '../services/adminUsers';

vi.mock('../auth/AdminAuthContext', () => ({ useAdminAuth: vi.fn() }));
vi.mock('../services/adminUsers', () => ({
  adjustAdminWallet: vi.fn(),
  AdminWalletAdjustmentError: class AdminWalletAdjustmentError extends Error {},
  fetchAdminWalletById: vi.fn(),
  fetchAdminWalletLedgerByReference: vi.fn(),
  fetchAdminWallets: vi.fn(),
}));

const fetchWallets = vi.mocked(fetchAdminWallets);
const adminAuth = vi.mocked(useAdminAuth);

const wallet = {
  id: 'wallet-1',
  user_id: 'user-1',
  user_name: 'Ada Lovelace',
  user_email: 'ada@example.test',
  user_phone: null,
  wallet_reference: 'wallet-ref-1',
  wallet_type: 'customer',
  currency: 'NGN',
  status: 'active',
  available_balance: '123456789.01',
  ledger_balance: '123456789.01',
  locked_balance: '0.00',
  is_active: true,
  is_frozen: false,
  is_suspended: false,
  created_at: '2026-01-01T10:00:00Z',
  updated_at: '2026-01-01T10:00:00Z',
};

function walletPage(page = 1, items = [wallet]): AdminWalletList {
  return {
    items,
    page,
    page_size: 10,
    total: 11,
    total_pages: 2,
    total_wallets: 11,
    currencies: ['NGN', 'USD'],
  };
}

function authState(): ReturnType<typeof useAdminAuth> {
  return {
    admin: { id: 'admin-1', role: 'admin', status: 'active', is_active: true },
    isAuthenticated: true,
    isInitializing: false,
    login: vi.fn(async () => false),
    verifyMfa: vi.fn(async () => undefined),
    logout: vi.fn(async () => undefined),
    refreshSession: vi.fn(async () => undefined),
  };
}

describe('Admin Wallet page', () => {
  beforeEach(() => {
    sessionStorage.clear();
    adminAuth.mockReturnValue(authState());
    fetchWallets.mockReset();
    fetchWallets.mockImplementation(async ({ page }) => walletPage(page));
  });

  afterEach(cleanup);

  it('loads real wallet records using page size ten and displays exact decimal strings', async () => {
    render(<WalletPage />);

    expect(screen.getByText('Loading wallet directory…')).toBeTruthy();
    expect(await screen.findByText('wallet-ref-1')).toBeTruthy();
    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(fetchWallets).toHaveBeenCalledWith({
      page: 1,
      page_size: 10,
      search: undefined,
      status: undefined,
      currency: undefined,
    });
  });

  it('renders the empty state and retries a failed request', async () => {
    fetchWallets.mockRejectedValueOnce(new Error('Wallet service unavailable'))
      .mockResolvedValueOnce(walletPage(1, []));
    render(<WalletPage />);

    expect((await screen.findByRole('alert')).textContent).toContain('Wallet service unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading wallets' }));
    expect(await screen.findByText('No wallets match the current search or filters.')).toBeTruthy();

    cleanup();
    fetchWallets.mockResolvedValueOnce({
      ...walletPage(1, []),
      total_wallets: 0,
      total: 0,
      total_pages: 0,
      currencies: [],
    });
    render(<WalletPage />);
    expect(await screen.findByText('No user wallets available at this moment.')).toBeTruthy();
  });

  it('sends search and pagination filters to the backend', async () => {
    render(<WalletPage />);
    await screen.findByText('wallet-ref-1');

    fireEvent.change(
      screen.getByLabelText('Search wallet and user IDs, wallet references, and user name, email, or phone'),
      { target: { value: 'Ada' } },
    );
    await waitFor(() => expect(fetchWallets).toHaveBeenLastCalledWith(expect.objectContaining({
      page: 1,
      search: 'Ada',
    })));

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(fetchWallets).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
  });
});
