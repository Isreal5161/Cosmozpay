import { useEffect, useMemo, useState } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { adminMockService, type AdminUser } from '../services/mockAdminService';

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [tab, setTab] = useState<'Profile' | 'Wallet' | 'Transactions' | 'KYC' | 'Security' | 'Notifications' | 'Activity Log'>('Profile');
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [walletMode, setWalletMode] = useState<'credit' | 'debit'>('credit');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletReason, setWalletReason] = useState('Admin adjustment');
  const [walletLoading, setWalletLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminMockService.fetchUsers();
        if (mounted) setUsers(data);
      } catch (err) {
        if (mounted) setError('Unable to load users');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setWalletMode('credit');
    setWalletAmount('');
    setWalletReason('Admin adjustment');
    setWalletLoading(false);
  }, [selectedUser]);

  const filteredUsers = useMemo(() => users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase())), [users, search]);

  const runAction = async (userId: number, action: string) => {
    if (action === 'profile') {
      setTab('Profile');
      await openUser(userId);
      return;
    }

    if (action === 'wallet') {
      setTab('Wallet');
      await openUser(userId);
      return;
    }

    if (action === 'delete') {
      const confirmed = window.confirm('Delete this account?');
      if (!confirmed) return;
    }

    try {
      await adminMockService.updateUserAction(userId, action);
      setToast(`User ${action} successfully`);
      const refreshed = await adminMockService.fetchUsers();
      setUsers(refreshed);
    } catch (err) {
      setToast('Action failed');
    }
  };

  const openUser = async (userId: number) => {
    const user = await adminMockService.fetchUser(userId);
    setSelectedUser(user);
  };

  const submitWalletAdjustment = async () => {
    if (!selectedUser) return;
    const amount = Number(walletAmount);
    if (!amount || amount <= 0) {
      setToast('Enter a valid amount');
      return;
    }

    setWalletLoading(true);
    try {
      const updated = walletMode === 'credit'
        ? await adminMockService.creditWallet(selectedUser.id, amount, walletReason)
        : await adminMockService.debitWallet(selectedUser.id, amount, walletReason);

      if (updated) {
        setSelectedUser(updated);
        const refreshed = await adminMockService.fetchUsers();
        setUsers(refreshed);
        setToast(`Wallet ${walletMode} successful`);
        setWalletAmount('');
      } else {
        setToast('Unable to update wallet');
      }
    } catch (err) {
      setToast('Wallet adjustment failed');
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-heading">User Management</h1>
      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <h2 className="section-title" style={{ margin: 0 }}>All Users ({filteredUsers.length})</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" style={{ padding: '8px 12px', border: '1px solid #dbe2ef', borderRadius: 8, minWidth: 220 }} />
        </div>
        {loading && <div>Loading users…</div>}
        {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
        {!loading && !error && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>KYC</th>
                <th>Wallet</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td><button onClick={() => openUser(user.id)} style={{ border: 'none', background: 'transparent', color: '#1d4ed8', cursor: 'pointer', padding: 0 }}>{user.name}</button></td>
                  <td>{user.email}</td>
                  <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: user.kycStatus === 'Verified' ? '#d1fae5' : '#fef3c7', fontSize: '12px' }}>{user.kycStatus}</span></td>
                  <td>₦{user.wallet}</td>
                  <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: user.status === 'Active' ? '#d1fae5' : '#fee2e2', fontSize: '12px' }}>{user.status}</span></td>
                  <td>
                    <select defaultValue="" onChange={(e) => { const value = e.target.value; if (value) { void runAction(user.id, value); e.target.value = ''; } }} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #dbe2ef' }}>
                      <option value="">Action</option>
                      <option value="profile">View profile</option>
                      <option value="wallet">Open wallet</option>
                      <option value="freeze">Freeze</option>
                      <option value="unfreeze">Unfreeze</option>
                      <option value="suspend">Suspend</option>
                      <option value="activate">Activate</option>
                      <option value="delete">Delete</option>
                      <option value="reset-pin">Reset PIN</option>
                      <option value="reset-password">Reset password</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !error && filteredUsers.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: '#374151' }}>No User available at the moment</div>
        )}
      </section>

      <Modal open={!!selectedUser} title={selectedUser?.name ?? 'User Details'} onClose={() => setSelectedUser(null)}>
        {selectedUser && (
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {(['Profile','Wallet','Transactions','KYC','Security','Notifications','Activity Log'] as const).map((name) => (
                <button key={name} onClick={() => setTab(name)} style={{ padding: '8px 12px', borderRadius: 999, border: tab === name ? '1px solid #1d4ed8' : '1px solid #dbe2ef', background: tab === name ? '#eff6ff' : 'white', cursor: 'pointer' }}>{name}</button>
              ))}
            </div>

            {tab === 'Profile' && <div className="panel-card"><p className="panel-title">Profile</p><p>Name: {selectedUser.name}</p><p>Email: {selectedUser.email}</p><p>Phone: {selectedUser.phone}</p><p>Location: {selectedUser.location}</p><p>Role: {selectedUser.role}</p></div>}
            {tab === 'Wallet' && <div className="panel-card"><p className="panel-title">Wallet</p><p>Balance: ₦{selectedUser.walletInfo.balance}</p><p>Reserved: ₦{selectedUser.walletInfo.reserved}</p><div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6 }}>Mode</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setWalletMode('credit')} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: walletMode === 'credit' ? '2px solid #2563eb' : '1px solid #dbe2ef', background: walletMode === 'credit' ? '#eff6ff' : '#fff' }}>Credit</button>
                      <button onClick={() => setWalletMode('debit')} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: walletMode === 'debit' ? '2px solid #dc2626' : '1px solid #dbe2ef', background: walletMode === 'debit' ? '#fee2e2' : '#fff' }}>Debit</button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6 }}>Amount</label>
                    <input type="number" min="1" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} placeholder="Enter amount" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #dbe2ef' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6 }}>Reason</label>
                  <input value={walletReason} onChange={(e) => setWalletReason(e.target.value)} placeholder="Adjustment reason" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #dbe2ef' }} />
                </div>
                <button onClick={submitWalletAdjustment} disabled={walletLoading} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: walletMode === 'credit' ? '#2563eb' : '#dc2626', color: 'white', cursor: 'pointer', width: 160 }}>
                  {walletLoading ? 'Processing…' : walletMode === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
                </button>
                <div style={{ marginTop: 16 }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Wallet ledger</p>
                  <ul style={{ paddingLeft: 18 }}>
                    {selectedUser.walletInfo.ledger.map((item) => <li key={item.id}>{item.date} · {item.type} · ₦{item.amount} · {item.note}</li>)}
                  </ul>
                </div>
              </div></div>}
            {tab === 'Transactions' && <div className="panel-card"><p className="panel-title">Transactions</p><ul>{selectedUser.transactions.map((item) => <li key={item.id}>{item.type} · ₦{item.amount} · {item.provider} · {item.status}</li>)}</ul></div>}
            {tab === 'KYC' && <div className="panel-card"><p className="panel-title">KYC</p><p>Status: {selectedUser.kycInfo.status}</p><p>ID Type: {selectedUser.kycInfo.idType}</p><p>Document: {selectedUser.kycInfo.document}</p><p>Selfie: {selectedUser.kycInfo.selfie}</p></div>}
            {tab === 'Security' && <div className="panel-card"><p className="panel-title">Security</p><ul>{selectedUser.loginHistory.map((entry) => <li key={entry.timestamp}>{entry.timestamp} · {entry.device} · {entry.status}</li>)}</ul></div>}
            {tab === 'Notifications' && <div className="panel-card"><p className="panel-title">Notifications</p><p>Send a direct message to {selectedUser.name}</p><button onClick={() => setToast('Notification queued for user')} style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #dbe2ef', background: 'white' }}>Queue Notification</button></div>}
            {tab === 'Activity Log' && <div className="panel-card"><p className="panel-title">Activity Log</p><ul>{selectedUser.activityLog.map((entry) => <li key={entry.timestamp}>{entry.timestamp} · {entry.action} · {entry.detail}</li>)}</ul></div>}
          </div>
        )}
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default UsersPage;
