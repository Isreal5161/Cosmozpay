import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestAdminApi } from './adminAuth';
import { fetchAdminWallets, type AdminWallet } from './adminUsers';

vi.mock('./adminAuth', () => ({ requestAdminApi: vi.fn() }));

const request = vi.mocked(requestAdminApi);

const wallet: AdminWallet = {
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

function envelope(data: unknown) {
  return { success: true, message: 'ok', data };
}

describe('admin wallet API service', () => {
  beforeEach(() => request.mockReset());

  it('parses persisted wallet balances and submits server-side filters and pagination', async () => {
    request.mockResolvedValue(envelope({
      items: [wallet],
      total: 11,
      total_wallets: 15,
      currencies: ['NGN', 'USD'],
    }));

    const result = await fetchAdminWallets({
      page: 2,
      page_size: 10,
      search: ' Ada ',
      status: 'active',
      currency: 'NGN',
    });

    expect(result.items).toEqual([wallet]);
    expect(result.items[0].available_balance).toBe('123456789.01');
    expect(result).toMatchObject({
      page: 2,
      page_size: 10,
      total: 11,
      total_pages: 2,
      total_wallets: 15,
      currencies: ['NGN', 'USD'],
    });
    expect(request).toHaveBeenCalledWith(
      '/admin/wallets?page=2&page_size=10&query=Ada&status=active&currency=NGN',
    );
  });

  it('accepts a valid empty wallet directory response', async () => {
    request.mockResolvedValue(envelope({
      items: [],
      total: 0,
      total_wallets: 0,
      currencies: [],
    }));

    const result = await fetchAdminWallets({ page: 1, page_size: 10 });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.total_pages).toBe(1);
    expect(result.currencies).toEqual([]);
  });
});
