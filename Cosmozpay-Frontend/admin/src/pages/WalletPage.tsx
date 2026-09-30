import { useEffect, useMemo, useState } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { adminMockService, type WalletLedgerItem } from '../services/mockAdminService';

function WalletPage() {
  const [ledger, setLedger] = useState<WalletLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WalletLedgerItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await adminMockService.fetchWalletLedger();
      setLedger(data);
      setLoading(false);
    };
    void load();
  }, []);

  const filtered = useMemo(
    () => ledger.filter((item) => `${item.user} ${item.note}`.toLowerCase().includes(search.toLowerCase())),
    [ledger, search]
  );

  const runLedgerAction = async (action: 'credit' | 'debit' | 'reversal' | 'adjustment') => {
    const confirmed = window.confirm(`Confirm ${action} action?`);
    if (!confirmed) return;
    const payload: WalletLedgerItem = {
      id: `WAL${Date.now()}`,
      user: 'Demo User',
      type: action,
      amount: 1000,
      note: `${action} performed`,
      date: new Date().toISOString().slice(0, 10),
      status: 'Completed',
    };
    await adminMockService.addWalletLedger(payload);
    setToast(`${action} recorded`);
    const refreshed = await adminMockService.fetchWalletLedger();
    setLedger(refreshed);
  };

  return (
    <div>
      <h1 className="page-heading">Wallet Management</h1>
      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Wallet Ledger</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ledger" style={{ padding: '8px 12px', border: '1px solid #dbe2ef', borderRadius: 8 }} />
            <button onClick={() => void runLedgerAction('credit')} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #10b981', background: '#ecfdf5', color: '#047857' }}>Manual Credit</button>
            <button onClick={() => void runLedgerAction('debit')} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ef4444', background: '#fef2f2', color: '#b91c1c' }}>Manual Debit</button>
          </div>
        </div>

        {loading ? (
          <div>Loading wallet ledger…</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Note</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <button onClick={() => setSelected(item)} style={{ border: 'none', background: 'transparent', color: '#1d4ed8', cursor: 'pointer', padding: 0 }}>
                      {item.user}
                    </button>
                  </td>
                  <td>{item.type}</td>
                  <td>₦{item.amount}</td>
                  <td>{item.note}</td>
                  <td>{item.date}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Modal open={!!selected} title="Wallet Adjustment" onClose={() => setSelected(null)}>
        {selected && (
          <div className="panel-card">
            <p className="panel-title">{selected.user}</p>
            <p>Type: {selected.type}</p>
            <p>Amount: ₦{selected.amount}</p>
            <p>Note: {selected.note}</p>
            <p>Status: {selected.status}</p>
          </div>
        )}
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default WalletPage;
