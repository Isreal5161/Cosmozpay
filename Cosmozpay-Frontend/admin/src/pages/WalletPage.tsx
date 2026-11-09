import { useEffect, useRef, useState } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  adjustAdminWallet,
  AdminWalletAdjustmentError,
  fetchAdminWalletById,
  fetchAdminWalletLedgerByReference,
  fetchAdminWallets,
  type AdminLedgerEntry,
  type AdminWallet,
} from '../services/adminUsers';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ['active', 'frozen', 'suspended', 'inactive', 'pending'];
const MAX_ADJUSTMENT_CENTS = 99_999_999_999n;

type AdjustmentKind = 'credit' | 'debit';
type AdjustmentPayload = {
  user_id: string;
  wallet_id: string;
  amount: string;
  currency: string;
  reason: string;
  reference: string;
};
type StoredUncertainAdjustment = {
  action: { wallet: AdminWallet; kind: AdjustmentKind };
  payload: AdjustmentPayload;
};

const UNCERTAIN_ADJUSTMENT_STORAGE_KEY = 'cosmozpay.admin.wallet.uncertain-adjustment';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isAdminWallet(value: unknown): value is AdminWallet {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.user_id === 'string' &&
    isOptionalString(value.user_name) &&
    isOptionalString(value.user_email) &&
    isOptionalString(value.user_phone) &&
    isOptionalString(value.wallet_reference) &&
    typeof value.wallet_type === 'string' &&
    typeof value.currency === 'string' &&
    typeof value.status === 'string' &&
    typeof value.available_balance === 'string' &&
    typeof value.ledger_balance === 'string' &&
    typeof value.locked_balance === 'string' &&
    typeof value.is_active === 'boolean' &&
    typeof value.is_frozen === 'boolean' &&
    typeof value.is_suspended === 'boolean' &&
    isOptionalString(value.created_at) &&
    isOptionalString(value.updated_at)
  );
}

function loadStoredAdjustment(): { value: StoredUncertainAdjustment | null; error: string | null } {
  try {
    const raw = globalThis.sessionStorage.getItem(UNCERTAIN_ADJUSTMENT_STORAGE_KEY);
    if (!raw) return { value: null, error: null };
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.action) || !isRecord(parsed.payload)) {
      return { value: null, error: 'Saved adjustment recovery data is invalid. Do not start another wallet adjustment; contact support.' };
    }

    const { action, payload } = parsed;
    const wallet = action.wallet;
    const kind = action.kind;
    if (
      !isAdminWallet(wallet) ||
      (kind !== 'credit' && kind !== 'debit') ||
      typeof payload.user_id !== 'string' ||
      typeof payload.wallet_id !== 'string' ||
      typeof payload.amount !== 'string' ||
      typeof payload.currency !== 'string' ||
      typeof payload.reason !== 'string' ||
      typeof payload.reference !== 'string' ||
      payload.wallet_id !== wallet.id ||
      payload.user_id !== wallet.user_id ||
      !/^-?\d+\.\d{2}$/.test(payload.amount) ||
      !payload.reference.trim() ||
      payload.reference.length > 100 ||
      !payload.reason.trim() ||
      payload.reason.length > 500 ||
      (kind === 'debit') !== payload.amount.startsWith('-')
    ) {
      return { value: null, error: 'Saved adjustment recovery data is incomplete. Do not start another wallet adjustment; contact support.' };
    }

    return {
      value: {
        action: { wallet, kind },
        payload: {
          user_id: payload.user_id,
          wallet_id: payload.wallet_id,
          amount: payload.amount,
          currency: payload.currency,
          reason: payload.reason,
          reference: payload.reference,
        },
      },
      error: null,
    };
  } catch {
    return { value: null, error: 'Unable to read saved wallet adjustment recovery data. Do not start another adjustment until this is resolved.' };
  }
}

function clearStoredAdjustment(): boolean {
  try {
    globalThis.sessionStorage.removeItem(UNCERTAIN_ADJUSTMENT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

function formatStatus(value: string): string {
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseCents(value: string): bigint | null {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const whole = BigInt(match[2]);
  const fraction = BigInt((match[3] ?? '').padEnd(2, '0') || '0');
  const cents = whole * 100n + fraction;
  return match[1] === '-' ? -cents : cents;
}

function decimalFromCents(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / 100n;
  const fraction = String(absolute % 100n).padStart(2, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

function formatCurrency(value: string, currency: string): string {
  const cents = parseCents(value);
  if (cents === null || cents > BigInt(Number.MAX_SAFE_INTEGER) || cents < -BigInt(Number.MAX_SAFE_INTEGER)) {
    return `${value} ${currency}`;
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(cents) / 100);
  } catch {
    return `${decimalFromCents(cents)} ${currency}`;
  }
}

function formatDate(value: string | null): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
}

function adjustmentReference(kind: AdjustmentKind): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `ADMIN-WALLET-${kind.toUpperCase()}-${globalThis.crypto.randomUUID()}`;
  }
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    const id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `ADMIN-WALLET-${kind.toUpperCase()}-${id}`;
  }
  throw new Error('Secure adjustment reference generation is unavailable.');
}

function WalletPage() {
  const { admin } = useAdminAuth();
  const [storedAdjustment] = useState(loadStoredAdjustment);
  const [wallets, setWallets] = useState<AdminWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalWallets, setTotalWallets] = useState(0);
  const [currencyOptions, setCurrencyOptions] = useState<string[]>([]);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [pendingAction, setPendingAction] = useState<{ wallet: AdminWallet; kind: AdjustmentKind } | null>(
    storedAdjustment.value?.action ?? null,
  );
  const [amount, setAmount] = useState(
    storedAdjustment.value?.payload.amount.replace(/^-/, '') ?? '',
  );
  const [reason, setReason] = useState(storedAdjustment.value?.payload.reason ?? '');
  const [reference, setReference] = useState(storedAdjustment.value?.payload.reference ?? '');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [uncertainPayload, setUncertainPayload] = useState<AdjustmentPayload | null>(
    storedAdjustment.value?.payload ?? null,
  );
  const [recoveryError, setRecoveryError] = useState<string | null>(storedAdjustment.error);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reconciliationMessage, setReconciliationMessage] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<AdminLedgerEntry[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const enteredCents = parseCents(amount);
  const currentBalanceCents = pendingAction ? parseCents(pendingAction.wallet.available_balance) : null;
  const expectedBalance = pendingAction && enteredCents !== null && enteredCents > 0n && currentBalanceCents !== null
    ? decimalFromCents(currentBalanceCents + (pendingAction.kind === 'credit' ? enteredCents : -enteredCents))
    : null;
  const debitExceedsBalance = pendingAction?.kind === 'debit' &&
    enteredCents !== null &&
    enteredCents > 0n &&
    currentBalanceCents !== null &&
    enteredCents > currentBalanceCents;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchAdminWallets({
          page,
          page_size: PAGE_SIZE,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          currency: currencyFilter || undefined,
        });
        if (!active) return;
        setWallets(response.items);
        setTotalPages(Math.max(response.total_pages, 1));
        setTotal(response.total);
        setTotalWallets(response.total_wallets);
        setCurrencyOptions(response.currencies);
      } catch (loadError) {
        if (!active) return;
        setWallets([]);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load wallet directory.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [page, search, statusFilter, currencyFilter, reloadVersion]);

  const openAdjustment = (wallet: AdminWallet, kind: AdjustmentKind) => {
    if (uncertainPayload || recoveryError) return;
    let newReference: string;
    try {
      newReference = adjustmentReference(kind);
    } catch (referenceError) {
      setToast(referenceError instanceof Error ? referenceError.message : 'Unable to create a secure adjustment reference.');
      return;
    }
    setPendingAction({ wallet, kind });
    setAmount('');
    setReason('');
    setReference(newReference);
    setActionError(null);
    setReconciliationMessage(null);
    setLedgerEntries(null);
  };

  const completeAdjustment = async (payload: AdjustmentPayload, retrying: boolean) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setActionError(null);
    setReconciliationMessage(null);
    try {
      await adjustAdminWallet(payload);
      const recoveryDataCleared = clearStoredAdjustment();
      setToast(
        `${payload.amount.startsWith('-') ? 'Manual debit' : 'Manual credit'} recorded. Wallet data is refreshing.` +
        (recoveryDataCleared ? '' : ' Browser recovery data could not be cleared; reconcile it if prompted again.'),
      );
      setPendingAction(null);
      setUncertainPayload(null);
      setLedgerEntries(null);
      setReloadVersion((version) => version + 1);
      setPage(1);
    } catch (submitError) {
      const unknown = submitError instanceof AdminWalletAdjustmentError
        ? submitError.outcomeUnknown
        : true;
      if (unknown || retrying) {
        setUncertainPayload(payload);
        setActionError(
          retrying
            ? 'The retry did not confirm the outcome. The original adjustment is still unresolved; check its ledger reference before taking further action.'
            : 'The server did not confirm the outcome. Do not start a different adjustment until you reconcile this reference.',
        );
      } else {
        const recoveryDataCleared = clearStoredAdjustment();
        setActionError(
          (submitError instanceof Error ? submitError.message : 'Unable to complete the wallet adjustment.') +
          (recoveryDataCleared ? '' : ' The browser could not clear its saved recovery record; keep it for reconciliation.'),
        );
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const submitAdjustment = async () => {
    if (!pendingAction || submittingRef.current || uncertainPayload) return;
    if (recoveryError) {
      setActionError(recoveryError);
      return;
    }
    if (enteredCents === null || enteredCents <= 0n || enteredCents > MAX_ADJUSTMENT_CENTS) {
      setActionError('Enter an amount from 0.01 to 999,999,999.99 with no more than two decimal places.');
      return;
    }
    if (currentBalanceCents === null) {
      setActionError('The available balance is not a valid decimal amount. Refresh the wallet before continuing.');
      return;
    }
    if (pendingAction.kind === 'debit' && enteredCents > currentBalanceCents) {
      setActionError('The debit amount exceeds the wallet’s available balance.');
      return;
    }
    const safeReason = reason.trim();
    const safeReference = reference.trim();
    if (!safeReason || safeReason.length > 500) {
      setActionError('Provide an adjustment reason of 1 to 500 characters.');
      return;
    }
    if (!safeReference || safeReference.length > 100) {
      setActionError('Provide an idempotency reference of 1 to 100 characters.');
      return;
    }

    const payload: AdjustmentPayload = {
      user_id: pendingAction.wallet.user_id,
      wallet_id: pendingAction.wallet.id,
      amount: decimalFromCents(pendingAction.kind === 'credit' ? enteredCents : -enteredCents),
      currency: pendingAction.wallet.currency,
      reason: safeReason,
      reference: safeReference,
    };
    try {
      globalThis.sessionStorage.setItem(
        UNCERTAIN_ADJUSTMENT_STORAGE_KEY,
        JSON.stringify({ action: pendingAction, payload } satisfies StoredUncertainAdjustment),
      );
    } catch {
      setActionError('The browser could not save recovery data, so the financial request was not sent. Resolve browser storage access and retry.');
      return;
    }
    await completeAdjustment(payload, false);
  };

  const retryUncertainAdjustment = async () => {
    if (!uncertainPayload) return;
    await completeAdjustment(uncertainPayload, true);
  };

  const reconcileUncertainAdjustment = async () => {
    if (!pendingAction || !uncertainPayload || reconciling) return;
    setReconciling(true);
    setActionError(null);
    setReconciliationMessage(null);
    try {
      const [freshWallet, ledgerLookup] = await Promise.all([
        fetchAdminWalletById(uncertainPayload.wallet_id),
        fetchAdminWalletLedgerByReference(
          uncertainPayload.user_id,
          uncertainPayload.wallet_id,
          uncertainPayload.reference,
        ),
      ]);
      const walletMatchesRequest =
        freshWallet.id === uncertainPayload.wallet_id &&
        freshWallet.user_id === uncertainPayload.user_id &&
        freshWallet.currency === uncertainPayload.currency &&
        pendingAction.wallet.id === uncertainPayload.wallet_id &&
        pendingAction.wallet.user_id === uncertainPayload.user_id;
      setWallets((current) => current.map((wallet) => wallet.id === freshWallet.id ? freshWallet : wallet));
      setPendingAction((current) => current
        ? { ...current, wallet: walletMatchesRequest ? freshWallet : current.wallet }
        : current);
      setLedgerEntries(ledgerLookup.items);
      const expectedType = uncertainPayload.amount.startsWith('-') ? 'ADMIN_DEBIT' : 'ADMIN_CREDIT';
      const expectedCents = parseCents(uncertainPayload.amount);
      const expectedActor = admin?.id ? `admin:${admin.id}` : '';
      const entry = ledgerLookup.total === 1 && ledgerLookup.items.length === 1
        ? ledgerLookup.items[0]
        : null;
      const entryAmount = entry
        ? parseCents(expectedType === 'ADMIN_DEBIT' ? entry.debit_amount : entry.credit_amount)
        : null;
      const otherAmount = entry
        ? parseCents(expectedType === 'ADMIN_DEBIT' ? entry.credit_amount : entry.debit_amount)
        : null;
      const ledgerMatchesRequest = Boolean(
        entry &&
        walletMatchesRequest &&
        expectedActor &&
        expectedCents !== null &&
        entry.wallet_id === uncertainPayload.wallet_id &&
        entry.user_id === uncertainPayload.user_id &&
        entry.transaction_reference === uncertainPayload.reference &&
        entry.status.toUpperCase() === 'POSTED' &&
        entry.transaction_type.toUpperCase() === expectedType &&
        entry.currency === uncertainPayload.currency &&
        entryAmount === (expectedCents < 0n ? -expectedCents : expectedCents) &&
        otherAmount === 0n &&
        entry.adjustment_reason === uncertainPayload.reason &&
        entry.created_by === expectedActor,
      );
      if (ledgerMatchesRequest) {
        const recoveryDataCleared = clearStoredAdjustment();
        setToast(
          `A matching ledger record was found for ${uncertainPayload.reference}. Wallet data is refreshed; do not retry this reference.` +
          (recoveryDataCleared ? '' : ' The browser could not clear its saved recovery record.'),
        );
        setPendingAction(null);
        setUncertainPayload(null);
      } else if (ledgerLookup.total > 0 || !walletMatchesRequest) {
        setReconciliationMessage(
          ledgerLookup.total > 1
            ? `Found ${ledgerLookup.total} ledger records with this reference. Keep this operation locked and contact an administrator for review.`
            : 'The wallet or ledger record does not conclusively match this adjustment. Keep this operation locked and contact an administrator for review.',
        );
      } else {
        setReconciliationMessage(
          'No ledger record was found for this reference. The outcome remains uncertain; recheck or retry only the exact same request.',
        );
      }
    } catch (reconcileError) {
      setActionError(
        reconcileError instanceof Error
          ? `Unable to reconcile this adjustment: ${reconcileError.message}`
          : 'Unable to reconcile this adjustment. Its outcome remains uncertain.',
      );
    } finally {
      setReconciling(false);
    }
  };

  const closeAdjustment = () => {
    if (uncertainPayload || submitting || reconciling || recoveryError) return;
    setPendingAction(null);
    setActionError(null);
    setReconciliationMessage(null);
    setLedgerEntries(null);
  };

  return (
    <div>
      <h1 className="page-heading">Wallet Management</h1>
      <section className="panel" aria-busy={loading}>
        <div className="wallet-toolbar">
          <h2 className="section-title" style={{ margin: 0 }}>Wallet directory</h2>
          <div className="wallet-toolbar-controls">
            <input
              className="wallet-control wallet-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search wallet or user identifiers"
              aria-label="Search wallet and user IDs, wallet references, and user name, email, or phone"
            />
            <select
              className="wallet-control"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Filter wallets by status"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{formatStatus(status)}</option>
              ))}
            </select>
            <select
              className="wallet-control"
              value={currencyFilter}
              onChange={(event) => {
                setCurrencyFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Filter wallets by currency"
            >
              <option value="">All currencies</option>
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
        </div>

        {recoveryError && <div role="alert" className="wallet-error">{recoveryError}</div>}

        {loading ? (
          <p aria-live="polite">Loading wallet directory…</p>
        ) : error ? (
          <div role="alert" className="wallet-error">
            <p>{error}</p>
            <button
              type="button"
              className="wallet-button"
              onClick={() => setReloadVersion((version) => version + 1)}
            >
              Retry loading wallets
            </button>
          </div>
        ) : totalWallets === 0 ? (
          <p className="wallet-subtle">No user wallets available at this moment.</p>
        ) : wallets.length === 0 ? (
          <p className="wallet-subtle">No wallets match the current search or filters.</p>
        ) : (
          <>
            <div className="wallet-table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Wallet</th>
                    <th>User</th>
                    <th>Currency</th>
                    <th>Status</th>
                    <th>Available</th>
                    <th>Ledger</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet) => (
                    <tr key={wallet.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{wallet.wallet_reference || wallet.id.slice(0, 8)}</div>
                        <small className="wallet-subtle">{wallet.wallet_type}</small>
                      </td>
                      <td>
                        <div>{wallet.user_name || 'Name unavailable'}</div>
                        <small className="wallet-subtle">{wallet.user_email || wallet.user_phone || wallet.user_id}</small>
                      </td>
                      <td>{wallet.currency}</td>
                      <td>{formatStatus(wallet.status)}</td>
                      <td>{formatCurrency(wallet.available_balance, wallet.currency)}</td>
                      <td>{formatCurrency(wallet.ledger_balance, wallet.currency)}</td>
                      <td>{formatDate(wallet.updated_at)}</td>
                      <td>
                        <div className="wallet-actions">
                          <button
                            type="button"
                            className="wallet-button wallet-button-credit"
                            onClick={() => openAdjustment(wallet, 'credit')}
                            disabled={Boolean(uncertainPayload) || Boolean(recoveryError)}
                          >
                            Credit
                          </button>
                          <button
                            type="button"
                            className="wallet-button wallet-button-debit"
                            onClick={() => openAdjustment(wallet, 'debit')}
                            disabled={Boolean(uncertainPayload) || Boolean(recoveryError)}
                          >
                            Debit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="wallet-pagination">
                <span className="wallet-subtle">
                  Page {page} of {totalPages} • {total} wallet{total === 1 ? '' : 's'}
                </span>
                <div className="wallet-actions">
                  <button
                    type="button"
                    className="wallet-button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="wallet-button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <Modal
        open={!!pendingAction}
        title={pendingAction?.kind === 'credit' ? 'Confirm manual credit' : 'Confirm manual debit'}
        onClose={closeAdjustment}
        closeDisabled={Boolean(uncertainPayload) || submitting || reconciling || Boolean(recoveryError)}
      >
        {pendingAction && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="panel-card">
              <dl className="wallet-modal-summary">
                <div><dt>Selected user</dt><dd>{pendingAction.wallet.user_name || 'Name unavailable'}</dd></div>
                <div><dt>User identifier</dt><dd>{pendingAction.wallet.user_email || pendingAction.wallet.user_phone || pendingAction.wallet.user_id}</dd></div>
                <div><dt>Wallet ID / reference</dt><dd>{pendingAction.wallet.wallet_reference || pendingAction.wallet.id}</dd></div>
                <div><dt>Wallet ID</dt><dd>{pendingAction.wallet.id}</dd></div>
                <div><dt>Adjustment type</dt><dd>{pendingAction.kind === 'credit' ? 'Manual Credit' : 'Manual Debit'}</dd></div>
                <div><dt>Currency</dt><dd>{pendingAction.wallet.currency}</dd></div>
                <div><dt>Current available balance</dt><dd>{formatCurrency(pendingAction.wallet.available_balance, pendingAction.wallet.currency)}</dd></div>
                <div><dt>Adjustment amount</dt><dd>{enteredCents !== null && enteredCents > 0n ? formatCurrency(decimalFromCents(enteredCents), pendingAction.wallet.currency) : 'Enter a valid amount'}</dd></div>
                <div><dt>Expected available balance</dt><dd>{expectedBalance ? formatCurrency(expectedBalance, pendingAction.wallet.currency) : 'Not available until the amount is valid'}</dd></div>
                <div><dt>Reason</dt><dd>{reason.trim() || 'Not provided yet'}</dd></div>
              </dl>
            </div>

            {actionError && <div role="alert" className="wallet-error">{actionError}</div>}
            {uncertainPayload && (
              <div className="wallet-warning" role="status">
                <strong>Adjustment outcome uncertain.</strong> The inputs and reference are locked. Resolve this operation using its ledger history or retry only the unchanged request.
                <div className="wallet-actions" style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="wallet-button"
                    onClick={() => void reconcileUncertainAdjustment()}
                    disabled={reconciling || submitting}
                  >
                    {reconciling ? 'Checking wallet and ledger…' : 'Refresh wallet and check ledger'}
                  </button>
                  <button
                    type="button"
                    className="wallet-button wallet-button-primary"
                    onClick={() => void retryUncertainAdjustment()}
                    disabled={submitting || reconciling}
                  >
                    {submitting ? 'Retrying…' : 'Retry exact same request'}
                  </button>
                </div>
              </div>
            )}
            {reconciliationMessage && <div className="wallet-warning" role="status">{reconciliationMessage}</div>}

            <div style={{ display: 'grid', gap: 12 }}>
              <label className="wallet-field">
                <span>Amount ({pendingAction.wallet.currency})</span>
                <input
                  className="wallet-input"
                  type="number"
                  min="0.01"
                  max="999999999.99"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="1000.00"
                  disabled={Boolean(uncertainPayload) || submitting}
                />
              </label>

              {debitExceedsBalance && (
                <div role="alert" className="wallet-error">The debit amount exceeds this wallet’s available balance.</div>
              )}

              <label className="wallet-field">
                <span>Reason</span>
                <textarea
                  className="wallet-textarea"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Describe why this wallet adjustment is being made"
                  rows={3}
                  disabled={Boolean(uncertainPayload) || submitting}
                />
              </label>

              <label className="wallet-field">
                <span>Idempotency reference</span>
                <input
                  className="wallet-input"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  maxLength={100}
                  disabled={Boolean(uncertainPayload) || submitting}
                />
              </label>
            </div>

            {uncertainPayload && ledgerEntries && ledgerEntries.length > 0 && (
              <section aria-label="Recent wallet ledger entries">
                <h4>Recent wallet ledger entries</h4>
                <div className="wallet-ledger-list">
                  {ledgerEntries.map((entry) => (
                    <div className="wallet-ledger-row" key={entry.id}>
                      <div><strong>{entry.transaction_type}</strong> · {entry.entry_type} · {formatCurrency(entry.credit_amount !== '0.00' ? entry.credit_amount : `-${entry.debit_amount}`, entry.currency)}</div>
                      <div className="wallet-subtle">Reference: {entry.transaction_reference} · {formatDate(entry.created_at)}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="wallet-actions" style={{ justifyContent: 'flex-end' }}>
              {!uncertainPayload && (
                <button type="button" className="wallet-button" onClick={closeAdjustment} disabled={submitting}>
                  Cancel
                </button>
              )}
              {!uncertainPayload && (
                <button
                  type="button"
                  className="wallet-button wallet-button-primary"
                  onClick={() => void submitAdjustment()}
                  disabled={submitting || enteredCents === null || enteredCents <= 0n || Boolean(debitExceedsBalance)}
                >
                  {submitting ? 'Processing…' : pendingAction.kind === 'credit' ? 'Confirm manual credit' : 'Confirm manual debit'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default WalletPage;
