import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestAdminApi } from './adminAuth';
import { fetchAdminKyc, fetchAdminUserKyc, reviewAdminUserKyc } from './adminUsers';

vi.mock('./adminAuth', () => ({ requestAdminApi: vi.fn() }));

const request = vi.mocked(requestAdminApi);

const record = {
  id: 'kyc-1',
  user_id: 'user-1',
  user_first_name: 'Ada',
  user_last_name: 'Lovelace',
  user_email: 'ada@example.test',
  user_phone: null,
  verification_status: 'pending',
  verification_level: 'basic',
  document_type: 'nin',
  document_verification_status: 'pending',
  submitted_at: null,
  reviewed_by: null,
  reviewed_at: null,
  approved_at: null,
  rejected_at: null,
  rejection_reason: null,
  is_active: true,
  is_verified: false,
  created_at: null,
};

function envelope(data: unknown) {
  return { success: true, message: 'ok', data };
}

describe('admin KYC API service', () => {
  beforeEach(() => request.mockReset());

  it('parses the global KYC page and sends supported filters', async () => {
    request.mockResolvedValue(envelope({
      items: [record],
      page: 2,
      page_size: 10,
      total: 11,
      total_pages: 2,
    }));

    const result = await fetchAdminKyc({
      page: 2,
      page_size: 10,
      search: ' Ada ',
      status: 'pending',
      document_type: 'nin',
    });

    expect(result.items[0]).toMatchObject({ id: 'kyc-1', user_id: 'user-1', user_email: 'ada@example.test' });
    expect(result).toMatchObject({ page: 2, page_size: 10, total: 11, total_pages: 2 });
    expect(request).toHaveBeenCalledWith(
      '/admin/kyc?page=2&page_size=10&search=Ada&status=pending&document_type=nin',
    );
  });

  it('unwraps the user-scoped page and parses the single review envelope', async () => {
    request
      .mockResolvedValueOnce(envelope({ items: [record], page: 1, page_size: 20, total: 1, total_pages: 1 }))
      .mockResolvedValueOnce(envelope({ ...record, verification_status: 'approved', is_verified: true }));

    const page = await fetchAdminUserKyc('user-1');
    const reviewed = await reviewAdminUserKyc('user-1', 'kyc-1', 'approved', '');

    expect(page.items[0].id).toBe('kyc-1');
    expect(reviewed.verification_status).toBe('approved');
    expect(request).toHaveBeenNthCalledWith(
      1,
      '/admin/users/user-1/kyc?page=1&page_size=20',
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      '/admin/users/user-1/kyc/kyc-1/review',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
