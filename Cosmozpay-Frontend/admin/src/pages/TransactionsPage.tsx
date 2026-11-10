import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import {
  fetchAdminTransactionDetails,
  fetchAdminTransactions,
  fetchAdminTransactionTimeline,
  fetchAdminWalletAdjustments,
  type AdminTransaction,
  type AdminTransactionDetail,
  type AdminTransactionPage,
  type AdminTransactionQuery,
  type AdminTransactionTimelineEvent,
  type AdminWalletAdjustmentPage,
} from '../services/adminTransactions';

const PAGE_SIZE = 20;

interface FilterForm {
  search: string;
  status: string;
  category: string;
  transactionType: string;
  provider: string;
  startDate: string;
  endDate: string;
  sortOrder: 'newest' | 'oldest';
}

const emptyFilters: FilterForm = {
  search: '',
  status: '',
  category: '',
  transactionType: '',
  provider: '',
  startDate: '',
  endDate: '',
  sortOrder: 'newest',
};

function TransactionsPage() {
  const [activeView, setActiveView] = useState<'transactions' | 'adjustments'>('transactions');
  const [filters, setFilters] = useState<FilterForm>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<AdminTransactionQuery>({ page: 1, page_size: PAGE_SIZE });
  const [transactions, setTransactions] = useState<AdminTransactionPage | null>(null);
  const [adjustments, setAdjustments] = useState<AdminWalletAdjustmentPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminTransactionDetail | null>(null);
  const [timeline, setTimeline] = useState<AdminTransactionTimelineEvent[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailReload, setDetailReload] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    if (activeView === 'transactions') {
      void fetchAdminTransactions(appliedFilters)
        .then((result) => {
          if (active) setTransactions(result);
        })
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : 'Unable to load transactions.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      void fetchAdminWalletAdjustments({
        page: appliedFilters.page,
        page_size: appliedFilters.page_size,
        search: appliedFilters.search,
        start_date: appliedFilters.start_date,
        end_date: appliedFilters.end_date,
      })
        .then((result) => {
          if (active) setAdjustments(result);
        })
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : 'Unable to load wallet adjustments.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [activeView, appliedFilters]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setDetail(null);
    setTimeline([]);
    setDetailError(null);
    setDetailLoading(true);
    void Promise.all([
      fetchAdminTransactionDetails(selectedId),
      fetchAdminTransactionTimeline(selectedId),
    ])
      .then(([transaction, events]) => {
        if (active) {
          setDetail(transaction);
          setTimeline(events);
        }
      })
      .catch((cause: unknown) => {
        if (active) setDetailError(cause instanceof Error ? cause.message : 'Unable to load transaction details.');
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
    const startDate = toIsoDate(filters.startDate, false);
    const endDate = toIsoDate(filters.endDate, true);
    setAppliedFilters({
      page: 1,
      page_size: PAGE_SIZE,
      search: filters.search.trim() || undefined,
      status: filters.status || undefined,
      category: filters.category.trim() || undefined,
      transaction_type: filters.transactionType.trim() || undefined,
      provider: filters.provider.trim() || undefined,
      start_date: startDate,
      end_date: endDate,
      order_by: 'created_at',
      descending: filters.sortOrder === 'newest',
    });
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters({ page: 1, page_size: PAGE_SIZE });
  };

  const changePage = (page: number) => {
    setAppliedFilters((current) => ({ ...current, page }));
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast(`${label} copied`);
    } catch {
      setToast('Copy is unavailable in this browser.');
    }
  };

  const refresh = () => setAppliedFilters((current) => ({ ...current }));
  const page = activeView === 'transactions' ? transactions : adjustments;

  return (
    <div className="transactions-page">
      <header className="transactions-heading">
        <div>
          <h1 className="page-heading">Transaction Management</h1>
          <p className="transactions-subtitle">Read-only activity history from transaction and wallet ledger records.</p>
        </div>
        <button type="button" className="wallet-button" onClick={refresh} disabled={loading}>
          Refresh
        </button>
      </header>

      <div className="transactions-tabs" role="tablist" aria-label="Financial activity source">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'transactions'}
          className={activeView === 'transactions' ? 'transactions-tab active' : 'transactions-tab'}
          onClick={() => {
            setAppliedFilters((current) => ({ ...current, page: 1 }));
            setActiveView('transactions');
          }}
        >
          Transactions
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'adjustments'}
          className={activeView === 'adjustments' ? 'transactions-tab active' : 'transactions-tab'}
          onClick={() => {
            setAppliedFilters((current) => ({ ...current, page: 1 }));
            setActiveView('adjustments');
          }}
        >
          Manual wallet adjustments <span className="transactions-source-label">Ledger</span>
        </button>
      </div>

      {activeView === 'transactions' && (
        <section className="transactions-summary" aria-label="Transaction totals">
          <SummaryCard title="Matching transactions" value={transactions?.summary.total} loading={loading} />
          <SummaryCard title="Successful" value={transactions?.summary.successful} loading={loading} tone="success" />
          <SummaryCard title="Pending" value={transactions?.summary.pending} loading={loading} tone="pending" />
          <SummaryCard title="Failed" value={transactions?.summary.failed} loading={loading} tone="failed" />
          <p className="transactions-summary-note">Totals follow the active transaction filters. Manual adjustments are shown separately from transaction records.</p>
        </section>
      )}

      <section className="panel transactions-panel">
        <form className="transactions-filters" onSubmit={submitFilters} aria-label="Filter financial activity">
          <label className="transactions-filter transactions-filter-search">
            <span>Search</span>
            <input
              className="wallet-control"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Reference, ID, user name or email"
            />
          </label>
          {activeView === 'transactions' && (
            <>
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
                  <option value="completed">Completed</option>
                  <option value="succeeded">Succeeded</option>
                  <option value="settled">Settled</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="reversed">Reversed</option>
                </select>
              </label>
              <label className="transactions-filter">
                <span>Category</span>
                <input
                  className="wallet-control"
                  value={filters.category}
                  onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
                  placeholder="e.g. airtime"
                />
              </label>
              <label className="transactions-filter">
                <span>Type</span>
                <input
                  className="wallet-control"
                  value={filters.transactionType}
                  onChange={(event) => setFilters((current) => ({ ...current, transactionType: event.target.value }))}
                  placeholder="Transaction type"
                />
              </label>
              <label className="transactions-filter">
                <span>Provider</span>
                <input
                  className="wallet-control"
                  value={filters.provider}
                  onChange={(event) => setFilters((current) => ({ ...current, provider: event.target.value }))}
                  placeholder="Provider name"
                />
              </label>
              <label className="transactions-filter">
                <span>Order</span>
                <select
                  className="wallet-control"
                  value={filters.sortOrder}
                  onChange={(event) => setFilters((current) => ({ ...current, sortOrder: event.target.value as FilterForm['sortOrder'] }))}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </>
          )}
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
            <button type="submit" className="wallet-button wallet-button-primary" disabled={loading}>Apply filters</button>
            <button type="button" className="wallet-button" onClick={resetFilters} disabled={loading}>Reset</button>
          </div>
        </form>

        {error && (
          <div className="wallet-error transactions-error" role="alert">
            <span>{error}</span>
            <button type="button" className="wallet-button" onClick={refresh}>Retry</button>
          </div>
        )}

        {activeView === 'transactions' ? (
          <TransactionTable
            items={transactions?.items ?? []}
            loading={loading}
            hasFilters={hasActiveFilters(appliedFilters)}
            onView={setSelectedId}
            onCopy={(value) => void copyText(value, 'Reference')}
          />
        ) : (
          <AdjustmentTable
            items={adjustments?.items ?? []}
            loading={loading}
            hasFilters={Boolean(appliedFilters.search || appliedFilters.start_date || appliedFilters.end_date)}
            onCopy={(value) => void copyText(value, 'Reference')}
          />
        )}

        <div className="wallet-pagination">
          <span className="wallet-subtle">
            {page ? `Page ${page.page} of ${Math.max(page.total_pages, 1)} · ${page.total.toLocaleString()} records` : ' '}
          </span>
          <div className="wallet-actions">
            <button
              type="button"
              className="wallet-button"
              onClick={() => changePage(Math.max(1, (page?.page ?? 1) - 1))}
              disabled={loading || !page || page.page <= 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="wallet-button"
              onClick={() => changePage((page?.page ?? 1) + 1)}
              disabled={loading || !page || page.page >= page.total_pages}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <Modal
        open={selectedId !== null}
        title="Transaction details"
        onClose={() => {
          setSelectedId(null);
          setDetail(null);
          setTimeline([]);
          setDetailError(null);
        }}
      >
        {detailLoading && <div className="transactions-detail-loading" role="status">Loading transaction details…</div>}
        {detailError && (
          <div className="wallet-error transactions-error" role="alert">
            <span>{detailError}</span>
            <button type="button" className="wallet-button" onClick={() => setDetailReload((value) => value + 1)}>Retry</button>
          </div>
        )}
        {detail && (
          <TransactionDetails
            transaction={detail}
            timeline={timeline}
            onCopy={(value) => void copyText(value, 'Value')}
          />
        )}
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
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
  value: number | undefined;
  loading: boolean;
  tone?: 'success' | 'pending' | 'failed';
}) {
  return (
    <article className={`transactions-summary-card ${tone ? `tone-${tone}` : ''}`} aria-busy={loading}>
      <span>{title}</span>
      {loading ? (
        <span className="transactions-summary-skeleton" aria-label="Loading" />
      ) : (
        <strong>{typeof value === 'number' ? value.toLocaleString() : '—'}</strong>
      )}
    </article>
  );
}

function TransactionTable({
  items,
  loading,
  hasFilters,
  onView,
  onCopy,
}: {
  items: AdminTransaction[];
  loading: boolean;
  hasFilters: boolean;
  onView: (id: string) => void;
  onCopy: (value: string) => void;
}) {
  return (
    <div className="transactions-table-scroll" aria-busy={loading}>
      <table className="table transactions-table">
        <thead>
          <tr>
            <th>Reference</th><th>User</th><th>Activity</th><th>Amount</th><th>Provider</th><th>Status</th><th>Date</th><th>Details</th>
          </tr>
        </thead>
        <tbody>
          {loading && items.length === 0 && Array.from({ length: 5 }, (_, index) => (
            <tr key={`loading-${index}`} aria-hidden="true">
              <td colSpan={8}><span className="transactions-row-skeleton" /></td>
            </tr>
          ))}
          {!loading && items.map((transaction) => (
            <tr key={transaction.id}>
              <td>
                <div className="transactions-reference-cell">
                  <span className="transactions-reference" title={transaction.reference}>{transaction.reference}</span>
                  <button type="button" className="transactions-copy-button" onClick={() => onCopy(transaction.reference)} aria-label={`Copy reference ${transaction.reference}`}>Copy</button>
                </div>
              </td>
              <td>
                <span className="transactions-user-name">{transaction.user?.name || 'Name unavailable'}</span>
                <span className="transactions-secondary">{transaction.user?.email || transaction.user_id}</span>
              </td>
              <td>
                <span className="transactions-activity-title">{humanize(transaction.category)} · {humanize(transaction.transaction_type)}</span>
                <span className="transactions-secondary">{transaction.description || 'No description'}</span>
              </td>
              <td className="transactions-amount">{formatMoney(transaction.amount, transaction.currency)}</td>
              <td>
                <span>{transaction.provider_name || 'Not recorded'}</span>
                <span className="transactions-secondary">{transaction.provider_reference || 'No provider reference'}</span>
              </td>
              <td><StatusBadge status={transaction.status} /></td>
              <td>{formatDate(transaction.created_at)}</td>
              <td><button type="button" className="wallet-button" onClick={() => onView(transaction.id)}>View</button></td>
            </tr>
          ))}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={8}>
                <div className="transactions-empty">
                  <strong>{hasFilters ? 'No matching transactions' : 'No transactions recorded yet'}</strong>
                  <span>{hasFilters ? 'Try adjusting the search or filters.' : 'Transactions will appear here when the backend has recorded them.'}</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AdjustmentTable({
  items,
  loading,
  hasFilters,
  onCopy,
}: {
  items: AdminWalletAdjustmentPage['items'];
  loading: boolean;
  hasFilters: boolean;
  onCopy: (value: string) => void;
}) {
  return (
    <div className="transactions-table-scroll" aria-busy={loading}>
      <table className="table transactions-table">
        <thead>
          <tr>
            <th>Ledger reference</th><th>User</th><th>Adjustment</th><th>Amount</th><th>Wallet</th><th>Status</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          {loading && items.length === 0 && Array.from({ length: 4 }, (_, index) => (
            <tr key={`adjustment-loading-${index}`} aria-hidden="true"><td colSpan={7}><span className="transactions-row-skeleton" /></td></tr>
          ))}
          {!loading && items.map((entry) => (
            <tr key={entry.id}>
              <td>
                <div className="transactions-reference-cell">
                  <span className="transactions-reference" title={entry.transaction_reference}>{entry.transaction_reference}</span>
                  <button type="button" className="transactions-copy-button" onClick={() => onCopy(entry.transaction_reference)} aria-label={`Copy reference ${entry.transaction_reference}`}>Copy</button>
                </div>
                <span className="transactions-source-label">Ledger adjustment</span>
              </td>
              <td>
                <span className="transactions-user-name">{entry.user?.name || 'Name unavailable'}</span>
                <span className="transactions-secondary">{entry.user?.email || entry.user_id}</span>
              </td>
              <td>
                <span>{humanize(entry.transaction_type)}</span>
                <span className="transactions-secondary">{entry.adjustment_reason || entry.description || 'No reason recorded'}</span>
              </td>
              <td className="transactions-amount">{formatMoney(Number(entry.credit_amount) > 0 ? entry.credit_amount : `-${entry.debit_amount}`, entry.currency)}</td>
              <td><span className="transactions-id" title={entry.wallet_id}>{entry.wallet_id}</span></td>
              <td><StatusBadge status={entry.status} /></td>
              <td>{formatDate(entry.created_at)}</td>
            </tr>
          ))}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={7}>
                <div className="transactions-empty">
                  <strong>{hasFilters ? 'No matching ledger adjustments' : 'No manual wallet adjustments recorded'}</strong>
                  <span>These entries are sourced from wallet ledger records and are not represented as transactions.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TransactionDetails({
  transaction,
  timeline,
  onCopy,
}: {
  transaction: AdminTransactionDetail;
  timeline: AdminTransactionTimelineEvent[];
  onCopy: (value: string) => void;
}) {
  const metadataEntries = Object.entries(transaction.metadata);
  return (
    <div className="transactions-detail">
      <section className="transactions-detail-section">
        <h4>Transaction identification</h4>
        <DetailRow label="Public reference" value={transaction.reference} copy={() => onCopy(transaction.reference)} />
        <DetailRow label="Internal transaction ID" value={transaction.id} copy={() => onCopy(transaction.id)} />
        <DetailRow label="Provider reference" value={transaction.provider_reference} />
        <DetailRow label="External reference" value={transaction.external_reference} />
        <DetailRow label="Provider transaction ID" value={transaction.provider_transaction_id} />
      </section>
      <section className="transactions-detail-section">
        <h4>User and wallet</h4>
        <DetailRow label="Name" value={transaction.user?.name} />
        <DetailRow label="Email" value={transaction.user?.email} />
        <DetailRow label="User ID" value={transaction.user?.id || transaction.user_id} copy={() => onCopy(transaction.user?.id || transaction.user_id)} />
        <DetailRow label="Wallet ID" value={transaction.wallet_id} />
      </section>
      <section className="transactions-detail-section">
        <h4>Financial information</h4>
        <DetailRow label="Amount" value={transaction.amount ? formatMoney(transaction.amount, transaction.currency) : null} />
        <DetailRow label="Charges" value={transaction.charges ? formatMoney(transaction.charges, transaction.currency) : null} />
        <DetailRow label="Total" value={transaction.total_amount ? formatMoney(transaction.total_amount, transaction.currency) : null} />
        <DetailRow label="Payment method" value={metadataValue(transaction.metadata, ['payment_method', 'payment_type', 'channel'])} />
        <DetailRow label="Provider" value={transaction.provider_name} />
        <DetailRow label="Card amount" value={transaction.card_amount && transaction.card_currency ? formatMoney(transaction.card_amount, transaction.card_currency) : null} />
        <DetailRow label="Payout" value={transaction.payout_amount && transaction.payout_currency ? formatMoney(transaction.payout_amount, transaction.payout_currency) : null} />
        <DetailRow label="Wallet credit" value={transaction.credited_amount && transaction.credited_currency ? formatMoney(transaction.credited_amount, transaction.credited_currency) : null} />
      </section>
      <section className="transactions-detail-section">
        <h4>Transaction information</h4>
        <DetailRow label="Category" value={humanize(transaction.category)} />
        <DetailRow label="Type" value={humanize(transaction.transaction_type)} />
        <DetailRow label="Description" value={transaction.description} />
        <DetailRow label="Status" value={<StatusBadge status={transaction.status} />} />
        <DetailRow label="Created" value={formatDate(transaction.created_at)} />
        <DetailRow label="Updated" value={formatDate(transaction.updated_at)} />
      </section>
      {metadataEntries.length > 0 && (
        <section className="transactions-detail-section">
          <h4>Recorded metadata</h4>
          {metadataEntries.map(([key, value]) => <DetailRow key={key} label={humanize(key)} value={String(value)} />)}
        </section>
      )}
      <section className="transactions-detail-section">
        <h4>Available history</h4>
        {timeline.length ? (
          <ol className="transactions-timeline">
            {timeline.map((event, index) => (
              <li key={`${event.at ?? 'event'}-${index}`}>
                <strong>{humanize(event.event)}</strong>
                <span>{event.description || `Recorded by ${humanize(event.actor_type)}`}</span>
                <time>{formatDate(event.at)}</time>
              </li>
            ))}
          </ol>
        ) : <p className="transactions-subtle">No timeline events are recorded for this transaction.</p>}
      </section>
      <section className="transactions-detail-section">
        <h4>Related ledger entries</h4>
        {transaction.ledger_entries.length ? (
          <div className="transactions-ledger-list">
            {transaction.ledger_entries.map((entry) => (
              <article className="transactions-ledger-entry" key={entry.id}>
                <div><strong>{humanize(entry.transaction_type)} · {humanize(entry.entry_type)}</strong><StatusBadge status={entry.status} /></div>
                <p>{entry.description || entry.transaction_reference}</p>
                <span>{entry.debit_amount !== '0.00' ? `Debit ${formatMoney(entry.debit_amount, entry.currency)}` : `Credit ${formatMoney(entry.credit_amount, entry.currency)}`}</span>
                <time>{formatDate(entry.created_at)}</time>
              </article>
            ))}
          </div>
        ) : <p className="transactions-subtle">No related ledger entries are recorded.</p>}
      </section>
    </div>
  );
}

function DetailRow({ label, value, copy }: { label: string; value: ReactNode; copy?: () => void }) {
  const display = value === null || value === undefined || value === '' ? 'Not recorded' : value;
  return (
    <div className="transactions-detail-row">
      <span>{label}</span>
      <strong>{display}</strong>
      {copy && value && <button type="button" className="transactions-copy-button" onClick={copy} aria-label={`Copy ${label}`}>Copy</button>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase();
  let tone = 'unknown';
  if (['completed', 'successful', 'succeeded', 'settled', 'posted'].includes(normalized)) tone = 'success';
  else if (['pending', 'processing', 'funds_reserved'].includes(normalized)) tone = 'pending';
  else if (normalized === 'failed') tone = 'failed';
  else if (['cancelled', 'canceled', 'voided'].includes(normalized)) tone = 'cancelled';
  else if (normalized === 'reversed') tone = 'reversed';
  return <span className={`transactions-status status-${tone}`}>{humanize(status) || 'Unknown'}</span>;
}

function formatMoney(amount: string, currency: string): string {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return `${amount} ${currency}`;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(numericAmount);
  } catch {
    return `${numericAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
  }
}

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function hasActiveFilters(query: AdminTransactionQuery): boolean {
  return Boolean(query.search || query.status || query.category || query.transaction_type || query.provider || query.start_date || query.end_date);
}

function toIsoDate(value: string, endOfDay: boolean): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function metadataValue(metadata: AdminTransactionDetail['metadata'], keys: string[]): string | null {
  const key = keys.find((candidate) => metadata[candidate] !== undefined);
  return key ? String(metadata[key]) : null;
}

export default TransactionsPage;
