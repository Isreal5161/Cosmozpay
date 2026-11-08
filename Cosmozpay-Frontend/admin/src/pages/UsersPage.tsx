import { useEffect, useRef, useState } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import {
  fetchAdminUserActivity,
  fetchAdminUser,
  fetchAdminUserKyc,
  fetchAdminUserSessionHistory,
  fetchAdminUserSessions,
  fetchAdminUserTransaction,
  fetchAdminUserTransactions,
  fetchAdminWallet,
  fetchAdminWalletLedger,
  fetchAdminUsers,
  manageAdminUser,
  reviewAdminUserKyc,
  revokeAdminUserSession,
  revokeAdminUserSessions,
  type AdminActivityEvent,
  type AdminKycRecord,
  type AdminLedgerEntry,
  type AdminPage,
  type AdminSession,
  type AdminSessionEvent,
  type AdminTransaction,
  type AdminWallet,
  type AdminUser,
  type AdminUserList,
  type AdminUserSortField,
  type AdminUserStatusAction,
} from '../services/adminUsers';

const PAGE_SIZE = 20;
const STATUSES = ['pending', 'active', 'inactive', 'suspended', 'blocked'];
const PROFILE_TABS = ['Overview', 'Wallet', 'KYC', 'Transactions', 'Activity', 'Security / sessions'] as const;
type ProfileTab = typeof PROFILE_TABS[number];
const PROFILE_PAGE_SIZE = 20;

interface PendingAction {
  user: AdminUser;
  action: AdminUserStatusAction;
}

function displayName(user: AdminUser): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || user.email;
}

function displayStatus(user: AdminUser): string {
  if (user.is_blocked || user.status === 'blocked') return 'Blocked';
  if (user.is_suspended || user.status === 'suspended') return 'Suspended';
  if (user.status === 'inactive' || (!user.is_active && user.status !== 'pending')) return 'Inactive';
  return statusLabel(user.status);
}

function formatDate(value: string | null): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
}

function formatAmount(value: string, currency: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ${currency}`;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${value} ${currency}`;
  }
}

function actionsFor(user: AdminUser): AdminUserStatusAction[] {
  if (user.is_blocked || user.status === 'blocked') return ['unblock'];
  if (user.is_suspended || user.status === 'suspended') return ['activate', 'block'];
  if (user.status === 'pending') return ['activate', 'suspend', 'block'];
  if (!user.is_active) return ['activate', 'suspend', 'block'];
  return ['suspend', 'block'];
}

function actionLabel(action: AdminUserStatusAction | 'approved' | 'rejected'): string {
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function statusLabel(status: string): string {
  return status.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function actionPastTense(action: AdminUserStatusAction): string {
  return { suspend: 'suspended', activate: 'activated', block: 'blocked', unblock: 'unblocked' }[action];
}

function UsersPage() {
  const [userList, setUserList] = useState<AdminUserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<AdminUserSortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [tab, setTab] = useState<ProfileTab>('Overview');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const listRequest = useRef(0);
  const [wallet, setWallet] = useState<AdminWallet | null>(null);
  const [profileRefresh, setProfileRefresh] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [ledger, setLedger] = useState<AdminPage<AdminLedgerEntry> | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('');
  const [transactionCategory, setTransactionCategory] = useState('');
  const [transactionCurrency, setTransactionCurrency] = useState('');
  const [transactionStartDate, setTransactionStartDate] = useState('');
  const [transactionEndDate, setTransactionEndDate] = useState('');
  const [transactions, setTransactions] = useState<AdminPage<AdminTransaction> | null>(null);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [transactionDetail, setTransactionDetail] = useState<AdminTransaction | null>(null);
  const [transactionDetailLoading, setTransactionDetailLoading] = useState(false);
  const [transactionDetailError, setTransactionDetailError] = useState<string | null>(null);
  const [kycRecords, setKycRecords] = useState<AdminPage<AdminKycRecord> | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  const [kycRevision, setKycRevision] = useState(0);
  const [kycPage, setKycPage] = useState(1);
  const [pendingKycReview, setPendingKycReview] = useState<{ record: AdminKycRecord; action: 'approved' | 'rejected' } | null>(null);
  const [kycReviewNotes, setKycReviewNotes] = useState('');
  const [kycReviewLoading, setKycReviewLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activity, setActivity] = useState<AdminPage<AdminActivityEvent> | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AdminSession[] | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionHistoryPage, setSessionHistoryPage] = useState(1);
  const [sessionHistory, setSessionHistory] = useState<AdminPage<AdminSessionEvent> | null>(null);
  const [sessionHistoryLoading, setSessionHistoryLoading] = useState(false);
  const [sessionHistoryError, setSessionHistoryError] = useState<string | null>(null);
  const [sessionRevision, setSessionRevision] = useState(0);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    const requestId = ++listRequest.current;
    setLoading(true);
    setError(null);
    fetchAdminUsers({
      page,
      page_size: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: status || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    })
      .then((result) => {
        if (active && requestId === listRequest.current) setUserList(result);
      })
      .catch((cause: unknown) => {
        if (active && requestId === listRequest.current) {
          setError(cause instanceof Error ? cause.message : 'Unable to load users. Please try again.');
        }
      })
      .finally(() => {
        if (active && requestId === listRequest.current) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, debouncedSearch, status, sortBy, sortOrder, refreshVersion]);

  useEffect(() => {
    if (!detailUserId) return;
    let active = true;
    setSelectedUser(null);
    setDetailLoading(true);
    setDetailError(null);
    fetchAdminUser(detailUserId)
      .then((user) => {
        if (active) setSelectedUser(user);
      })
      .catch((cause: unknown) => {
        if (active) setDetailError(cause instanceof Error ? cause.message : 'Unable to load this user profile.');
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [detailUserId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTransactionSearchQuery(transactionSearch.trim());
      setTransactionPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [transactionSearch]);

  useEffect(() => {
    if (!detailUserId || tab !== 'Wallet') return;
    let active = true;
    setWalletLoading(true);
    setWalletError(null);
    setWallet(null);
    fetchAdminWallet(detailUserId)
      .then((result) => {
        if (active) setWallet(result);
      })
      .catch((cause: unknown) => {
        if (active) setWalletError(cause instanceof Error ? cause.message : 'Unable to load wallet information.');
      })
      .finally(() => {
        if (active) setWalletLoading(false);
      });
    return () => { active = false; };
  }, [detailUserId, tab, profileRefresh]);

  useEffect(() => {
    if (!detailUserId || tab !== 'Wallet' || !wallet) return;
    let active = true;
    setLedgerLoading(true);
    setLedgerError(null);
    fetchAdminWalletLedger(detailUserId, wallet.id, ledgerPage, PROFILE_PAGE_SIZE)
      .then((result) => { if (active) setLedger(result); })
      .catch((cause: unknown) => {
        if (active) setLedgerError(cause instanceof Error ? cause.message : 'Unable to load wallet ledger.');
      })
      .finally(() => { if (active) setLedgerLoading(false); });
    return () => { active = false; };
  }, [detailUserId, tab, wallet, ledgerPage, profileRefresh]);

  useEffect(() => {
    if (!detailUserId || tab !== 'Transactions') return;
    let active = true;
    setTransactionsLoading(true);
    setTransactionsError(null);
    fetchAdminUserTransactions(detailUserId, {
      page: transactionPage,
      page_size: PROFILE_PAGE_SIZE,
      status: transactionStatus || undefined,
      category: transactionCategory || undefined,
      currency: transactionCurrency || undefined,
      search: transactionSearchQuery || undefined,
      start_date: transactionStartDate ? `${transactionStartDate}T00:00:00` : undefined,
      end_date: transactionEndDate ? `${transactionEndDate}T23:59:59` : undefined,
    })
      .then((result) => { if (active) setTransactions(result); })
      .catch((cause: unknown) => {
        if (active) setTransactionsError(cause instanceof Error ? cause.message : 'Unable to load transactions.');
      })
      .finally(() => { if (active) setTransactionsLoading(false); });
    return () => { active = false; };
  }, [
    detailUserId,
    tab,
    transactionPage,
    transactionStatus,
    transactionCategory,
    transactionCurrency,
    transactionSearchQuery,
    transactionStartDate,
    transactionEndDate,
    profileRefresh,
  ]);

  useEffect(() => {
    if (!detailUserId || tab !== 'KYC') return;
    let active = true;
    setKycLoading(true);
    setKycError(null);
    setKycRecords(null);
    fetchAdminUserKyc(detailUserId, kycPage, PROFILE_PAGE_SIZE)
      .then((result) => {
        if (!active) return;
        const lastPage = Math.max(result.total_pages, 1);
        if (kycPage > lastPage) {
          setKycPage(lastPage);
          return;
        }
        setKycRecords(result);
      })
      .catch((cause: unknown) => {
        if (active) setKycError(cause instanceof Error ? cause.message : 'Unable to load KYC records.');
      })
      .finally(() => { if (active) setKycLoading(false); });
    return () => { active = false; };
  }, [detailUserId, tab, kycPage, kycRevision, profileRefresh]);

  useEffect(() => {
    if (!detailUserId || tab !== 'Activity') return;
    let active = true;
    setActivityLoading(true);
    setActivityError(null);
    fetchAdminUserActivity(detailUserId, activityPage, PROFILE_PAGE_SIZE)
      .then((result) => { if (active) setActivity(result); })
      .catch((cause: unknown) => {
        if (active) setActivityError(cause instanceof Error ? cause.message : 'Unable to load admin activity.');
      })
      .finally(() => { if (active) setActivityLoading(false); });
    return () => { active = false; };
  }, [detailUserId, tab, activityPage, profileRefresh]);

  useEffect(() => {
    if (!detailUserId || tab !== 'Security / sessions') return;
    let active = true;
    setSessionsLoading(true);
    setSessionsError(null);
    fetchAdminUserSessions(detailUserId)
      .then((result) => { if (active) setSessions(result); })
      .catch((cause: unknown) => {
        if (active) setSessionsError(cause instanceof Error ? cause.message : 'Unable to load active sessions.');
      })
      .finally(() => { if (active) setSessionsLoading(false); });
    return () => { active = false; };
  }, [detailUserId, tab, sessionRevision, profileRefresh]);

  useEffect(() => {
    if (!detailUserId || tab !== 'Security / sessions') return;
    let active = true;
    setSessionHistoryLoading(true);
    setSessionHistoryError(null);
    fetchAdminUserSessionHistory(detailUserId, sessionHistoryPage, PROFILE_PAGE_SIZE)
      .then((result) => { if (active) setSessionHistory(result); })
      .catch((cause: unknown) => {
        if (active) setSessionHistoryError(cause instanceof Error ? cause.message : 'Unable to load session history.');
      })
      .finally(() => { if (active) setSessionHistoryLoading(false); });
    return () => { active = false; };
  }, [detailUserId, tab, sessionHistoryPage, sessionRevision, profileRefresh]);

  const openUser = (userId: string) => {
    setTab('Overview');
    setLedgerPage(1);
    setTransactionPage(1);
    setTransactionSearch('');
    setTransactionSearchQuery('');
    setTransactionStatus('');
    setTransactionCategory('');
    setTransactionCurrency('');
    setTransactionStartDate('');
    setTransactionEndDate('');
    setActivityPage(1);
    setKycPage(1);
    setSessionHistoryPage(1);
    setDetailUserId(userId);
  };

  const closeUser = () => {
    setDetailUserId(null);
    setSelectedUser(null);
    setDetailError(null);
    setWallet(null);
    setLedger(null);
    setTransactions(null);
    setKycRecords(null);
    setActivity(null);
    setSessions(null);
    setSessionHistory(null);
  };

  const startAction = (user: AdminUser, action: AdminUserStatusAction) => {
    setActionReason('');
    setPendingAction({ user, action });
  };

  const confirmAction = async () => {
    if (!pendingAction || actionLoading) return;
    if (!actionReason.trim()) {
      setToast('Enter a reason for this account change.');
      return;
    }

    setActionLoading(true);
    try {
      const updatedUser = await manageAdminUser(pendingAction.user.id, pendingAction.action, actionReason);
      setSelectedUser((current) => current?.id === updatedUser.id ? updatedUser : current);
      setToast(`User ${actionPastTense(pendingAction.action)} successfully.`);
      setPendingAction(null);
      setRefreshVersion((version) => version + 1);
    } catch (cause: unknown) {
      setToast(cause instanceof Error ? cause.message : 'Unable to update this user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmKycReview = async () => {
    if (!pendingKycReview || kycReviewLoading) return;
    if (pendingKycReview.action === 'rejected' && !kycReviewNotes.trim()) {
      setToast('A rejection reason is required.');
      return;
    }
    setKycReviewLoading(true);
    try {
      const updated = await reviewAdminUserKyc(
        detailUserId!,
        pendingKycReview.record.id,
        pendingKycReview.action,
        kycReviewNotes,
      );
      setKycRecords((current) => current ? {
        ...current,
        items: current.items.map((record) => record.id === updated.id ? updated : record),
      } : current);
      setPendingKycReview(null);
      setKycReviewNotes('');
      setKycRevision((version) => version + 1);
      setToast(`KYC ${pendingKycReview.action} successfully.`);
    } catch (cause: unknown) {
      setToast(cause instanceof Error ? cause.message : 'Unable to submit the KYC review.');
    } finally {
      setKycReviewLoading(false);
    }
  };

  const confirmSessionRevocation = async () => {
    if (!detailUserId || revokeLoading) return;
    if (!revokeReason.trim()) {
      setToast('Enter a reason for revoking the sessions.');
      return;
    }
    setRevokeLoading(true);
    try {
      const revokedCount = await revokeAdminUserSessions(detailUserId, revokeReason);
      setRevokeDialogOpen(false);
      setRevokeReason('');
      setSessionRevision((version) => version + 1);
      setToast(`${revokedCount} active session${revokedCount === 1 ? '' : 's'} revoked.`);
    } catch (cause: unknown) {
      setToast(cause instanceof Error ? cause.message : 'Unable to revoke user sessions.');
    } finally {
      setRevokeLoading(false);
    }
  };

  const revokeSession = async (session: AdminSession) => {
    if (!detailUserId || !window.confirm(`Revoke session ${session.session_id}?`)) return;
    setRevokingSessionId(session.session_id);
    try {
      await revokeAdminUserSession(detailUserId, session.session_id, 'admin_revoke');
      setToast('Session revoked successfully.');
      setSessionRevision((revision) => revision + 1);
    } catch (cause) {
      setToast(cause instanceof Error ? cause.message : 'Unable to revoke this session.');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const openTransaction = async (transactionId: string) => {
    if (!detailUserId) return;
    setTransactionDetail(null);
    setTransactionDetailError(null);
    setTransactionDetailLoading(true);
    try {
      const result = await fetchAdminUserTransaction(detailUserId, transactionId);
      setTransactionDetail(result);
    } catch (cause: unknown) {
      setTransactionDetailError(cause instanceof Error ? cause.message : 'Unable to load transaction details.');
    } finally {
      setTransactionDetailLoading(false);
    }
  };

  const toggleSort = (field: AdminUserSortField) => {
    if (sortBy === field) {
      setSortOrder((order) => order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'created_at' || field === 'updated_at' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const sortIndicator = (field: AdminUserSortField) =>
    sortBy === field ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div>
      <h1 className="page-heading">User Management</h1>
      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            All Users ({userList?.total ?? (loading ? '…' : 0)})
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              aria-label="Search users"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, username or phone"
              style={{ padding: '8px 12px', border: '1px solid #dbe2ef', borderRadius: 8, minWidth: 240 }}
            />
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => { setStatus(event.target.value); setPage(1); }}
              style={{ padding: '8px 12px', border: '1px solid #dbe2ef', borderRadius: 8 }}
            >
              <option value="">All statuses</option>
              {STATUSES.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div role="alert" style={{ padding: 12, marginBottom: 12, color: '#b91c1c', background: '#fef2f2', borderRadius: 8 }}>
            <span>{error}</span>
            <button onClick={() => setRefreshVersion((version) => version + 1)} style={{ marginLeft: 12 }}>Retry</button>
          </div>
        )}

        <div style={{ overflowX: 'auto' }} aria-busy={loading}>
          <table className="table" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th><button onClick={() => toggleSort('first_name')}>Name{sortIndicator('first_name')}</button></th>
                <th><button onClick={() => toggleSort('email')}>Email{sortIndicator('email')}</button></th>
                <th>Phone</th>
                <th><button onClick={() => toggleSort('status')}>Status{sortIndicator('status')}</button></th>
                <th><button onClick={() => toggleSort('created_at')}>Joined{sortIndicator('created_at')}</button></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <tr key={`loading-${index}`}><td colSpan={6} style={{ color: '#6b7280' }}>Loading users…</td></tr>
                ))
              ) : !error && userList?.items.map((user) => (
                <tr key={user.id}>
                  <td>
                    <button onClick={() => openUser(user.id)} style={{ border: 'none', background: 'transparent', color: '#1d4ed8', cursor: 'pointer', padding: 0 }}>
                      {displayName(user)}
                    </button>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone || 'Not available'}</td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: 4, background: user.is_active && user.status === 'active' && !user.is_blocked && !user.is_suspended ? '#d1fae5' : '#f3f4f6', fontSize: 12 }}>
                      {displayStatus(user)}
                    </span>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button onClick={() => openUser(user.id)} style={{ padding: '6px 8px' }}>View</button>
                      <select
                        aria-label={`Manage ${displayName(user)}`}
                        value=""
                        disabled={actionLoading}
                        onChange={(event) => {
                          const action = event.target.value as AdminUserStatusAction;
                          if (action) startAction(user, action);
                        }}
                      >
                        <option value="">Manage</option>
                        {actionsFor(user).map((action) => <option key={action} value={action}>{actionLabel(action)}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && userList?.items.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: '#4b5563' }}>
            {debouncedSearch || status ? 'No users match the selected search or filter.' : 'No users are available.'}
          </div>
        )}
        {userList && userList.total_pages > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <span>Page {userList.page} of {userList.total_pages} · {userList.total} users</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
              <button disabled={loading || page >= userList.total_pages} onClick={() => setPage((current) => current + 1)}>Next</button>
            </div>
          </div>
        )}
      </section>

      <Modal open={detailUserId !== null} title={selectedUser ? displayName(selectedUser) : 'User profile'} onClose={closeUser}>
        {detailLoading && <p>Loading user profile…</p>}
        {detailError && <p role="alert" style={{ color: '#b91c1c' }}>{detailError}</p>}
        {selectedUser && (
          <div>
            <div role="tablist" aria-label="User profile sections" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {PROFILE_TABS.map((name) => (
                <button
                  key={name}
                  role="tab"
                  aria-selected={tab === name}
                  onClick={() => setTab(name)}
                  style={{ padding: '8px 12px', borderRadius: 999, border: tab === name ? '1px solid #1d4ed8' : '1px solid #dbe2ef', background: tab === name ? '#eff6ff' : 'white', cursor: 'pointer' }}
                >
                  {name}
                </button>
              ))}
            </div>

            {tab === 'Overview' && (
              <div className="panel-card">
                <p className="panel-title">User overview</p>
                <p><strong>Name:</strong> {displayName(selectedUser)}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Username:</strong> {selectedUser.username || 'Not available'}</p>
                <p><strong>Phone:</strong> {selectedUser.phone || 'Not available'}</p>
                <p><strong>Status:</strong> {displayStatus(selectedUser)}</p>
                <p><strong>Email verified:</strong> {selectedUser.is_email_verified ? 'Yes' : 'No'}</p>
                <p><strong>Phone verified:</strong> {selectedUser.is_phone_verified ? 'Yes' : 'No'}</p>
                <p><strong>Joined:</strong> {formatDate(selectedUser.created_at)}</p>
                <p style={{ marginBottom: 0 }}><strong>Last login:</strong> {formatDate(selectedUser.last_login_at)}</p>
              </div>
            )}

            {tab === 'Wallet' && (
              <div>
                <h3 className="section-title">Wallet and ledger</h3>
                {walletLoading && <p aria-live="polite">Loading wallet…</p>}
                {walletError && <p role="alert" style={{ color: '#b91c1c' }}>{walletError} <button onClick={() => setProfileRefresh((n) => n + 1)}>Retry</button></p>}
                {!walletLoading && !walletError && wallet === null && <p>No wallet record exists for this user.</p>}
                {wallet && (
                  <>
                    <div className="panel-card">
                      <p><strong>Currency:</strong> {wallet.currency}</p>
                      <p><strong>Available:</strong> {formatAmount(wallet.available_balance, wallet.currency)}</p>
                      <p><strong>Locked:</strong> {formatAmount(wallet.locked_balance, wallet.currency)}</p>
                      <p><strong>Ledger:</strong> {formatAmount(wallet.ledger_balance, wallet.currency)}</p>
                      <p><strong>Wallet status:</strong> {statusLabel(wallet.status)}</p>
                      <p style={{ marginBottom: 0 }}><strong>Active:</strong> {wallet.is_active ? 'Yes' : 'No'}{wallet.is_frozen ? ' · Frozen' : ''}{wallet.is_suspended ? ' · Suspended' : ''}</p>
                    </div>
                    <h4>Persisted ledger entries</h4>
                    {ledgerLoading && <p aria-live="polite">Loading ledger entries…</p>}
                    {ledgerError && <p role="alert" style={{ color: '#b91c1c' }}>{ledgerError} <button onClick={() => setProfileRefresh((n) => n + 1)}>Retry</button></p>}
                    {!ledgerLoading && !ledgerError && ledger?.items.length === 0 && <p>No ledger entries are available for this wallet.</p>}
                    {ledger && ledger.items.length > 0 && (
                      <>
                        <div style={{ overflowX: 'auto' }}>
                          <table className="table" style={{ minWidth: 700 }}>
                            <thead><tr><th>Date</th><th>Reference</th><th>Type</th><th>Amount</th><th>Status</th><th>Description</th></tr></thead>
                            <tbody>{ledger.items.map((entry) => (
                              <tr key={entry.id}>
                                <td>{formatDate(entry.created_at)}</td>
                                <td>{entry.transaction_reference}</td>
                                <td>{entry.entry_type}</td>
                                <td>{formatAmount(entry.credit_amount !== '0.00' ? entry.credit_amount : `-${entry.debit_amount}`, entry.currency)}</td>
                                <td>{statusLabel(entry.status)}</td>
                                <td>{entry.description || 'Not available'}</td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                          <span>Page {ledger.page} of {ledger.total_pages} · {ledger.total} entries</span>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button disabled={ledgerLoading || ledger.page <= 1} onClick={() => setLedgerPage((n) => n - 1)}>Previous</button>
                            <button disabled={ledgerLoading || ledger.page >= ledger.total_pages} onClick={() => setLedgerPage((n) => n + 1)}>Next</button>
                          </div>
                        </div>
                      </>
                    )}
                    <p style={{ color: '#6b7280' }}>
                      Wallet adjustments are unavailable here until the backend supports currency validation and idempotent audited requests.
                    </p>
                  </>
                )}
              </div>
            )}

            {tab === 'KYC' && (
              <div>
                <h3 className="section-title">KYC submissions</h3>
                <p style={{ color: '#6b7280' }}>Document previews are unavailable because no authorized private document-delivery mechanism is configured. Document references and compliance notes are not exposed.</p>
                {kycLoading && <p aria-live="polite">Loading KYC submissions…</p>}
                {kycError && <p role="alert" style={{ color: '#b91c1c' }}>{kycError} <button onClick={() => setProfileRefresh((n) => n + 1)}>Retry</button></p>}
                {!kycLoading && !kycError && kycRecords?.items.length === 0 && <p>No KYC submissions are recorded for this user.</p>}
                {kycRecords?.items.map((record) => (
                  <article key={record.id} className="panel-card" style={{ marginBottom: 12 }}>
                    <p><strong>Status:</strong> <span>{statusLabel(record.verification_status)}</span></p>
                    <p><strong>Verification level:</strong> {statusLabel(record.verification_level)}</p>
                    <p><strong>Document type:</strong> {record.document_type ? statusLabel(record.document_type) : 'Not available'}</p>
                    <p><strong>Document verification:</strong> {record.document_verification_status ? statusLabel(record.document_verification_status) : 'Not available'}</p>
                    <p><strong>Submitted:</strong> {formatDate(record.submitted_at)}</p>
                    <p><strong>Reviewed:</strong> {formatDate(record.reviewed_at)}</p>
                    <p><strong>Reviewer:</strong> {record.reviewed_by || 'Not available'}</p>
                    {record.rejection_reason && <p><strong>Rejection reason:</strong> {record.rejection_reason}</p>}
                    {['pending', 'reviewing'].includes(record.verification_status.toLowerCase()) && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button disabled={kycReviewLoading} onClick={() => { setKycReviewNotes(''); setPendingKycReview({ record, action: 'approved' }); }}>Approve</button>
                        <button disabled={kycReviewLoading} onClick={() => { setKycReviewNotes(''); setPendingKycReview({ record, action: 'rejected' }); }}>Reject</button>
                      </div>
                    )}
                  </article>
                ))}
                {kycRecords && kycRecords.total_pages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <span>Page {kycRecords.page} of {kycRecords.total_pages} · {kycRecords.total} submissions</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button disabled={kycLoading || kycRecords.page <= 1} onClick={() => { setKycRecords(null); setKycPage((current) => current - 1); }}>Previous</button>
                      <button disabled={kycLoading || kycRecords.page >= kycRecords.total_pages} onClick={() => { setKycRecords(null); setKycPage((current) => current + 1); }}>Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'Transactions' && (
              <div>
                <h3 className="section-title">Transactions</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <input aria-label="Search transaction references" value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} placeholder="Search reference" />
                  <input aria-label="Filter transaction status" value={transactionStatus} onChange={(event) => { setTransactionStatus(event.target.value); setTransactionPage(1); }} placeholder="Exact status" />
                  <input aria-label="Filter transaction category" value={transactionCategory} onChange={(event) => { setTransactionCategory(event.target.value); setTransactionPage(1); }} placeholder="Exact category" />
                  <input aria-label="Filter currency" value={transactionCurrency} onChange={(event) => { setTransactionCurrency(event.target.value); setTransactionPage(1); }} placeholder="Currency" maxLength={10} />
                  <label>From <input aria-label="Transaction start date" type="date" value={transactionStartDate} onChange={(event) => { setTransactionStartDate(event.target.value); setTransactionPage(1); }} /></label>
                  <label>To <input aria-label="Transaction end date" type="date" value={transactionEndDate} onChange={(event) => { setTransactionEndDate(event.target.value); setTransactionPage(1); }} /></label>
                </div>
                {transactionsLoading && <p aria-live="polite">Loading transactions…</p>}
                {transactionsError && <p role="alert" style={{ color: '#b91c1c' }}>{transactionsError} <button onClick={() => setProfileRefresh((n) => n + 1)}>Retry</button></p>}
                {!transactionsLoading && !transactionsError && transactions?.items.length === 0 && <p>No transactions match the selected filters.</p>}
                {transactions && transactions.items.length > 0 && (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table" style={{ minWidth: 760 }}>
                        <thead><tr><th>Created</th><th>Reference</th><th>Type / category</th><th>Amount</th><th>Status</th><th>Provider</th><th>Details</th></tr></thead>
                        <tbody>{transactions.items.map((transaction) => (
                          <tr key={transaction.id}>
                            <td>{formatDate(transaction.created_at)}</td>
                            <td>{transaction.reference}</td>
                            <td>{transaction.transaction_type} / {transaction.category}</td>
                            <td>{formatAmount(transaction.amount, transaction.currency)}</td>
                            <td>{statusLabel(transaction.status)}</td>
                            <td>{transaction.provider_name || 'Not available'}</td>
                            <td><button onClick={() => void openTransaction(transaction.id)}>View</button></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <span>Page {transactions.page} of {transactions.total_pages} · {transactions.total} transactions</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button disabled={transactionsLoading || transactions.page <= 1} onClick={() => setTransactionPage((n) => n - 1)}>Previous</button>
                        <button disabled={transactionsLoading || transactions.page >= transactions.total_pages} onClick={() => setTransactionPage((n) => n + 1)}>Next</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === 'Activity' && (
              <div>
                <h3 className="section-title">Admin account activity</h3>
                <p style={{ color: '#6b7280' }}>These are persisted admin audit events recorded against this user. Login events and KYC review events are separate sources and are not included here.</p>
                {activityLoading && <p aria-live="polite">Loading activity…</p>}
                {activityError && <p role="alert" style={{ color: '#b91c1c' }}>{activityError} <button onClick={() => setProfileRefresh((n) => n + 1)}>Retry</button></p>}
                {!activityLoading && !activityError && activity?.items.length === 0 && <p>No admin audit activity is recorded for this user.</p>}
                {activity && activity.items.length > 0 && (
                  <>
                    <ol style={{ paddingLeft: 22 }}>
                      {activity.items.map((event) => (
                        <li key={event.id} style={{ marginBottom: 14 }}>
                          <strong>{statusLabel(event.action)}</strong>
                          <div>{event.description || 'No description was recorded.'}</div>
                          <small>{formatDate(event.created_at)} · {event.actor_type}{event.actor_id ? ` · ${event.actor_id}` : ''}</small>
                        </li>
                      ))}
                    </ol>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Page {activity.page} of {activity.total_pages} · {activity.total} events</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button disabled={activityLoading || activity.page <= 1} onClick={() => setActivityPage((n) => n - 1)}>Previous</button>
                        <button disabled={activityLoading || activity.page >= activity.total_pages} onClick={() => setActivityPage((n) => n + 1)}>Next</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === 'Security / sessions' && (
              <div>
                <h3 className="section-title">Active sessions</h3>
                {sessionsLoading && <p aria-live="polite">Loading active sessions…</p>}
                {sessionsError && <p role="alert" style={{ color: '#b91c1c' }}>{sessionsError} <button onClick={() => setProfileRefresh((n) => n + 1)}>Retry</button></p>}
                {!sessionsLoading && !sessionsError && sessions?.length === 0 && <p>No active sessions are currently recorded.</p>}
                {sessions && sessions.length > 0 && (
                  <>
                    <p>{sessions.length} active session{sessions.length === 1 ? '' : 's'}.</p>
                    <ul>{sessions.map((session) => (
                      <li key={session.session_id} style={{ marginBottom: 10 }}>
                        {session.device_name || session.browser || session.operating_system || 'Unknown device'} · {statusLabel(session.status || 'unknown')}
                        <div><small>Created {formatDate(session.created_at)} · Last active {formatDate(session.last_activity_at)} · Expires {formatDate(session.expires_at)}</small></div>
                        <button
                          disabled={revokingSessionId !== null || revokeLoading}
                          onClick={() => void revokeSession(session)}
                        >
                          {revokingSessionId === session.session_id ? 'Revoking…' : 'Revoke session'}
                        </button>
                      </li>
                    ))}</ul>
                    <button onClick={() => { setRevokeReason(''); setRevokeDialogOpen(true); }}>Revoke all sessions</button>
                  </>
                )}
                <h3>Session lifecycle history</h3>
                <p style={{ color: '#6b7280' }}>Only persisted session create/revoke events are shown; this is not a full login or device history.</p>
                {sessionHistoryLoading && <p aria-live="polite">Loading session history…</p>}
                {sessionHistoryError && <p role="alert" style={{ color: '#b91c1c' }}>{sessionHistoryError} <button onClick={() => setProfileRefresh((n) => n + 1)}>Retry</button></p>}
                {!sessionHistoryLoading && !sessionHistoryError && sessionHistory?.items.length === 0 && <p>No session lifecycle events are recorded.</p>}
                {sessionHistory && sessionHistory.items.length > 0 && (
                  <>
                    <ul>{sessionHistory.items.map((event, index) => <li key={`${event.timestamp}-${index}`}>{statusLabel(event.action)} · {formatDate(event.timestamp)}</li>)}</ul>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Page {sessionHistory.page} of {sessionHistory.total_pages} · {sessionHistory.total} events</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button disabled={sessionHistoryLoading || sessionHistory.page <= 1} onClick={() => setSessionHistoryPage((n) => n - 1)}>Previous</button>
                        <button disabled={sessionHistoryLoading || sessionHistory.page >= sessionHistory.total_pages} onClick={() => setSessionHistoryPage((n) => n + 1)}>Next</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={transactionDetailLoading || transactionDetail !== null || transactionDetailError !== null} title="Transaction details" onClose={() => { setTransactionDetail(null); setTransactionDetailError(null); }}>
        {transactionDetailLoading && <p>Loading transaction details…</p>}
        {transactionDetailError && <p role="alert">{transactionDetailError}</p>}
        {transactionDetail && (
          <div className="panel-card">
            <p><strong>Reference:</strong> {transactionDetail.reference}</p>
            <p><strong>Type / category:</strong> {transactionDetail.transaction_type} / {transactionDetail.category}</p>
            <p><strong>Amount:</strong> {formatAmount(transactionDetail.amount, transactionDetail.currency)}</p>
            <p><strong>Status:</strong> {statusLabel(transactionDetail.status)}</p>
            <p><strong>Provider:</strong> {transactionDetail.provider_name || 'Not available'}</p>
            <p><strong>Provider reference:</strong> {transactionDetail.provider_reference || 'Not available'}</p>
            <p><strong>Description:</strong> {transactionDetail.description || 'Not available'}</p>
            <p style={{ marginBottom: 0 }}><strong>Created:</strong> {formatDate(transactionDetail.created_at)}</p>
          </div>
        )}
      </Modal>

      <Modal open={pendingKycReview !== null} title={pendingKycReview ? `${actionLabel(pendingKycReview.action)} KYC` : 'Review KYC'} onClose={() => { if (!kycReviewLoading) setPendingKycReview(null); }}>
        {pendingKycReview && (
          <div style={{ display: 'grid', gap: 12 }}>
            <p>Confirm {pendingKycReview.action} for KYC submission <strong>{pendingKycReview.record.id}</strong>.</p>
            <label>
              {pendingKycReview.action === 'rejected' ? 'Rejection reason (required)' : 'Review note (optional)'}
              <textarea value={kycReviewNotes} onChange={(event) => setKycReviewNotes(event.target.value)} maxLength={500} required={pendingKycReview.action === 'rejected'} rows={3} style={{ display: 'block', width: '100%', marginTop: 6, padding: 8 }} />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button disabled={kycReviewLoading} onClick={() => setPendingKycReview(null)}>Cancel</button>
              <button disabled={kycReviewLoading || (pendingKycReview.action === 'rejected' && !kycReviewNotes.trim())} onClick={() => void confirmKycReview()}>{kycReviewLoading ? 'Saving…' : `Confirm ${pendingKycReview.action}`}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={revokeDialogOpen} title="Revoke all active sessions" onClose={() => { if (!revokeLoading) setRevokeDialogOpen(false); }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <p>This will revoke all currently active sessions for this user. The operation is recorded in the admin audit log.</p>
          <label>
            Reason
            <textarea value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} maxLength={500} required rows={3} style={{ display: 'block', width: '100%', marginTop: 6, padding: 8 }} />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button disabled={revokeLoading} onClick={() => setRevokeDialogOpen(false)}>Cancel</button>
            <button disabled={revokeLoading || !revokeReason.trim()} onClick={() => void confirmSessionRevocation()}>{revokeLoading ? 'Revoking…' : 'Revoke sessions'}</button>
          </div>
        </div>
      </Modal>

      <Modal
        open={pendingAction !== null}
        title={pendingAction ? `${actionLabel(pendingAction.action)} user` : 'Confirm action'}
        onClose={() => { if (!actionLoading) setPendingAction(null); }}
      >
        {pendingAction && (
          <div style={{ display: 'grid', gap: 12 }}>
            <p>
              Confirm {pendingAction.action} for <strong>{displayName(pendingAction.user)}</strong>.
              This action will be recorded in the admin audit log.
            </p>
            <label>
              Reason
              <textarea
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                maxLength={500}
                required
                rows={3}
                style={{ display: 'block', width: '100%', marginTop: 6, padding: 8, border: '1px solid #dbe2ef', borderRadius: 6 }}
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button disabled={actionLoading} onClick={() => setPendingAction(null)}>Cancel</button>
              <button disabled={actionLoading || !actionReason.trim()} onClick={() => void confirmAction()}>
                {actionLoading ? 'Saving…' : `Confirm ${pendingAction.action}`}
              </button>
            </div>
          </div>
        )}
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default UsersPage;
