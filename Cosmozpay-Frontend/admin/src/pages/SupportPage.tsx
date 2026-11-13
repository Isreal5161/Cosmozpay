import { useEffect, useMemo, useState } from 'react';
import {
  fetchSupportAssignees,
  fetchSupportTickets,
  replyToSupportTicket,
  type SupportAssignee,
  type SupportFilters,
  type SupportPriority,
  type SupportStatus,
  type SupportTicket,
  updateSupportTicket,
} from '../services/adminSupport';

const priorityColors: Record<SupportPriority, { background: string; color: string }> = {
  low: { background: '#d1fae5', color: '#065f46' },
  normal: { background: '#dbeafe', color: '#1d4ed8' },
  high: { background: '#fef3c7', color: '#92400e' },
  urgent: { background: '#fee2e2', color: '#991b1b' },
};

const statusColors: Record<SupportStatus, { background: string; color: string }> = {
  open: { background: '#fee2e2', color: '#991b1b' },
  in_progress: { background: '#e0e7ff', color: '#3730a3' },
  waiting_customer: { background: '#fef3c7', color: '#92400e' },
  resolved: { background: '#dcfce7', color: '#166534' },
  closed: { background: '#f3f4f6', color: '#374151' },
};

const initialFilters: SupportFilters = { page: 1, page_size: 10 };

function SupportPage() {
  const [filters, setFilters] = useState<SupportFilters>(initialFilters);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<string | null>(null);
  const [assignees, setAssignees] = useState<SupportAssignee[]>([]);
  const [assigneesLoading, setAssigneesLoading] = useState(true);
  const [assigneeError, setAssigneeError] = useState<string | null>(null);
  const [assignmentSelection, setAssignmentSelection] = useState('');
  const [assignmentUpdating, setAssignmentUpdating] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [replyMode, setReplyMode] = useState<'customer' | 'internal'>('customer');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchSupportTickets(filters)
      .then((data) => {
        if (!active) return;
        setTickets(data.items);
        setTotalPages(Math.max(1, data.total_pages || 1));
        setSelectedTicket((current) => current && data.items.some((item) => item.id === current.id) ? current : (data.items[0] ?? null));
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : 'Unable to load support tickets.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters]);

  useEffect(() => {
    let active = true;
    setAssigneesLoading(true);
    fetchSupportAssignees()
      .then((items) => {
        if (active) setAssignees(items);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setAssigneeError(requestError instanceof Error ? requestError.message : 'Unable to load eligible administrators.');
        }
      })
      .finally(() => {
        if (active) setAssigneesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setAssignmentSelection('');
  }, [selectedTicket?.id]);

  const selectedSummary = useMemo(
    () => selectedTicket ? `${selectedTicket.messages.length} messages` : 'No ticket selected',
    [selectedTicket],
  );

  const updateFilter = (key: keyof SupportFilters, value: string | number | undefined) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  async function handleStatusChange(ticketId: string, status: SupportStatus) {
    setPendingUpdate(ticketId);
    try {
      const updated = await updateSupportTicket(ticketId, { status });
      setTickets((current) => current.map((item) => item.id === ticketId ? updated : item));
      setSelectedTicket((current) => current && current.id === ticketId ? updated : current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update the ticket status.');
    } finally {
      setPendingUpdate(null);
    }
  }

  async function handlePriorityChange(ticketId: string, priority: SupportPriority) {
    setPendingUpdate(ticketId);
    try {
      const updated = await updateSupportTicket(ticketId, { priority });
      setTickets((current) => current.map((item) => item.id === ticketId ? updated : item));
      setSelectedTicket((current) => current && current.id === ticketId ? updated : current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update the ticket priority.');
    } finally {
      setPendingUpdate(null);
    }
  }

  async function saveAssignment(assigneeId: string | null) {
    if (!selectedTicket || assignmentUpdating) return;
    const ticketId = selectedTicket.id;
    setAssignmentUpdating(true);
    setAssigneeError(null);
    try {
      const updated = await updateSupportTicket(ticketId, { assignee_id: assigneeId });
      setTickets((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelectedTicket((current) => current?.id === ticketId ? updated : current);
      setAssignmentSelection('');
    } catch (requestError) {
      setAssigneeError(requestError instanceof Error ? requestError.message : 'Unable to update the ticket assignment.');
    } finally {
      setAssignmentUpdating(false);
    }
  }

  async function handleReplySubmit() {
    if (!selectedTicket || !replyDraft.trim()) return;
    setReplying(true);
    try {
      const updated = await replyToSupportTicket(selectedTicket.id, { content: replyDraft.trim(), is_internal: replyMode === 'internal' });
      setReplyDraft('');
      setReplyMode('customer');
      setTickets((current) => current.map((item) => item.id === selectedTicket.id ? updated : item));
      setSelectedTicket(updated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send the reply.');
    } finally {
      setReplying(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h1 className="page-heading" style={{ margin: 0 }}>Customer Support</h1>
      </div>

      <section className="panel" aria-label="Support filters">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <label>
            Search
            <input
              aria-label="Search support tickets"
              value={filters.search ?? ''}
              onChange={(event) => updateFilter('search', event.target.value)}
            />
          </label>
          <label>
            Status
            <select value={filters.status ?? ''} onChange={(event) => updateFilter('status', event.target.value)}>
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="waiting_customer">Waiting customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label>
            Priority
            <select value={filters.priority ?? ''} onChange={(event) => updateFilter('priority', event.target.value)}>
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
        </div>
      </section>

      {error && (
        <div className="panel" role="alert" style={{ color: '#b91c1c' }}>
          <strong>Support data could not be loaded.</strong>
          <p style={{ margin: '8px 0 0' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <p role="status" aria-live="polite">Loading support tickets…</p>
      ) : tickets.length === 0 ? (
        <div className="panel">
          <p>No support tickets match the current filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          <section className="panel">
            <h2 className="section-title">Tickets</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>User</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} onClick={() => setSelectedTicket(ticket)} style={{ cursor: 'pointer', background: selectedTicket?.id === ticket.id ? '#f3f4f6' : undefined }}>
                      <td>{ticket.subject}</td>
                      <td>{ticket.user_name}</td>
                      <td>
                        <span style={{ ...priorityColors[ticket.priority], borderRadius: 999, padding: '4px 8px', fontSize: 12, display: 'inline-block' }}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        <span style={{ ...statusColors[ticket.status], borderRadius: 999, padding: '4px 8px', fontSize: 12, display: 'inline-block' }}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{new Date(ticket.updated_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <button type="button" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}>Previous</button>
              <span>Page {filters.page} of {totalPages}</span>
              <button type="button" disabled={filters.page >= totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</button>
            </div>
          </section>

          <aside className="panel">
            {selectedTicket ? (
              <>
                <h2 className="section-title">{selectedTicket.subject}</h2>
                <p style={{ color: '#4b5563' }}>{selectedTicket.user_name} • {selectedTicket.category}</p>
                <p><strong>Summary:</strong> {selectedSummary}</p>
                <div style={{ margin: '12px 0', padding: 10, borderRadius: 8, background: '#eef2ff' }}>
                  <strong>Initial customer message</strong>
                  <div style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{selectedTicket.initial_message}</div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0' }}>
                  <select value={selectedTicket.status} onChange={(event) => handleStatusChange(selectedTicket.id, event.target.value as SupportStatus)} disabled={pendingUpdate === selectedTicket.id}>
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="waiting_customer">Waiting customer</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select value={selectedTicket.priority} onChange={(event) => handlePriorityChange(selectedTicket.id, event.target.value as SupportPriority)} disabled={pendingUpdate === selectedTicket.id}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <section aria-label="Ticket assignment" style={{ borderTop: '1px solid #e5e7eb', marginTop: 12, paddingTop: 12 }}>
                  <p><strong>Current assignee:</strong> {selectedTicket.assignee_name ?? 'Unassigned'}</p>
                  {assigneeError && <p role="alert" style={{ color: '#b91c1c' }}>{assigneeError}</p>}
                  {assigneesLoading ? (
                    <p role="status" aria-live="polite">Loading eligible administrators…</p>
                  ) : (
                    <>
                      <label htmlFor="support-assignee">Assign to</label>
                      <select
                        id="support-assignee"
                        value={assignmentSelection}
                        onChange={(event) => setAssignmentSelection(event.target.value)}
                        disabled={assignmentUpdating || assignees.length === 0}
                      >
                        <option value="">Select an active administrator</option>
                        {assignees.map((assignee) => (
                          <option key={assignee.id} value={assignee.id}>{assignee.display_name}</option>
                        ))}
                      </select>
                      {assignees.length === 0 && !assigneeError && (
                        <p>No eligible active administrators are available.</p>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() => void saveAssignment(assignmentSelection)}
                          disabled={
                            assignmentUpdating
                            || assigneesLoading
                            || !assignmentSelection
                            || assignmentSelection === selectedTicket.assignee_id
                          }
                        >
                          {assignmentUpdating ? 'Saving assignment…' : selectedTicket.assignee_id ? 'Reassign ticket' : 'Assign ticket'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void saveAssignment(null)}
                          disabled={assignmentUpdating || !selectedTicket.assignee_id}
                        >
                          Unassign
                        </button>
                      </div>
                    </>
                  )}
                </section>

                <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 12, paddingTop: 12 }}>
                  {selectedTicket.messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        marginBottom: 12,
                        padding: 10,
                        borderRadius: 8,
                        background: message.is_internal ? '#fef3c7' : (message.sender_type === 'admin' ? '#f9fafb' : '#eef2ff'),
                        border: message.is_internal ? '1px solid #f59e0b' : '1px solid transparent',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span>{message.sender_name}</span>
                        <span style={{ color: message.is_internal ? '#92400e' : '#374151', fontWeight: 600 }}>
                          {message.is_internal ? 'Internal note' : message.sender_type === 'admin' ? 'Support reply' : 'Customer message'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{new Date(message.created_at).toLocaleString()}</div>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{message.content}</div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 16, paddingTop: 12 }}>
                  <h3 className="section-title" style={{ marginTop: 0 }}>Send a reply</h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <label htmlFor="reply-mode">Message type</label>
                    <select id="reply-mode" value={replyMode} onChange={(event) => setReplyMode(event.target.value as 'customer' | 'internal')}>
                      <option value="customer">Customer-visible reply</option>
                      <option value="internal">Internal note</option>
                    </select>
                  </div>
                  <textarea
                    value={replyDraft}
                    onChange={(event) => setReplyDraft(event.target.value)}
                    rows={4}
                    placeholder={replyMode === 'customer' ? 'Write a customer-visible reply…' : 'Write an internal admin note…'}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button type="button" onClick={handleReplySubmit} disabled={replying || !replyDraft.trim()}>
                      {replying ? 'Sending…' : replyMode === 'customer' ? 'Send reply' : 'Save internal note'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p>Select a ticket to view the conversation.</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default SupportPage;
