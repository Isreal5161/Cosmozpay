import { requestAdminApi } from './adminAuth';

export type SupportStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SupportMessage {
  id: string;
  sender_id: string | null;
  sender_name: string;
  sender_type: 'customer' | 'admin';
  content: string;
  created_at: string;
  is_internal: boolean;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string;
  subject: string;
  initial_message: string;
  status: SupportStatus;
  priority: SupportPriority;
  category: string;
  assignee_id: string | null;
  assignee_name: string | null;
  created_at: string;
  updated_at: string;
  messages: SupportMessage[];
}

export interface SupportFilters {
  page: number;
  page_size: number;
  search?: string;
  status?: string;
  priority?: string;
}

export interface SupportListData {
  items: SupportTicket[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface SupportAssignee {
  id: string;
  display_name: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`The support service returned an invalid ${label}.`);
  return value;
}

function requiredBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`The support service returned an invalid ${label}.`);
  return value;
}

function nullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return requiredString(value, label);
}

function parseSupportMessage(value: unknown): SupportMessage {
  const message = isRecord(value) ? value : null;
  if (!message) throw new Error('The support service returned an invalid message.');
  const senderType = requiredString(message.sender_type, 'message sender type');
  if (senderType !== 'admin' && senderType !== 'customer') {
    throw new Error('The support service returned an unsupported message sender type.');
  }
  return {
    id: requiredString(message.id, 'message id'),
    sender_id: nullableString(message.sender_id, 'message sender id'),
    sender_name: requiredString(message.sender_name, 'message sender name'),
    sender_type: senderType,
    content: requiredString(message.content, 'message content'),
    created_at: requiredString(message.created_at, 'message timestamp'),
    is_internal: requiredBoolean(message.is_internal, 'internal message flag'),
  };
}

function parseSupportTicket(value: unknown): SupportTicket {
  const ticket = isRecord(value) ? value : null;
  if (!ticket) throw new Error('The support service returned an invalid ticket.');
  const status = requiredString(ticket.status, 'status');
  const priority = requiredString(ticket.priority, 'priority');
  if (!['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'].includes(status)) {
    throw new Error('The support service returned an unsupported status.');
  }
  if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
    throw new Error('The support service returned an unsupported priority.');
  }
  if (!Array.isArray(ticket.messages)) throw new Error('The support service returned invalid message data.');
  return {
    id: requiredString(ticket.id, 'ticket id'),
    user_id: requiredString(ticket.user_id, 'customer id'),
    user_name: requiredString(ticket.user_name, 'customer name'),
    subject: requiredString(ticket.subject, 'ticket subject'),
    initial_message: requiredString(ticket.initial_message, 'initial message'),
    status: status as SupportStatus,
    priority: priority as SupportPriority,
    category: requiredString(ticket.category, 'ticket category'),
    assignee_id: nullableString(ticket.assignee_id, 'assignee id'),
    assignee_name: nullableString(ticket.assignee_name, 'assignee name'),
    created_at: requiredString(ticket.created_at, 'created timestamp'),
    updated_at: requiredString(ticket.updated_at, 'updated timestamp'),
    messages: ticket.messages.map(parseSupportMessage),
  };
}

export function parseSupportList(value: unknown): SupportListData {
  const record = isRecord(value) ? value : null;
  if (!record) throw new Error('The support service returned an invalid payload.');
  if (!Array.isArray(record.items)) throw new Error('The support service returned an invalid ticket list.');
  return {
    items: record.items.map(parseSupportTicket),
    page: Number(record.page),
    page_size: Number(record.page_size),
    total: Number(record.total),
    total_pages: Number(record.total_pages),
  };
}

export function parseSupportAssignees(value: unknown): SupportAssignee[] {
  const record = isRecord(value) ? value : null;
  if (!record || !Array.isArray(record.items)) {
    throw new Error('The support service returned an invalid assignee list.');
  }
  return record.items.map((item) => {
    const assignee = isRecord(item) ? item : null;
    if (!assignee) throw new Error('The support service returned an invalid assignee.');
    return {
      id: requiredString(assignee.id, 'assignee id'),
      display_name: requiredString(assignee.display_name, 'assignee display name'),
    };
  });
}

export async function fetchSupportAssignees(): Promise<SupportAssignee[]> {
  const data = await requestAdminApi('/admin/support/assignees');
  return parseSupportAssignees(data);
}

export async function fetchSupportTickets(filters: SupportFilters): Promise<SupportListData> {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('page_size', String(filters.page_size));
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  const data = await requestAdminApi(`/admin/support?${params.toString()}`);
  return parseSupportList(data);
}

export async function getSupportTicket(ticketId: string): Promise<SupportTicket> {
  const data = await requestAdminApi(`/admin/support/${encodeURIComponent(ticketId)}`);
  return parseSupportTicket(data);
}

export async function replyToSupportTicket(ticketId: string, input: { content: string; is_internal?: boolean }): Promise<SupportTicket> {
  const data = await requestAdminApi(`/admin/support/${encodeURIComponent(ticketId)}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: input.content, is_internal: Boolean(input.is_internal) }),
  });
  return parseSupportTicket(data);
}

export async function updateSupportTicket(ticketId: string, input: { status?: SupportStatus; priority?: SupportPriority; assignee_id?: string | null; note?: string }): Promise<SupportTicket> {
  const payload: Record<string, unknown> = {
    status: input.status ?? undefined,
    priority: input.priority ?? undefined,
    note: input.note ?? undefined,
  };
  if (Object.prototype.hasOwnProperty.call(input, 'assignee_id')) {
    payload.assignee_id = input.assignee_id;
  }

  const data = await requestAdminApi(`/admin/support/${encodeURIComponent(ticketId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseSupportTicket(data);
}
