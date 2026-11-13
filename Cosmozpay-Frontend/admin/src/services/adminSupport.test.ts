import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestAdminApi } from './adminAuth';
import { fetchSupportAssignees, getSupportTicket, updateSupportTicket } from './adminSupport';

vi.mock('./adminAuth', () => ({
  requestAdminApi: vi.fn(),
}));

const mockRequestAdminApi = vi.mocked(requestAdminApi);

describe('adminSupport', () => {
  beforeEach(() => {
    mockRequestAdminApi.mockReset();
    mockRequestAdminApi.mockResolvedValue({
      id: 'ticket-1',
      user_id: 'user-1',
      user_name: 'Ada Lovelace',
      subject: 'Billing issue',
      initial_message: 'My card payment was charged twice.',
      status: 'open',
      priority: 'high',
      category: 'billing',
      assignee_id: 'admin-1',
      assignee_name: 'support-admin',
      created_at: '2026-01-05T09:00:00Z',
      updated_at: '2026-01-05T09:15:00Z',
      messages: [],
    });
  });

  it('loads the bounded assignee list from the authenticated Support endpoint', async () => {
    mockRequestAdminApi.mockResolvedValueOnce({
      items: [{ id: 'admin-1', display_name: 'Support Admin' }],
    });

    await expect(fetchSupportAssignees()).resolves.toEqual([
      { id: 'admin-1', display_name: 'Support Admin' },
    ]);
    expect(mockRequestAdminApi).toHaveBeenCalledWith('/admin/support/assignees');
  });

  it('keeps omitting and null assignment updates explicit', async () => {
    await updateSupportTicket('ticket-1', { status: 'in_progress' });
    expect(mockRequestAdminApi).toHaveBeenLastCalledWith(
      '/admin/support/ticket-1/status',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const lastCall = mockRequestAdminApi.mock.calls[mockRequestAdminApi.mock.calls.length - 1];
    const [, requestInit] = lastCall as [string, RequestInit];
    expect(JSON.parse(String(requestInit.body))).toEqual({ status: 'in_progress' });

    await updateSupportTicket('ticket-1', { assignee_id: 'admin-2' });
    const reassignmentCall = mockRequestAdminApi.mock.calls[mockRequestAdminApi.mock.calls.length - 1];
    const [, reassignmentInit] = reassignmentCall as [string, RequestInit];
    expect(JSON.parse(String(reassignmentInit.body))).toEqual({ assignee_id: 'admin-2' });

    await updateSupportTicket('ticket-1', { assignee_id: null });
    const nullAssignmentCall = mockRequestAdminApi.mock.calls[mockRequestAdminApi.mock.calls.length - 1];
    const [, nullAssignmentInit] = nullAssignmentCall as [string, RequestInit];
    expect(JSON.parse(String(nullAssignmentInit.body))).toEqual({ assignee_id: null });
  });

  it('serializes status and priority changes without dropping explicit nulls', async () => {
    await updateSupportTicket('ticket-1', { status: 'resolved', priority: 'urgent', assignee_id: null });
    const lastCall = mockRequestAdminApi.mock.calls[mockRequestAdminApi.mock.calls.length - 1];
    const [, requestInit] = lastCall as [string, RequestInit];
    expect(JSON.parse(String(requestInit.body))).toEqual({
      status: 'resolved',
      priority: 'urgent',
      assignee_id: null,
    });
  });

  it('rejects unsupported message sender types instead of coercing them to customer', async () => {
    mockRequestAdminApi.mockResolvedValueOnce({
      id: 'ticket-1',
      user_id: 'user-1',
      user_name: 'Ada Lovelace',
      subject: 'Billing issue',
      initial_message: 'My card payment was charged twice.',
      status: 'open',
      priority: 'high',
      category: 'billing',
      assignee_id: 'admin-1',
      assignee_name: 'support-admin',
      created_at: '2026-01-05T09:00:00Z',
      updated_at: '2026-01-05T09:15:00Z',
      messages: [{
        id: 'message-1',
        sender_id: 'user-1',
        sender_name: 'Ada Lovelace',
        sender_type: 'unexpected',
        content: 'Message',
        created_at: '2026-01-05T09:05:00Z',
        is_internal: false,
      }],
    });

    await expect(getSupportTicket('ticket-1')).rejects.toThrow('unsupported message sender type');
  });
});
