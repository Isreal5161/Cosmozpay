import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  createProviderCostConfiguration,
  deactivateProviderCostConfiguration,
  fetchAwaitingProviderCosts,
  fetchProviderCostConfigurations,
  fetchProviderCostHistory,
  fetchProviderCostProviders,
  fetchProviderCostSnapshots,
  fetchConfigurationTransactions,
  updateProviderCostConfiguration,
  type ProviderCostAwaitingTransaction,
  type ProviderCostConfiguration,
  type ProviderCostConfigurationInput,
  type ProviderCostPage,
  type ProviderCostProvider,
  type ProviderCostSnapshot,
} from '../services/adminProviderCosts';

const PAGE_SIZE = 20;
const SERVICE_OPTIONS = [
  ['airtime', 'Airtime'],
  ['data', 'Data'],
  ['awoof_data', 'Awoof data'],
  ['electricity', 'Electricity'],
  ['tv', 'TV subscription'],
  ['education', 'Education product'],
  ['giftcard_buy', 'Gift-card purchase'],
] as const;

interface CostForm {
  provider_id: string;
  service_type: string;
  network_identifier: string;
  product_identifier: string;
  currency: string;
  cost_method: ProviderCostConfigurationInput['cost_method'];
  cost_value: string;
  effective_from: string;
  effective_until: string;
  evidence_note: string;
}

const emptyForm = (): CostForm => ({
  provider_id: '',
  service_type: '',
  network_identifier: '',
  product_identifier: '',
  currency: 'NGN',
  cost_method: 'fixed_amount',
  cost_value: '',
  effective_from: toLocalDateTimeInput(new Date()),
  effective_until: '',
  evidence_note: '',
});

function ProviderCostsPage() {
  const { admin } = useAdminAuth();
  const canEdit = ['admin', 'super_admin'].includes((admin?.role ?? '').trim().toLowerCase().replace(/ /g, '_'));
  const [providers, setProviders] = useState<ProviderCostProvider[]>([]);
  const [configurations, setConfigurations] = useState<ProviderCostPage<ProviderCostConfiguration> | null>(null);
  const [snapshots, setSnapshots] = useState<ProviderCostPage<ProviderCostSnapshot> | null>(null);
  const [awaiting, setAwaiting] = useState<ProviderCostPage<ProviderCostAwaitingTransaction> | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<ProviderCostConfiguration | null>(null);
  const [history, setHistory] = useState<ProviderCostPage<ProviderCostConfiguration> | null>(null);
  const [configTransactions, setConfigTransactions] = useState<ProviderCostPage<ProviderCostSnapshot> | null>(null);
  const [form, setForm] = useState<CostForm>(emptyForm);
  const [editing, setEditing] = useState<ProviderCostConfiguration | null>(null);
  const [serviceFilter, setServiceFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [configurationPage, setConfigurationPage] = useState(1);
  const [evidencePage, setEvidencePage] = useState(1);
  const [tab, setTab] = useState<'snapshots' | 'awaiting'>('snapshots');
  const [loading, setLoading] = useState(true);
  const [evidenceLoading, setEvidenceLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const activeProviders = useMemo(() => providers.filter((provider) => provider.is_active), [providers]);
  const providersForService = useMemo(
    () => activeProviders.filter((provider) => !form.service_type || provider.category === getProviderCategory(form.service_type)),
    [activeProviders, form.service_type],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchProviderCostProviders(),
      fetchProviderCostConfigurations({
        page: configurationPage,
        page_size: PAGE_SIZE,
        provider_id: providerFilter || undefined,
        service_type: serviceFilter || undefined,
        currency: currencyFilter || undefined,
      }),
    ]).then(([providerRows, configRows]) => {
      if (!active) return;
      setProviders(providerRows);
      setConfigurations(configRows);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Unable to load provider cost records.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [reload, configurationPage, providerFilter, serviceFilter, currencyFilter]);

  useEffect(() => {
    let active = true;
    setEvidenceLoading(true);
    const filters = {
      page: evidencePage,
      page_size: PAGE_SIZE,
      provider_id: providerFilter || undefined,
      service_type: serviceFilter || undefined,
      currency: currencyFilter || undefined,
    };
    const snapshotRequest = fetchProviderCostSnapshots({ ...filters, source_class: sourceFilter || undefined });
    const awaitingRequest = fetchAwaitingProviderCosts(filters);
    Promise.all([snapshotRequest, awaitingRequest]).then(([snapshotRows, awaitingRows]) => {
      if (!active) return;
      setSnapshots(snapshotRows);
      setAwaiting(awaitingRows);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Unable to filter provider cost records.');
    }).finally(() => {
      if (active) setEvidenceLoading(false);
    });
    return () => { active = false; };
  }, [providerFilter, serviceFilter, currencyFilter, sourceFilter, evidencePage, reload]);

  const reset = () => {
    setEditing(null);
    setSelectedConfig(null);
    setHistory(null);
    setConfigTransactions(null);
    setForm(emptyForm());
    setMessage(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!form.provider_id || !form.service_type || !form.currency.trim() || !form.cost_value.trim() || !form.evidence_note.trim()) {
      setError('Complete the provider, service, currency, cost and administrative note fields.');
      return;
    }
    if (!Number.isFinite(Number(form.cost_value)) || Number(form.cost_value) <= 0) {
      setError('Cost must be a positive decimal value.');
      return;
    }
    const payload: ProviderCostConfigurationInput = {
      provider_id: form.provider_id,
      service_type: form.service_type,
      network_identifier: form.network_identifier.trim() || null,
      product_identifier: form.product_identifier.trim() || null,
      currency: form.currency.trim().toUpperCase(),
      cost_method: form.cost_method,
      cost_value: form.cost_value,
      effective_from: new Date(form.effective_from).toISOString(),
      effective_until: form.effective_until ? new Date(form.effective_until).toISOString() : null,
      evidence_note: form.evidence_note.trim(),
    };
    setSaving(true);
    try {
      const saved = editing
        ? await updateProviderCostConfiguration(editing.id, payload)
        : await createProviderCostConfiguration(payload);
      setMessage(editing ? 'A new configuration version is active; previous transaction snapshots were preserved.' : 'Admin-configured provider cost saved.');
      setSelectedConfig(saved);
      setEditing(null);
      setForm(emptyForm());
      setReload((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save the provider cost configuration.');
    } finally {
      setSaving(false);
    }
  };

  const edit = (configuration: ProviderCostConfiguration) => {
    setEditing(configuration);
    setForm({
      provider_id: configuration.provider_id,
      service_type: configuration.service_type,
      network_identifier: configuration.network_identifier ?? '',
      product_identifier: configuration.product_identifier ?? '',
      currency: configuration.currency,
      cost_method: configuration.cost_method,
      cost_value: configuration.cost_value,
      effective_from: toLocalDateTimeInput(new Date()),
      effective_until: '',
      evidence_note: configuration.evidence_note,
    });
  };

  const deactivate = async (configuration: ProviderCostConfiguration) => {
    if (!window.confirm(`Deactivate ${configuration.provider_name} ${configuration.service_type} cost rule? Historical snapshots will remain unchanged.`)) return;
    setError(null);
    setMessage(null);
    try {
      await deactivateProviderCostConfiguration(configuration.id);
      setMessage('Configuration deactivated. Existing transaction snapshots were not changed.');
      setReload((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to deactivate this configuration.');
    }
  };

  const loadHistory = async (configuration: ProviderCostConfiguration) => {
    setSelectedConfig(configuration);
    setHistory(null);
    setConfigTransactions(null);
    try {
      const [versions, transactions] = await Promise.all([
        fetchProviderCostHistory(configuration.id),
        fetchConfigurationTransactions(configuration.id),
      ]);
      setHistory(versions);
      setConfigTransactions(transactions);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load configuration history.');
    }
  };

  return (
    <div className="provider-cost-page">
      <header className="transactions-heading">
        <div>
          <h1 className="page-heading">Provider Acquisition Costs</h1>
          <p className="transactions-subtitle">
            Admin-entered cost rules are estimates for operations, not evidence of provider debits or verified platform revenue.
          </p>
        </div>
        <button className="wallet-button" type="button" onClick={() => setReload((current) => current + 1)} disabled={loading || evidenceLoading}>
          Refresh
        </button>
      </header>

      {error && <div className="wallet-error" role="alert">{error}</div>}
      {message && <div className="provider-cost-success" role="status">{message}</div>}

      <section className="panel provider-cost-panel">
        <div className="finance-section-heading">
          <div>
            <h2 className="section-title">{editing ? 'Create a new configuration version' : 'Add acquisition-cost configuration'}</h2>
            <p>Changes are effective-dated. Existing transaction-time snapshots are immutable.</p>
          </div>
          {editing && <button className="wallet-button" type="button" onClick={reset}>Cancel edit</button>}
        </div>
        {!canEdit && <p className="provider-cost-callout">Your administrator role is read-only for cost configuration changes.</p>}
        {canEdit && (
          <form className="provider-cost-form" onSubmit={(event) => void submit(event)}>
            <label>
              <span>Provider</span>
              <select required value={form.provider_id} onChange={(event) => setForm((current) => ({ ...current, provider_id: event.target.value }))}>
                <option value="">Select registered provider</option>
                {providersForService.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} · {provider.category}</option>)}
              </select>
            </label>
            <label>
              <span>Service</span>
              <select required value={form.service_type} onChange={(event) => setForm((current) => ({ ...current, service_type: event.target.value, provider_id: '' }))}>
                <option value="">Select service</option>
                {SERVICE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              <span>Network / operator ID (optional)</span>
              <input value={form.network_identifier} onChange={(event) => setForm((current) => ({ ...current, network_identifier: event.target.value }))} maxLength={120} />
            </label>
            <label>
              <span>Provider product / package ID (optional)</span>
              <input value={form.product_identifier} onChange={(event) => setForm((current) => ({ ...current, product_identifier: event.target.value }))} maxLength={180} />
            </label>
            <label>
              <span>Currency</span>
              <input required value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))} maxLength={10} />
            </label>
            <label>
              <span>Configured cost calculation</span>
              <select value={form.cost_method} onChange={(event) => setForm((current) => ({ ...current, cost_method: event.target.value as CostForm['cost_method'] }))}>
                <option value="fixed_amount">Fixed cost amount</option>
                <option value="percentage_of_selling_amount">Percent of selling amount</option>
              </select>
            </label>
            <label>
              <span>{form.cost_method === 'fixed_amount' ? 'Cost amount' : 'Cost percent'}</span>
              <input required inputMode="decimal" value={form.cost_value} onChange={(event) => setForm((current) => ({ ...current, cost_value: event.target.value }))} />
            </label>
            <label>
              <span>Effective from</span>
              <input required type="datetime-local" value={form.effective_from} onChange={(event) => setForm((current) => ({ ...current, effective_from: event.target.value }))} />
            </label>
            {!editing && (
              <label>
                <span>Effective until (optional)</span>
                <input type="datetime-local" value={form.effective_until} onChange={(event) => setForm((current) => ({ ...current, effective_until: event.target.value }))} />
              </label>
            )}
            <label className="provider-cost-form-wide">
              <span>Admin note / source description</span>
              <textarea required value={form.evidence_note} onChange={(event) => setForm((current) => ({ ...current, evidence_note: event.target.value }))} maxLength={2000} rows={3} />
            </label>
            <p className="provider-cost-form-wide provider-cost-callout">
              The rule will be stored as <strong>ADMIN_CONFIGURED</strong>; the note does not verify an actual provider debit.
              Provider catalogues, charges and customer payouts are not used as cost evidence.
            </p>
            <div className="provider-cost-form-wide provider-cost-actions">
              <button className="wallet-button wallet-button-primary" type="submit" disabled={saving || loading}>
                {saving ? 'Saving…' : editing ? 'Save new version' : 'Create cost rule'}
              </button>
              {editing && <span>Updates create a new effective-dated version, not a historical rewrite.</span>}
            </div>
          </form>
        )}
      </section>

      <section className="panel provider-cost-panel">
        <div className="finance-section-heading">
          <div><h2 className="section-title">Cost configurations</h2><p>{configurations?.total ?? 0} versioned rules</p></div>
        </div>
        {loading && <div className="transactions-detail-loading" aria-live="polite">Loading cost configurations…</div>}
        {!loading && configurations?.items.length === 0 && <div className="transactions-empty"><strong>No cost rules configured</strong><span>Successful transactions will continue with cost evidence marked unavailable.</span></div>}
        {!!configurations?.items.length && (
          <div className="transactions-table-wrap">
            <table className="table transactions-table">
              <thead><tr><th>Provider / service</th><th>Scope</th><th>Configured cost</th><th>Effective period</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{configurations.items.map((row) => (
                <tr key={row.id}>
                  <td>{row.provider_name}<small>{humanize(row.service_type)} · {row.currency}</small></td>
                  <td>{row.network_identifier || 'Any network'}<small>{row.product_identifier || 'Any product'}</small></td>
                  <td>{row.cost_method === 'fixed_amount' ? `${row.cost_value} ${row.currency}` : `${row.cost_value}% of selling amount`}<small>ADMIN_CONFIGURED</small></td>
                  <td>{formatDate(row.effective_from)}<small>{row.effective_until ? `Until ${formatDate(row.effective_until)}` : 'No end date'}</small></td>
                  <td>{row.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="provider-cost-row-actions">
                    <button className="wallet-button" type="button" onClick={() => void loadHistory(row)}>History</button>
                    {canEdit && row.is_active && <button className="wallet-button" type="button" onClick={() => edit(row)}>New version</button>}
                    {canEdit && row.is_active && <button className="wallet-button" type="button" onClick={() => void deactivate(row)}>Deactivate</button>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {configurations && configurations.total_pages > 1 && (
          <PageControls page={configurations.page} totalPages={configurations.total_pages} onChange={setConfigurationPage} />
        )}
      </section>

      {selectedConfig && (
        <section className="panel provider-cost-panel">
          <div className="finance-section-heading">
            <div><h2 className="section-title">Configuration history and linked transactions</h2><p>{selectedConfig.provider_name} · {humanize(selectedConfig.service_type)} · {selectedConfig.currency}</p></div>
            <button type="button" className="wallet-button" onClick={() => { setSelectedConfig(null); setHistory(null); setConfigTransactions(null); }}>Close</button>
          </div>
          <ConfigHistoryTable history={history} transactions={configTransactions} />
        </section>
      )}

      <section className="panel provider-cost-panel">
        <div className="finance-section-heading">
          <div><h2 className="section-title">Transaction cost evidence</h2><p>Configured cost, verified evidence and unavailable costs remain separately classified.</p></div>
        </div>
        <div className="provider-cost-filters">
          <label><span>Provider</span><select value={providerFilter} onChange={(event) => { setProviderFilter(event.target.value); setConfigurationPage(1); setEvidencePage(1); }}><option value="">All providers</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}{provider.is_active ? '' : ' (inactive)'}</option>)}</select></label>
          <label><span>Service</span><select value={serviceFilter} onChange={(event) => { setServiceFilter(event.target.value); setConfigurationPage(1); setEvidencePage(1); }}><option value="">All services</option>{SERVICE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Currency</span><input value={currencyFilter} onChange={(event) => { setCurrencyFilter(event.target.value.toUpperCase()); setConfigurationPage(1); setEvidencePage(1); }} placeholder="NGN" maxLength={10} /></label>
          <label><span>Evidence class</span><select value={sourceFilter} onChange={(event) => { setSourceFilter(event.target.value); setEvidencePage(1); }}><option value="">All classes</option><option value="VERIFIED_ACTUAL">Verified actual</option><option value="VERIFIED_CONTRACTUAL">Verified contractual</option><option value="ADMIN_CONFIGURED">Admin configured</option><option value="UNAVAILABLE">Unavailable</option></select></label>
        </div>
        <div className="provider-cost-tabs" role="tablist" aria-label="Provider cost evidence views">
          <button type="button" role="tab" aria-selected={tab === 'snapshots'} onClick={() => setTab('snapshots')}>Persisted snapshots ({snapshots?.total ?? 0})</button>
          <button type="button" role="tab" aria-selected={tab === 'awaiting'} onClick={() => setTab('awaiting')}>Awaiting verification ({awaiting?.total ?? 0})</button>
        </div>
        {evidenceLoading && <div className="transactions-detail-loading" aria-live="polite">Loading transaction cost evidence…</div>}
        {!evidenceLoading && tab === 'snapshots' && <SnapshotTable rows={snapshots?.items ?? []} />}
        {!evidenceLoading && tab === 'awaiting' && <AwaitingTable rows={awaiting?.items ?? []} />}
        {!evidenceLoading && (tab === 'snapshots' ? snapshots : awaiting) && (
          <PageControls
            page={(tab === 'snapshots' ? snapshots : awaiting)!.page}
            totalPages={(tab === 'snapshots' ? snapshots : awaiting)!.total_pages}
            onChange={setEvidencePage}
          />
        )}
      </section>
    </div>
  );
}

function ConfigHistoryTable({
  history,
  transactions,
}: {
  history: ProviderCostPage<ProviderCostConfiguration> | null;
  transactions: ProviderCostPage<ProviderCostSnapshot> | null;
}) {
  return (
    <div className="provider-cost-history-grid">
      <div><h3>Version history</h3>{history?.items.map((item) => <p key={item.id}>{formatDate(item.effective_from)} · {item.cost_value} · {item.is_active ? 'Active' : 'Inactive'} · {item.evidence_note}</p>)}</div>
      <div><h3>Transactions linked to this version</h3>{transactions?.items.map((item) => <p key={item.transaction_id}>{item.reference} · {item.source_class} · {item.cost_amount ?? 'Cost unavailable'} {item.currency}</p>)}</div>
    </div>
  );
}

function PageControls({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <footer className="payments-pagination provider-cost-pagination">
      <span>Page {page} of {Math.max(totalPages, 1)}</span>
      <div>
        <button type="button" className="wallet-button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>
          Previous
        </button>
        <button type="button" className="wallet-button" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </footer>
  );
}

function SnapshotTable({ rows }: { rows: ProviderCostSnapshot[] }) {
  if (!rows.length) return <div className="transactions-empty"><strong>No transaction cost snapshots</strong><span>New eligible successful purchases will be recorded after fulfilment.</span></div>;
  return <div className="transactions-table-wrap"><table className="table transactions-table"><thead><tr><th>Reference</th><th>Provider / service</th><th>Selling</th><th>Acquisition cost</th><th>Margin</th><th>Evidence</th></tr></thead><tbody>{rows.map((row) => <tr key={row.transaction_id}><td>{row.reference}<small>{formatDate(row.created_at)}</small></td><td>{row.provider_identifier || 'Unattributed'}<small>{humanize(row.service_type)}</small></td><td>{formatMoney(row.selling_amount, row.currency)}</td><td>{row.cost_amount ? formatMoney(row.cost_amount, row.currency) : 'Unavailable'}</td><td>{row.gross_margin ? formatMoney(row.gross_margin, row.currency) : 'Unavailable'}</td><td>{row.source_class}<small>{row.reason || (row.configuration_id ? `Config ${row.configuration_id}` : '')}</small></td></tr>)}</tbody></table></div>;
}

function AwaitingTable({ rows }: { rows: ProviderCostAwaitingTransaction[] }) {
  if (!rows.length) return <div className="transactions-empty"><strong>No transactions awaiting cost verification</strong><span>Unavailable cost values are never treated as zero.</span></div>;
  return <div className="transactions-table-wrap"><table className="table transactions-table"><thead><tr><th>Reference</th><th>Provider / service</th><th>Selling</th><th>Status</th><th>Cost evidence status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.transaction_id}><td>{row.reference}<small>{formatDate(row.created_at)}</small></td><td>{row.provider_identifier || 'Unattributed'}<small>{humanize(row.service_type)}</small></td><td>{formatMoney(row.selling_amount, row.currency)}</td><td>{humanize(row.status)}</td><td>{row.source_class}<small>{row.reason}</small></td></tr>)}</tbody></table></div>;
}

function getProviderCategory(service: string): string {
  if (service === 'awoof_data') return 'data';
  if (service === 'giftcard_buy') return 'giftcard';
  return service;
}

function humanize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatMoney(value: string, currency: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ${currency}`;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${value} ${currency}`;
  }
}

function toLocalDateTimeInput(value: Date): string {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default ProviderCostsPage;
