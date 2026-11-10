import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Modal from '../components/Modal';
import {
  fetchAdminPaymentDetails,
  fetchAdminPayments,
  type AdminPayment,
  type AdminPaymentDetail,
  type AdminPaymentQuery,
  type AdminPaymentPage,
} from '../services/adminTransactions';

const PAGE_SIZE = 20;

interface PaymentFilters {
  search: string;
  category: string;
  status: string;
  method: string;
  startDate: string;
  endDate: string;
}

const emptyFilters: PaymentFilters = {
  search: '',
  category: '',
  status: '',
  method: '',
  startDate: '',
  endDate: '',
};

function PaymentsPage() {
  const [filters, setFilters] = useState<PaymentFilters>(emptyFilters);
  const [query, setQuery] = useState<AdminPaymentQuery>({ page: 1, page_size: PAGE_SIZE, descending: true });
  const [result, setResult] = useState<AdminPaymentPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminPaymentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailReload, setDetailReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void fetchAdminPayments(query)
      .then((response) => {
        if (active) setResult(response);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load payment records.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, reload]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    void fetchAdminPaymentDetails(selectedId)
      .then((response) => {
        if (active) setDetail(response);
      })
      .catch((cause: unknown) => {
        if (active) setDetailError(cause instanceof Error ? cause.message : 'Unable to load payment details.');
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId, detailReload]);

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery({
      page: 1,
      page_size: PAGE_SIZE,
      payment_category: filters.category
        ? filters.category as AdminPaymentQuery['payment_category']
        : undefined,
      status: filters.status || undefined,
      method: filters.method.trim() || undefined,
      search: filters.search.trim() || undefined,
      start_date: toIsoDate(filters.startDate, false),
      end_date: toIsoDate(filters.endDate, true),
      descending: true,
    });
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setQuery({ page: 1, page_size: PAGE_SIZE, descending: true });
  };

  const changePage = (page: number) => setQuery((current) => ({ ...current, page }));
  const refresh = () => setReload((current) => current + 1);

  return (
    <div className="transactions-page payments-page">
      <header className="transactions-heading">
        <div>
          <h1 className="page-heading">Payment Management</h1>
          <p className="transactions-subtitle">
            Monitor recorded wallet funding, payments, transfers and bank payouts.
          </p>
        </div>
        <button type="button" className="wallet-button" onClick={refresh} disabled={loading}>
          Refresh
        </button>
      </header>

      <section className="transactions-summary" aria-label="Payment totals">
        <SummaryCard title="Matching records" value={result?.summary.total} loading={loading} />
        <SummaryCard title="Successful" value={result?.summary.successful} loading={loading} tone="success" />
        <SummaryCard title="Pending" value={result?.summary.pending} loading={loading} tone="pending" />
        <SummaryCard title="Failed" value={result?.summary.failed} loading={loading} tone="failed" />
      </section>

      <section className="panel transactions-panel">
        <form className="transactions-filters payments-filters" onSubmit={submitFilters} aria-label="Filter payments">
          <label className="transactions-filter transactions-filter-search">
            <span>Search</span>
            <input
              className="wallet-control"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="User, transaction or provider reference"
            />
          </label>
          <label className="transactions-filter">
            <span>Category</span>
            <select
              className="wallet-control"
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
            >
              <option value="">All payment records</option>
              <option value="wallet_funding">Wallet funding</option>
              <option value="payment">Payments</option>
              <option value="transfer">Transfers</option>
              <option value="bank_payout">Bank payouts</option>
            </select>
          </label>
          <label className="transactions-filter">
            <span>Status</span>
            <select
              className="wallet-control"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="funds_reserved">Funds reserved</option>
              <option value="completed">Completed</option>
              <option value="succeeded">Succeeded</option>
              <option value="settled">Settled</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="reversed">Reversed</option>
            </select>
          </label>
          <label className="transactions-filter">
            <span>Method / provider</span>
            <input
              className="wallet-control"
              value={filters.method}
              onChange={(event) => setFilters((current) => ({ ...current, method: event.target.value }))}
              placeholder="e.g. Flutterwave"
            />
          </label>
          <label className="transactions-filter">
            <span>From</span>
            <input
              className="wallet-control"
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
            />
          </label>
          <label className="transactions-filter">
            <span>To</span>
            <input
              className="wallet-control"
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
            />
          </label>
          <div className="transactions-filter-actions">
            <button type="submit" className="wallet-button wallet-button-primary" disabled={loading}>Apply</button>
            <button type="button" className="wallet-button" onClick={resetFilters} disabled={loading}>Reset</button>
          </div>
        </form>

        {error && (
          <div className="wallet-error transactions-error" role="alert">
            <span>{error}</span>
            <button type="button" className="wallet-button" onClick={refresh}>Retry</button>
          </div>
        )}

        <PaymentsTable items={result?.items ?? []} loading={loading} onView={setSelectedId} />
        <footer className="payments-pagination" aria-label="Payment pages">
          <span>
            {result ? `${result.total.toLocaleString()} records · Page ${result.page} of ${Math.max(result.total_pages, 1)}` : 'Loading payment records'}
          </span>
          <div>
            <button
              type="button"
              className="wallet-button"
              onClick={() => changePage(Math.max(1, (result?.page ?? 1) - 1))}
              disabled={loading || !result || result.page <= 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="wallet-button"
              onClick={() => changePage((result?.page ?? 1) + 1)}
              disabled={loading || !result || result.page >= result.total_pages}
            >
              Next
            </button>
          </div>
        </footer>
      </section>

      <Modal
        open={selectedId !== null}
        title="Payment details"
        onClose={() => {
          setSelectedId(null);
          setDetail(null);
          setDetailError(null);
        }}
      >
        {detailLoading && <div className="transactions-detail-loading" aria-live="polite">Loading persisted payment details…</div>}
        {detailError && (
          <div className="wallet-error transactions-error" role="alert">
            <span>{detailError}</span>
            <button type="button" className="wallet-button" onClick={() => setDetailReload((current) => current + 1)}>Retry</button>
          </div>
        )}
        {detail && <PaymentDetails payment={detail} />}
      </Modal>
    </div>
  );
}

function PaymentsTable({
  items,
  loading,
  onView,
}: {
  items: AdminPayment[];
  loading: boolean;
  onView: (id: string) => void;
}) {
  return (
    <div className="transactions-table-scroll">
      <table className="table transactions-table payments-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>User</th>
            <th>Category</th>
            <th>Method / provider</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: 5 }, (_, index) => (
            <tr key={`payment-loading-${index}`} aria-hidden="true">
              <td colSpan={8}><span className="transactions-row-skeleton" /></td>
            </tr>
          ))}
          {!loading && items.map((payment) => (
            <tr key={payment.id}>
              <td>
                <span className="transactions-reference" title={payment.reference}>{payment.reference}</span>
                {payment.provider_reference && <span className="transactions-secondary">Provider: {payment.provider_reference}</span>}
              </td>
              <td>
                <span className="transactions-user-name">{payment.user?.name || 'Name unavailable'}</span>
                <span className="transactions-secondary">{payment.user?.email || payment.user_id}</span>
              </td>
              <td>{humanize(payment.payment_type)}</td>
              <td>
                <span>{payment.method || payment.provider_name || 'Not recorded'}</span>
                {payment.method && payment.provider_name && payment.method !== payment.provider_name && (
                  <span className="transactions-secondary">{payment.provider_name}</span>
                )}
              </td>
              <td className="transactions-amount">{formatMoney(payment.amount, payment.currency)}</td>
              <td><StatusBadge status={payment.status} /></td>
              <td>{formatDate(payment.created_at)}</td>
              <td><button type="button" className="wallet-button" onClick={() => onView(payment.id)}>Details</button></td>
            </tr>
          ))}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={8}>
                <div className="transactions-empty">
                  <strong>No payment records found</strong>
                  <span>Try changing the filters. Only persisted transaction records are displayed.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PaymentDetails({ payment }: { payment: AdminPaymentDetail }) {
  return (
    <div className="transactions-detail">
      <section className="transactions-detail-section">
        <h4>Payment record</h4>
        <DetailRow label="Reference" value={payment.reference} />
        <DetailRow label="Category" value={humanize(payment.payment_type)} />
        <DetailRow label="Status" value={<StatusBadge status={payment.status} />} />
        <DetailRow label="Created" value={formatDate(payment.created_at)} />
        <DetailRow label="Updated" value={formatDate(payment.updated_at)} />
      </section>
      <section className="transactions-detail-section">
        <h4>Participants</h4>
        <DetailRow label="Sender / user" value={payment.user?.name || payment.user?.email || payment.user_id} />
        <DetailRow label="Recipient" value={payment.recipient?.name || payment.recipient?.email} />
        <DetailRow label="Recipient account" value={payment.metadata.account_number_last4 ? `•••• ${payment.metadata.account_number_last4}` : null} />
      </section>
      <section className="transactions-detail-section">
        <h4>Amount and method</h4>
        <DetailRow label="Amount" value={formatMoney(payment.amount, payment.currency)} />
        <DetailRow label="Charges" value={payment.charges ? formatMoney(payment.charges, payment.currency) : null} />
        <DetailRow label="Total" value={payment.total_amount ? formatMoney(payment.total_amount, payment.currency) : null} />
        <DetailRow label="Currency" value={payment.currency} />
        <DetailRow label="Method" value={payment.method} />
        <DetailRow label="Provider" value={payment.provider_name} />
        <DetailRow label="Provider reference" value={payment.provider_reference} />
        <DetailRow label="Provider transaction ID" value={payment.provider_transaction_id} />
      </section>
      {payment.description && (
        <section className="transactions-detail-section">
          <h4>Description</h4>
          <p className="transactions-subtle">{payment.description}</p>
        </section>
      )}
      <section className="transactions-detail-section">
        <h4>Associated ledger movements</h4>
        {payment.ledger_entries.length > 0 ? (
          <div className="transactions-ledger-list">
            {payment.ledger_entries.map((entry) => (
              <article className="transactions-ledger-entry" key={entry.id}>
                <div><strong>{humanize(entry.transaction_type)} · {humanize(entry.entry_type)}</strong><StatusBadge status={entry.status} /></div>
                <p>{entry.description || entry.transaction_reference}</p>
                <span>{Number(entry.debit_amount) > 0
                  ? `Debit ${formatMoney(entry.debit_amount, entry.currency)}`
                  : `Credit ${formatMoney(entry.credit_amount, entry.currency)}`}</span>
                <time>{formatDate(entry.created_at)}</time>
              </article>
            ))}
          </div>
        ) : (
          <p className="transactions-subtle">No related ledger entries are recorded for this transaction.</p>
        )}
        <p className="transactions-subtle">Ledger entries are persisted wallet movements; transaction status is shown separately.</p>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  loading,
  tone,
}: {
  title: string;
  value?: number;
  loading: boolean;
  tone?: string;
}) {
  return (
    <div className={`transactions-summary-card ${tone ? `tone-${tone}` : ''}`}>
      <span>{title}</span>
      {loading ? <span className="transactions-summary-skeleton" /> : <strong>{(value ?? 0).toLocaleString()}</strong>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined | ReactNode }) {
  const display = value === null || value === undefined || value === '' ? 'Not recorded' : value;
  return (
    <div className="transactions-detail-row">
      <span>{label}</span>
      <strong>{display}</strong>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase();
  let tone = 'unknown';
  if (['completed', 'successful', 'succeeded', 'settled', 'credited'].includes(normalized)) tone = 'success';
  else if (['pending', 'processing', 'funds_reserved', 'initialized'].includes(normalized)) tone = 'pending';
  else if (['failed', 'declined', 'error'].includes(normalized)) tone = 'failed';
  else if (['cancelled', 'reversed', 'refunded', 'voided'].includes(normalized)) tone = normalized;
  return <span className={`transactions-status status-${tone}`}>{humanize(normalized)}</span>;
}

function formatMoney(amount: string, currency: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString();
}

function toIsoDate(value: string, endOfDay: boolean): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default PaymentsPage;
