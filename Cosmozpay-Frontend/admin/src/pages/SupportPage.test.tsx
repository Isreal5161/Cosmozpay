import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SupportPage from './SupportPage';
import {
  fetchSupportAssignees,
  fetchSupportTickets,
  replyToSupportTicket,
  type SupportAssignee,
  updateSupportTicket,
  type SupportTicket,
} from '../services/adminSupport';

vi.mock('../services/adminSupport', () => ({
  fetchSupportAssignees: vi.fn(),
  fetchSupportTickets: vi.fn(),
  replyToSupportTicket: vi.fn(),
  updateSupportTicket: vi.fn(),
}));

const mockFetchSupportAssignees = vi.mocked(fetchSupportAssignees);
const mockFetchSupportTickets = vi.mocked(fetchSupportTickets);
const mockReplyToSupportTicket = vi.mocked(replyToSupportTicket);
const mockUpdateSupportTicket = vi.mocked(updateSupportTicket);

const baseTicket: SupportTicket = {
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
  messages: [
    {
      id: 'message-1',
      sender_id: 'user-1',
      sender_name: 'Ada Lovelace',
      sender_type: 'customer',
      content: 'I need a refund.',
      created_at: '2026-01-05T09:05:00Z',
      is_internal: false,
    },
  ],
};

describe('SupportPage', () => {
  beforeEach(() => {
    mockFetchSupportAssignees.mockReset();
    mockFetchSupportTickets.mockReset();
    mockReplyToSupportTicket.mockReset();
    mockUpdateSupportTicket.mockReset();
    mockFetchSupportAssignees.mockResolvedValue([
      { id: 'admin-1', display_name: 'Support Admin' },
      { id: 'admin-2', display_name: 'Second Admin' },
    ]);
    mockFetchSupportTickets.mockResolvedValue({
      items: [baseTicket],
      page: 1,
      page_size: 10,
      total: 1,
      total_pages: 1,
    });
    mockReplyToSupportTicket.mockImplementation(async (_, input) => ({
      ...baseTicket,
      messages: [
        ...baseTicket.messages,
        {
          id: 'message-new',
          sender_id: 'admin-1',
          sender_name: 'support-admin',
          sender_type: 'admin',
          content: input.content,
          created_at: '2026-01-05T09:20:00Z',
          is_internal: !!input.is_internal,
        },
      ],
      updated_at: '2026-01-05T09:20:00Z',
    }));
    mockUpdateSupportTicket.mockImplementation(async (_, input) => ({
      ...baseTicket,
      status: input.status ?? baseTicket.status,
      priority: input.priority ?? baseTicket.priority,
      assignee_id: Object.prototype.hasOwnProperty.call(input, 'assignee_id') ? input.assignee_id ?? null : baseTicket.assignee_id,
      assignee_name: input.assignee_id === null
        ? null
        : input.assignee_id === 'admin-2'
          ? 'Second Admin'
          : input.assignee_id
            ? 'Support Admin'
            : baseTicket.assignee_name,
      updated_at: '2026-01-05T09:25:00Z',
    }));
  });

  afterEach(() => {
    cleanup();
  });

  it('surfaces the loaded empty state and an error alert when the ticket list fails', async () => {
    mockFetchSupportTickets.mockRejectedValueOnce(new Error('Support API unavailable'));
    render(<SupportPage />);
    expect((await screen.findByRole('alert')).textContent).toContain('Support API unavailable');

    mockFetchSupportTickets.mockResolvedValueOnce({
      items: [],
      page: 1,
      page_size: 10,
      total: 0,
      total_pages: 1,
    });
    cleanup();
    render(<SupportPage />);
    expect(await screen.findByText('No support tickets match the current filters.')).toBeTruthy();
  });

  it('renders ticket details and submits a customer-visible reply', async () => {
    render(<SupportPage />);

    expect(await screen.findByRole('heading', { name: 'Billing issue' })).toBeTruthy();
    expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0);
    expect(screen.getByText('My card payment was charged twice.')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Write a customer-visible reply…'), { target: { value: 'Thanks for reporting this.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reply' }));

    await waitFor(() => {
      expect(mockReplyToSupportTicket).toHaveBeenCalledWith('ticket-1', {
        content: 'Thanks for reporting this.',
        is_internal: false,
      });
    });
  });

  it('writes internal notes with a distinct label and payload', async () => {
    render(<SupportPage />);

    await screen.findByRole('heading', { name: 'Billing issue' });
    fireEvent.change(screen.getByLabelText('Message type'), { target: { value: 'internal' } });
    fireEvent.change(screen.getByPlaceholderText('Write an internal admin note…'), { target: { value: 'Need to check the payout ledger.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save internal note' }));

    await waitFor(() => {
      expect(mockReplyToSupportTicket).toHaveBeenCalledWith('ticket-1', {
        content: 'Need to check the payout ledger.',
        is_internal: true,
      });
    });
    expect(screen.getAllByText('Internal note').length).toBeGreaterThan(0);
  });

  it('persists status and priority changes through the backend response', async () => {
    render(<SupportPage />);

    await screen.findByRole('heading', { name: 'Billing issue' });
    const controls = screen.getAllByRole('combobox');
    fireEvent.change(controls[2], { target: { value: 'in_progress' } });
    await waitFor(() => {
      expect(mockUpdateSupportTicket).toHaveBeenCalledWith('ticket-1', { status: 'in_progress' });
    });
    await waitFor(() => expect((screen.getAllByRole('combobox')[2] as HTMLSelectElement).value).toBe('in_progress'));

    fireEvent.change(screen.getAllByRole('combobox')[3], { target: { value: 'urgent' } });
    await waitFor(() => {
      expect(mockUpdateSupportTicket).toHaveBeenCalledWith('ticket-1', { priority: 'urgent' });
    });
    await waitFor(() => expect((screen.getAllByRole('combobox')[3] as HTMLSelectElement).value).toBe('urgent'));
  });

  it('loads eligible administrators and assigns then reassigns an unassigned ticket', async () => {
    mockFetchSupportTickets.mockResolvedValueOnce({
      items: [{ ...baseTicket, assignee_id: null, assignee_name: null }],
      page: 1,
      page_size: 10,
      total: 1,
      total_pages: 1,
    });
    render(<SupportPage />);

    await screen.findByRole('heading', { name: 'Billing issue' });
    expect(screen.getByText('Current assignee:').parentElement?.textContent).toContain('Unassigned');
    expect(screen.getByRole('option', { name: 'Second Admin' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Assign to'), { target: { value: 'admin-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Assign ticket' }));
    await waitFor(() => {
      expect(mockUpdateSupportTicket).toHaveBeenCalledWith('ticket-1', { assignee_id: 'admin-1' });
      expect(screen.getByText('Current assignee:').parentElement?.textContent).toContain('Support Admin');
    });

    fireEvent.change(screen.getByLabelText('Assign to'), { target: { value: 'admin-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reassign ticket' }));
    await waitFor(() => {
      expect(mockUpdateSupportTicket).toHaveBeenCalledWith('ticket-1', { assignee_id: 'admin-2' });
      expect(screen.getByText('Current assignee:').parentElement?.textContent).toContain('Second Admin');
    });
  });

  it('unassigns a ticket by sending an explicit null assignee', async () => {
    render(<SupportPage />);

    await screen.findByRole('heading', { name: 'Billing issue' });
    expect(screen.getByText('Current assignee:').parentElement?.textContent).toContain('support-admin');
    fireEvent.click(screen.getByRole('button', { name: 'Unassign' }));
    await waitFor(() => {
      expect(mockUpdateSupportTicket).toHaveBeenCalledWith('ticket-1', { assignee_id: null });
      expect(screen.getByText('Current assignee:').parentElement?.textContent).toContain('Unassigned');
    });
  });

  it('shows assignment failures without changing the displayed assignee', async () => {
    mockUpdateSupportTicket.mockRejectedValueOnce(new Error('Assignment service unavailable'));
    render(<SupportPage />);

    await screen.findByRole('heading', { name: 'Billing issue' });
    fireEvent.change(screen.getByLabelText('Assign to'), { target: { value: 'admin-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reassign ticket' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Assignment service unavailable');
    expect(screen.getByText('Current assignee:').parentElement?.textContent).toContain('support-admin');
  });

  it('prevents duplicate assignment submissions while the request is pending', async () => {
    let resolveUpdate!: (ticket: SupportTicket) => void;
    mockUpdateSupportTicket.mockReturnValueOnce(new Promise((resolve) => {
      resolveUpdate = resolve;
    }));
    render(<SupportPage />);

    await screen.findByRole('heading', { name: 'Billing issue' });
    fireEvent.change(screen.getByLabelText('Assign to'), { target: { value: 'admin-2' } });
    const reassignButton = screen.getByRole('button', { name: 'Reassign ticket' });
    fireEvent.click(reassignButton);
    await waitFor(() => expect(reassignButton.hasAttribute('disabled')).toBe(true));
    fireEvent.click(reassignButton);
    expect(mockUpdateSupportTicket).toHaveBeenCalledTimes(1);

    resolveUpdate({ ...baseTicket, assignee_id: 'admin-2', assignee_name: 'Second Admin' });
    await waitFor(() => {
      expect(screen.getByText('Current assignee:').parentElement?.textContent).toContain('Second Admin');
    });
  });

  it('handles an empty eligible-admin list and still permits unassignment', async () => {
    mockFetchSupportAssignees.mockResolvedValueOnce([]);
    render(<SupportPage />);

    await screen.findByText('No eligible active administrators are available.');
    expect(screen.getByRole('button', { name: 'Unassign' }).hasAttribute('disabled')).toBe(false);
    expect(screen.getByRole('button', { name: 'Reassign ticket' }).hasAttribute('disabled')).toBe(true);
  });

  it('shows eligible-admin loading state and applies search, filters, and pagination to the API', async () => {
    let resolveAssignees!: (items: SupportAssignee[]) => void;
    mockFetchSupportAssignees.mockReturnValueOnce(new Promise((resolve) => {
      resolveAssignees = resolve;
    }));
    mockFetchSupportTickets.mockImplementation(async (filters) => ({
      items: [baseTicket],
      page: filters.page,
      page_size: filters.page_size,
      total: 21,
      total_pages: 3,
    }));
    render(<SupportPage />);

    await screen.findByRole('heading', { name: 'Billing issue' });
    expect(screen.getByText('Loading eligible administrators…')).toBeTruthy();
    resolveAssignees([{ id: 'admin-1', display_name: 'Support Admin' }]);
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    await waitFor(() => {
      expect(mockFetchSupportTickets).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    });

    fireEvent.change(screen.getByLabelText('Search support tickets'), { target: { value: 'refund' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'open' } });
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'high' } });
    await waitFor(() => {
      expect(mockFetchSupportTickets).toHaveBeenLastCalledWith(expect.objectContaining({
        page: 1,
        page_size: 10,
        search: 'refund',
        status: 'open',
        priority: 'high',
      }));
    });
  });

});
