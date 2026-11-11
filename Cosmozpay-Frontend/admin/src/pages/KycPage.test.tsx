import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import KycPage from './KycPage';
import { fetchAdminKyc, reviewAdminUserKyc, type AdminGlobalKycRecord, type AdminPage } from '../services/adminUsers';

vi.mock('../services/adminUsers', () => ({
  fetchAdminKyc: vi.fn(),
  reviewAdminUserKyc: vi.fn(),
}));

const fetchKyc = vi.mocked(fetchAdminKyc);
const reviewKyc = vi.mocked(reviewAdminUserKyc);

const record: AdminGlobalKycRecord = {
  id: 'kyc-1',
  user_id: 'user-1',
  user_first_name: 'Ada',
  user_last_name: 'Lovelace',
  user_email: 'ada@example.test',
  user_phone: '+2348000000000',
  verification_status: 'pending',
  verification_level: 'basic',
  document_type: 'nin',
  document_verification_status: 'pending',
  submitted_at: '2026-01-02T10:00:00Z',
  reviewed_by: null,
  reviewed_at: null,
  approved_at: null,
  rejected_at: null,
  rejection_reason: null,
  is_active: true,
  is_verified: false,
  created_at: '2026-01-02T10:00:00Z',
};

function page(pageNumber = 1, items: AdminGlobalKycRecord[] = [record]): AdminPage<AdminGlobalKycRecord> {
  return { items, page: pageNumber, page_size: 20, total: 21, total_pages: 2 };
}

describe('Admin KYC page', () => {
  beforeEach(() => {
    fetchKyc.mockReset();
    reviewKyc.mockReset();
    fetchKyc.mockImplementation(async ({ page: pageNumber }) => page(pageNumber));
    reviewKyc.mockResolvedValue({ ...record, verification_status: 'approved', is_verified: true });
  });

  afterEach(cleanup);

  it('shows loading and then global records with profile data clearly identified', async () => {
    let resolveRequest!: (value: AdminPage<AdminGlobalKycRecord>) => void;
    fetchKyc.mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve; }));
    render(<KycPage />);

    expect(screen.getByText('Loading KYC submissions…')).toBeTruthy();
    resolveRequest(page());
    expect(await screen.findByText('ada@example.test')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(screen.getByRole('heading', { name: /Customer profile/ })).toBeTruthy();
    expect(within(screen.getByRole('dialog')).getByText('Nin')).toBeTruthy();
  });

  it('offers retry on errors and renders an empty state', async () => {
    fetchKyc.mockRejectedValueOnce(new Error('KYC service unavailable')).mockResolvedValueOnce(page(1, []));
    render(<KycPage />);

    expect((await screen.findByRole('alert')).textContent).toContain('KYC service unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No KYC submissions found')).toBeTruthy();
  });

  it('sends search and status filters and paginates server-side', async () => {
    render(<KycPage />);
    await screen.findByText('ada@example.test');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Ada' } });
    await waitFor(() => expect(fetchKyc).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Ada', page: 1 })));

    fireEvent.change(screen.getByLabelText('KYC status'), { target: { value: 'pending' } });
    await waitFor(() => expect(fetchKyc).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'pending', page: 1 })));

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(fetchKyc).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
  });

  it('reviews the selected record using both user and submission IDs', async () => {
    render(<KycPage />);
    await screen.findByText('ada@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(reviewKyc).toHaveBeenCalledWith('user-1', 'kyc-1', 'approved', ''));
    expect(await screen.findByText('KYC approved successfully.')).toBeTruthy();
  });

  it('requires a rejection reason before submitting a review', async () => {
    render(<KycPage />);
    await screen.findByText('ada@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

    const confirmButton = screen.getByRole('button', { name: 'Confirm rejection' }) as HTMLButtonElement;
    expect(confirmButton.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Rejection reason'), { target: { value: 'Document is unclear' } });
    fireEvent.click(confirmButton);

    await waitFor(() => expect(reviewKyc).toHaveBeenCalledWith('user-1', 'kyc-1', 'rejected', 'Document is unclear'));
  });
});
