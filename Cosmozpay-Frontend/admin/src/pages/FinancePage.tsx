import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Modal from '../components/Modal';
import {
  fetchAdminFinanceReport,
  fetchAdminFinanceTransaction,
  type AdminFinanceActivity,
  type AdminFinanceQuery,
  type AdminFinanceReport,
  type AdminFinanceTransactionDetail,
} from '../services/adminFinance';

const PAGE_SIZE = 20;

interface FinanceFilters {
  search: string;
  category: string;
  status: string;
  provider: string;
  currency: string;
  startDate: string;
  endDate: string;
}

const emptyFilters: FinanceFilters = {
  search: '',
  category: '',
  status: '',
  provider: '',
  currency: '',
  startDate: '',
  endDate: '',
};

function FinancePage() {
  const [filters, setFilters] = useState<FinanceFilters>(emptyFilters);
  const [query, setQuery] = useState<AdminFinanceQuery>({ page: 1, page_size: PAGE_SIZE });
  const [report, setReport] = useState<AdminFinanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminFinanceTransactionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailReload, setDetailReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void fetchAdminFinanceReport(query)
      .then((response) => {
        if (active) setReport(response);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load financial records.');
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
    void fetchAdminFinanceTransaction(selectedId)
      .then((response) => {
        if (active) setDetail(response);
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

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery({
      page: 1,
      page_size: PAGE_SIZE,
      search: filters.search.trim() || undefined,
      category: filters.category || undefined,
      status: filters.status || undefined,
      provider: filters.provider.trim() || undefined,
      currency: filters.currency || undefined,
      start_date: toIsoDate(filters.startDate, false),
      end_date: toIsoDate(filters.endDate, true),
    });
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setQuery({ page: 1, page_size: PAGE_SIZE });
  };
  const refresh = () => setReload((current) => current + 1);
  const closeDetails = () => {
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
  };

  return (
    <div className="transactions-page finance-page">
      <header className="transactions-heading">
        <div>
          <h1 className="page-heading">Finance Management</h1>
          <p className="transactions-subtitle">
            Financial activity is reported from persisted transaction and wallet ledger records.
          </p>
        </div>
        <button type="button" className="wallet-button" onClick={refresh} disabled={loading}>
          Refresh
        </button>
      </header>

      {report && (
        <section className="finance-overview" aria-label="Financial overview">
          <article className="finance-revenue-note">
            <div>
              <span className="finance-eyebrow">Provisional service estimates</span>
              <p>
                These figures use the administrator-configured cost snapshot captured for each successful service.
                They are estimates, not provider-confirmed charges or recognized platform revenue.
              </p>
            </div>
            <span className="finance-unavailable-badge">Estimated only</span>
          </article>
          {report.successful_service_sales_by_currency.map((sales) => {
            const estimate = report.estimated_service_margin_by_currency.find((item) => item.currency === sales.currency);
            return (
              <section className="finance-currency-group" key={`estimate-${sales.currency}`}
                aria-label={`${sales.currency} provisional service estimates`}>
                <h2>{sales.currency} · provisional service accounting</h2>
                <div className="finance-kpi-grid">
                  <MetricCard title="Successful service sales" amount={sales.selling_amount} currency={sales.currency} />
                  <CountMetricCard title="Successfully fulfilled service transactions" count={sales.transaction_count} />
                  {estimate ? (
                    <>
                      <MetricCard title="Estimated provider acquisition cost"
                        amount={estimate.provider_cost} currency={sales.currency} />
                      <MetricCard title="Estimated service margin (not recognized revenue)"
                        amount={estimate.estimated_margin} currency={sales.currency} />
                    </>
                  ) : (
                    <>
                      <UnavailableMetricCard title="Estimated provider acquisition cost" />
                      <UnavailableMetricCard title="Estimated service margin (not recognized revenue)" />
                    </>
                  )}
                </div>
                {!estimate && (
                  <p className="finance-estimate-note">
                    No configured cost snapshot is available for this currency and filter scope. Estimated margin is unavailable.
                  </p>
                )}
              </section>
            );
          })}
          {!report.successful_service_sales_by_currency.length && !loading && (
            <div className="transactions-empty finance-empty">
              <strong>No successfully fulfilled service transactions for this filter scope</strong>
              <span>No service-sales or estimated-margin figures are inferred from wallet activity.</span>
            </div>
          )}
          {report.revenue.available ? (
            <>
              <article className="finance-revenue-note">
                <div>
                  <span className="finance-eyebrow">Verified platform revenue</span>
                  <p>{report.revenue.reason || 'Revenue is shown only when supported by persisted retained-income records.'}</p>
                </div>
                <span className="finance-unavailable-badge">Persisted records</span>
              </article>
              {report.revenue_by_currency.map((revenue) => (
                <section className="finance-currency-group" key={`revenue-${revenue.currency}`}
                  aria-label={`${revenue.currency} recognized platform revenue`}>
                  <h2>{revenue.currency} · recognized platform revenue</h2>
                  <div className="finance-kpi-grid">
                    {revenue.recognized_count > 0 ? (
                      <>
                        <MetricCard title="Gross recognized revenue" amount={revenue.gross_amount} currency={revenue.currency} />
                        <MetricCard title="Revenue reversals" amount={revenue.reversal_amount} currency={revenue.currency} />
                        <MetricCard title="Net recognized revenue" amount={revenue.net_amount} currency={revenue.currency} />
                      </>
                    ) : (
                      <article className="finance-metric-card">
                        <span>Recognized revenue</span>
                        <strong>Unavailable for this currency</strong>
                      </article>
                    )}
                    <MetricCard title="Selling price with cost evidence" amount={revenue.selling_amount} currency={revenue.currency} />
                    <MetricCard title="Actual provider cost" amount={revenue.provider_cost} currency={revenue.currency} />
                    <MetricCard title="Net service loss" amount={revenue.loss_amount} currency={revenue.currency} />
                  </div>
                </section>
              ))}
            </>
          ) : (
            <article className="finance-revenue-note">
              <div>
                <span className="finance-eyebrow">Verified platform revenue</span>
                <strong>Not tracked</strong>
                <p>{report.revenue.reason || 'No authoritative transaction-specific provider cost is available yet. Estimates are not recognized as revenue.'}</p>
              </div>
              <span className="finance-unavailable-badge">Unavailable</span>
            </article>
          )}
          {report.currencies.map((summary) => (
            <section className="finance-currency-group" key={summary.currency} aria-label={`${summary.currency} transaction volume`}>
              <h2>{summary.currency} · {summary.successful_transaction_count.toLocaleString()} completed transactions</h2>
              <div className="finance-kpi-grid">
                <MetricCard title="Gross transaction volume" amount={summary.gross_transaction_volume} currency={summary.currency} />
                <MetricCard title="Wallet funding volume" amount={summary.wallet_funding_volume} currency={summary.currency} />
                <MetricCard title="Transfer volume" amount={summary.transfer_volume} currency={summary.currency} />
                <MetricCard title="Withdrawal volume" amount={summary.withdrawal_volume} currency={summary.currency} />
                <MetricCard title="Other transaction volume" amount={summary.other_volume} currency={summary.currency} />
                <MetricCard title="Unverified customer charges (not revenue)" amount={summary.unverified_customer_charges} currency={summary.currency} />
                <CountMetricCard title="Pending transactions" count={summary.pending_transaction_count} />
                <CountMetricCard title="Failed transactions" count={summary.failed_transaction_count} />
                <MetricCard title="Refund adjustments" amount={summary.refund_adjustments} currency={summary.currency} />
                <MetricCard title="Reversal adjustments" amount={summary.reversal_adjustments} currency={summary.currency} />
              </div>
            </section>
          ))}
          {!report.currencies.length && !loading && (
            <div className="transactions-empty finance-empty">
              <strong>No financial totals for this date range</strong>
              <span>Try a wider date range. No values are inferred from pending or failed records.</span>
            </div>
          )}
        </section>
      )}

      <section className="panel finance-analytics">
        <div className="finance-section-heading">
          <div>
            <h2 className="section-title">Transaction volume trends</h2>
            <p>Daily completed transaction principal, grouped by currency. This is not revenue.</p>
          </div>
        </div>
        {loading && !report && <div className="transactions-detail-loading" aria-live="polite">Loading finance report…</div>}
        {error && (
          <div className="wallet-error transactions-error" role="alert">
            <span>{error}</span>
            <button type="button" className="wallet-button" onClick={refresh}>Retry</button>
          </div>
        )}
        {report && <VolumeTrend report={report} />}
      </section>

      {report && (
        <section className="finance-breakdowns">
          <Breakdown title="Successful service transactions without verified provider-cost evidence" columns={[
            'Service', 'Provider', 'Currency', 'Transactions', 'Accounting status',
          ]} rows={report.cost_evidence_unavailable.map((row) => [
            humanize(row.service_category),
            row.provider_identifier,
            row.currency,
            row.transaction_count.toLocaleString(),
            row.reason,
          ])} />
          <Breakdown title="Verified service-margin evidence" columns={[
            'Service', 'Currency', 'Selling price', 'Provider cost', 'Gross margin', 'Recognized margin',
            'Income reversals', 'Net margin', 'Loss', 'Transactions',
          ]} rows={report.service_margin_breakdown.map((row) => [
            humanize(row.service_category),
            row.currency,
            formatMoney(row.selling_amount, row.currency),
            formatMoney(row.provider_cost, row.currency),
            formatMoney(row.gross_margin, row.currency),
            formatMoney(row.recognized_margin, row.currency),
            formatMoney(row.reversal_amount, row.currency),
            formatMoney(row.net_margin, row.currency),
            formatMoney(row.loss_amount, row.currency),
            row.transaction_count.toLocaleString(),
          ])} />
          <Breakdown title="Provider-cost snapshots (not platform revenue)" columns={[
            'Evidence class', 'Service / provider', 'Currency', 'Selling amount', 'Cost snapshot',
            'Margin snapshot', 'Transactions',
          ]} rows={report.provider_cost_breakdown.map((row) => [
            row.source_class,
            `${humanize(row.service_type)} · ${row.provider_identifier || 'Unattributed'}`,
            row.currency,
            formatMoney(row.selling_amount, row.currency),
            row.provider_cost === null ? 'Unavailable' : formatMoney(row.provider_cost, row.currency),
            row.margin === null ? 'Unavailable' : formatMoney(row.margin, row.currency),
            row.transaction_count.toLocaleString(),
          ])} />
          {report.service_margin_trends.length > 0 && (
            <Breakdown title="Recognized service-margin trends" columns={[
              'Date', 'Currency', 'Gross recognized margin', 'Income reversals', 'Net recognized margin',
            ]} rows={report.service_margin_trends.map((row) => [
              row.date,
              row.currency,
              formatMoney(row.gross_margin, row.currency),
              formatMoney(row.reversal_amount, row.currency),
              formatMoney(row.net_margin, row.currency),
            ])} />
          )}
          <Breakdown title="Volume by transaction category" columns={['Category', 'Currency', 'Transaction volume']}
            rows={report.categories.map((row) => [humanize(row.category), row.currency, formatMoney(row.transaction_volume, row.currency)])} />
          <Breakdown title="Volume by provider" columns={['Provider', 'Currency', 'Transaction volume']}
            rows={report.providers.map((row) => [row.provider, row.currency, formatMoney(row.transaction_volume, row.currency)])} />
        </section>
      )}

      {report && (
        <section className="provider-cost-finance-note">
          <strong>{report.awaiting_cost_verification_count.toLocaleString()} successful service transaction(s) await cost verification</strong>
          <span>
            Admin-configured costs are shown as configuration snapshots only. They are not verified provider debits
            and are never included in recognized platform revenue.
          </span>
        </section>
      )}

      <section className="panel transactions-panel finance-activity">
        <div className="finance-section-heading">
          <div>
            <h2 className="section-title">Financial activity</h2>
            <p>Transaction principal, recorded charges and ledger movements are shown separately.</p>
          </div>
        </div>
        <form className="transactions-filters finance-filters" onSubmit={applyFilters} aria-label="Filter financial activity">
          <label className="transactions-filter transactions-filter-search">
            <span>Search</span>
            <input className="wallet-control" value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="User, transaction or provider reference" />
          </label>
          <label className="transactions-filter">
            <span>Category</span>
            <select className="wallet-control" value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
              <option value="">All categories</option>
              {(report?.available_categories ?? []).map((category) => (
                <option key={category} value={category}>{humanize(category)}</option>
              ))}
            </select>
          </label>
          <label className="transactions-filter">
            <span>Status</span>
            <select className="wallet-control" value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All statuses</option>
              {['pending', 'processing', 'completed', 'succeeded', 'settled', 'failed', 'cancelled', 'reversed'].map((status) => (
                <option key={status} value={status}>{humanize(status)}</option>
              ))}
            </select>
          </label>
          <label className="transactions-filter">
            <span>Provider</span>
            <input className="wallet-control" value={filters.provider}
              onChange={(event) => setFilters((current) => ({ ...current, provider: event.target.value }))}
              placeholder="Provider name" />
          </label>
          <label className="transactions-filter">
            <span>Currency</span>
            <select className="wallet-control" value={filters.currency}
              onChange={(event) => setFilters((current) => ({ ...current, currency: event.target.value }))}>
              <option value="">All currencies</option>
              {(report?.available_currencies ?? []).map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </select>
          </label>
          <label className="transactions-filter">
            <span>From</span>
            <input className="wallet-control" type="date" value={filters.startDate}
              onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} />
          </label>
          <label className="transactions-filter">
            <span>To</span>
            <input className="wallet-control" type="date" value={filters.endDate}
              onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} />
          </label>
          <div className="transactions-filter-actions">
            <button type="submit" className="wallet-button wallet-button-primary" disabled={loading}>Apply</button>
            <button type="button" className="wallet-button" onClick={resetFilters} disabled={loading}>Reset</button>
          </div>
        </form>

        <FinanceActivityTable items={report?.activity.items ?? []} loading={loading} onView={setSelectedId} />
        <footer className="payments-pagination" aria-label="Finance activity pages">
          <span>
            {report ? `${report.activity.total.toLocaleString()} records · Page ${report.activity.page} of ${Math.max(report.activity.total_pages, 1)}` : 'Loading financial activity'}
          </span>
          <div>
            <button type="button" className="wallet-button"
              onClick={() => setQuery((current) => ({ ...current, page: Math.max(1, (report?.activity.page ?? 1) - 1) }))}
              disabled={loading || !report || report.activity.page <= 1}>Previous</button>
            <button type="button" className="wallet-button"
              onClick={() => setQuery((current) => ({ ...current, page: (report?.activity.page ?? 1) + 1 }))}
              disabled={loading || !report || report.activity.page >= report.activity.total_pages}>Next</button>
          </div>
        </footer>
      </section>

      <Modal open={selectedId !== null} title="Financial transaction details" onClose={closeDetails}>
        {detailLoading && <div className="transactions-detail-loading" aria-live="polite">Loading persisted transaction details…</div>}
        {detailError && (
          <div className="wallet-error transactions-error" role="alert">
            <span>{detailError}</span>
            <button type="button" className="wallet-button" onClick={() => setDetailReload((current) => current + 1)}>Retry</button>
          </div>
        )}
        {detail && <FinanceDetails transaction={detail} />}
      </Modal>
    </div>
  );
}

function MetricCard({ title, amount, currency }: { title: string; amount: string; currency: string }) {
  return (
    <article className="finance-metric-card">
      <span>{title}</span>
      <strong>{formatMoney(amount, currency)}</strong>
    </article>
  );
}

function CountMetricCard({ title, count }: { title: string; count: number }) {
  return (
    <article className="finance-metric-card">
      <span>{title}</span>
      <strong>{count.toLocaleString()}</strong>
    </article>
  );
}

function UnavailableMetricCard({ title }: { title: string }) {
  return (
    <article className="finance-metric-card">
      <span>{title}</span>
      <strong>Unavailable</strong>
    </article>
  );
}

function VolumeTrend({ report }: { report: AdminFinanceReport }) {
  if (!report.trends.length) {
    return <div className="transactions-empty finance-empty"><strong>No completed transaction data</strong><span>There are no persisted completed transactions for this date range.</span></div>;
  }
  const maxByCurrency = new Map<string, number>();
  for (const point of report.trends) {
    maxByCurrency.set(point.currency, Math.max(maxByCurrency.get(point.currency) ?? 0, Number(point.transaction_volume)));
  }
  return (
    <div className="finance-trends">
      {report.trends.map((point) => {
        const maximum = maxByCurrency.get(point.currency) ?? 0;
        const width = maximum > 0 ? Math.max(1, (Number(point.transaction_volume) / maximum) * 100) : 0;
        return (
          <div className="finance-trend-row" key={`${point.date}-${point.currency}`}>
            <time dateTime={point.date}>{formatDate(point.date)}</time>
            <strong>{formatMoney(point.transaction_volume, point.currency)}</strong>
            <div className="finance-trend-track" aria-label={`${point.currency} transaction volume on ${point.date}`}>
              <span style={{ width: `${width}%` }} />
            </div>
            <span className="finance-trend-currency">{point.currency}</span>
          </div>
        );
      })}
    </div>
  );
}

function Breakdown({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <section className="panel finance-breakdown">
      <h2 className="section-title">{title}</h2>
      <div className="transactions-table-scroll">
        <table className="table transactions-table">
          <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, index) => <tr key={`${row[0]}-${row[1]}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`}>{cell}</td>)}</tr>)}
            {!rows.length && <tr><td colSpan={columns.length}><div className="transactions-empty"><span>No persisted breakdown data.</span></div></td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FinanceActivityTable({
  items,
  loading,
  onView,
}: {
  items: AdminFinanceActivity[];
  loading: boolean;
  onView: (id: string) => void;
}) {
  return (
    <div className="transactions-table-scroll">
      <table className="table transactions-table finance-table">
        <thead><tr><th>Reference</th><th>Category</th><th>Provider</th><th>Principal</th><th>Recorded charges</th><th>Status</th><th>Date</th><th /></tr></thead>
        <tbody>
          {loading && Array.from({ length: 4 }, (_, index) => (
            <tr key={`finance-loading-${index}`} aria-hidden="true"><td colSpan={8}><span className="transactions-row-skeleton" /></td></tr>
          ))}
          {!loading && items.map((item) => (
            <tr key={item.id}>
              <td><span className="transactions-reference">{item.reference}</span>
                {item.provider_reference && <span className="transactions-secondary">Provider ref: {item.provider_reference}</span>}</td>
              <td>{humanize(item.category)}</td>
              <td>{item.provider_name || 'Not recorded'}</td>
              <td className="transactions-amount">{formatMoney(item.amount, item.currency)}</td>
              <td>{formatMoney(item.charges, item.currency)}</td>
              <td><span className={`finance-status finance-status-${item.status.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{humanize(item.status)}</span></td>
              <td>{formatDate(item.created_at)}</td>
              <td><button type="button" className="wallet-button" onClick={() => onView(item.id)}>Details</button></td>
            </tr>
          ))}
          {!loading && !items.length && (
            <tr><td colSpan={8}><div className="transactions-empty"><strong>No financial activity found</strong><span>Try changing the filters. Records are shown only when persisted by the backend.</span></div></td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function FinanceDetails({ transaction }: { transaction: AdminFinanceTransactionDetail }) {
  return (
    <div className="transactions-detail finance-detail">
      <section className="transactions-detail-section">
        <h4>Transaction</h4>
        <DetailRow label="Reference" value={transaction.reference} />
        <DetailRow label="Category" value={humanize(transaction.category)} />
        <DetailRow label="Type" value={humanize(transaction.transaction_type)} />
        <DetailRow label="Principal" value={formatMoney(transaction.amount, transaction.currency)} />
        <DetailRow label="Recorded charges (not assumed revenue)" value={formatMoney(transaction.charges, transaction.currency)} />
        <DetailRow label="Total amount" value={formatMoney(transaction.total_amount, transaction.currency)} />
        <DetailRow label="Status" value={humanize(transaction.status)} />
        <DetailRow label="Provider" value={transaction.provider_name || 'Not recorded'} />
        <DetailRow label="Provider reference" value={transaction.provider_reference || 'Not recorded'} />
        <DetailRow label="Created" value={formatDate(transaction.created_at)} />
        <DetailRow label="Updated" value={formatDate(transaction.updated_at)} />
      </section>
      <section className="transactions-detail-section">
        <h4>Provisional configured-cost snapshot</h4>
        {transaction.provisional_cost_snapshot ? (
          <div className="finance-ledger-row">
            <strong>{humanize(transaction.provisional_cost_snapshot.service_type)} · {humanize(transaction.provisional_cost_snapshot.source_class)}</strong>
            <span>
              Selling {formatMoney(transaction.provisional_cost_snapshot.selling_amount, transaction.provisional_cost_snapshot.currency)}
              {' · '}Configured provider cost {transaction.provisional_cost_snapshot.provider_cost === null
                ? 'Unavailable'
                : formatMoney(transaction.provisional_cost_snapshot.provider_cost, transaction.provisional_cost_snapshot.currency)}
            </span>
            <span>
              Estimated margin {transaction.provisional_cost_snapshot.estimated_margin === null
                ? 'Unavailable'
                : formatMoney(transaction.provisional_cost_snapshot.estimated_margin, transaction.provisional_cost_snapshot.currency)}
              {' · '}This is not verified provider cost or recognized revenue.
            </span>
            <span>
              Provider {transaction.provisional_cost_snapshot.provider_identifier || 'Not recorded'}
              {' · '}Reference {transaction.provisional_cost_snapshot.provider_reference || 'Not recorded'}
            </span>
            {transaction.provisional_cost_snapshot.reason && <span>{transaction.provisional_cost_snapshot.reason}</span>}
            <span>Snapshot time {formatDate(transaction.provisional_cost_snapshot.snapshot_at)}</span>
          </div>
        ) : <p>No transaction-time configured-cost snapshot is recorded for this transaction.</p>}
      </section>
      <section className="transactions-detail-section">
        <h4>Persisted service-margin evidence</h4>
        {transaction.service_margin_evidence.length ? transaction.service_margin_evidence.map((evidence) => (
          <div className="finance-ledger-row" key={`${evidence.provider_cost_reference}-${evidence.service_category}`}>
            <strong>{humanize(evidence.service_category)} · {humanize(evidence.status)}</strong>
            <span>Selling {formatMoney(evidence.selling_amount, evidence.currency)} · Provider cost {formatMoney(evidence.provider_cost, evidence.currency)}</span>
            <span>Gross margin {formatMoney(evidence.gross_margin, evidence.currency)} · Recognized {formatMoney(evidence.recognized_amount, evidence.currency)} · Reversed {formatMoney(evidence.reversal_amount, evidence.currency)} · Net {formatMoney(evidence.net_amount, evidence.currency)}</span>
            <span>Cost source {humanize(evidence.cost_source)} · Provider {evidence.provider_identifier} · {evidence.provider_reference}</span>
            <span>Cost evidence reference {evidence.provider_cost_reference}</span>
            {evidence.reversals.map((reversal) => (
              <span key={reversal.event_reference}>
                Reversal {reversal.event_reference} · {formatMoney(reversal.amount, reversal.currency)} · {formatDate(reversal.created_at)}
                {reversal.source_reference ? ` · Source ${reversal.source_reference}` : ''}
              </span>
            ))}
          </div>
        )) : <p>No transaction-specific provider-cost evidence has been recorded.</p>}
      </section>
      <section className="transactions-detail-section">
        <h4>Persisted ledger movements</h4>
        {transaction.ledger_entries.length ? transaction.ledger_entries.map((entry, index) => (
          <div className="finance-ledger-row" key={`${entry.transaction_reference}-${entry.created_at}-${index}`}>
            <strong>{humanize(entry.entry_type)} · {humanize(entry.status)}</strong>
            <span>Debit {formatMoney(entry.debit_amount, entry.currency)} · Credit {formatMoney(entry.credit_amount, entry.currency)}</span>
            <span>{entry.transaction_type} · {formatDate(entry.created_at)}</span>
          </div>
        )) : <p>No associated ledger entry is recorded for this transaction.</p>}
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="transactions-detail-row"><span>{label}</span><strong>{value}</strong></div>;
}

function formatMoney(value: string, currency: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currency} ${value}`;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
}

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function humanize(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toIsoDate(value: string, endOfDay: boolean): string | undefined {
  if (!value) return undefined;
  return `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`;
}

export default FinancePage;
