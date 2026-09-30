import { useEffect, useMemo, useState } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { adminMockService, type TransactionRecord } from '../services/mockAdminService';

function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedTxn, setSelectedTxn] = useState<TransactionRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await adminMockService.fetchTransactions();
      setTransactions(data);
      setLoading(false);
    };
    void load();
  }, []);

  const filtered = useMemo(() => transactions.filter((txn) => (filter === 'All' ? true : txn.status === filter) && `${txn.id} ${txn.user} ${txn.reference}`.toLowerCase().includes(search.toLowerCase())), [transactions, search, filter]);

  const runTxnAction = async (txnId: string, action: string) => {
    const confirmed = window.confirm(`Confirm ${action}?`);
    if (!confirmed) return;
    await adminMockService.updateTransaction(txnId, action);
    setToast(`${action} applied`);
    const refreshed = await adminMockService.fetchTransactions();
    setTransactions(refreshed);
  };

  return (
    <div>
      <h1 className="page-heading">Transaction Management</h1>
      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <h2 className="section-title" style={{ margin: 0 }}>All Transactions ({filtered.length})</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transaction" style={{ padding: '8px 12px', border: '1px solid #dbe2ef', borderRadius: 8 }} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #dbe2ef', borderRadius: 8 }}><option>All</option><option>Successful</option><option>Failed</option><option>Pending</option><option>Reversed</option></select>
          </div>
        </div>
        {loading ? <div>Loading transactions…</div> : <table className="table"><thead><tr><th>Txn ID</th><th>User</th><th>Reference</th><th>Provider</th><th>Status</th><th>Amount</th><th>Actions</th></tr></thead><tbody>{filtered.map((txn) => <tr key={txn.id}><td><button onClick={() => setSelectedTxn(txn)} style={{ border: 'none', background: 'transparent', color: '#1d4ed8', cursor: 'pointer', padding: 0 }}>{txn.id}</button></td><td>{txn.user}</td><td>{txn.reference}</td><td>{txn.provider}</td><td>{txn.status}</td><td>₦{txn.amount}</td><td><select defaultValue="" onChange={(e) => { const value = e.target.value; if (value) { void runTxnAction(txn.id, value); e.target.value = ''; } }} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #dbe2ef' }}><option value="">Actions</option><option value="reverse">Reverse</option><option value="retry">Retry</option><option value="refund">Refund</option><option value="approve">Approve</option><option value="reject">Reject</option></select></td></tr>)}</tbody></table>}
      </section>

      <Modal open={!!selectedTxn} title={`Transaction ${selectedTxn?.id ?? ''}`} onClose={() => setSelectedTxn(null)}>
        {selectedTxn && <div className="panel-card"><p className="panel-title">Timeline</p><ul>{selectedTxn.timeline.map((item) => <li key={item.title}>{item.title}: {item.detail} · {item.time}</li>)}</ul><p className="panel-title" style={{ marginTop: 12 }}>Audit</p><ul>{selectedTxn.auditLogs.map((item) => <li key={item.action}>{item.action} by {item.actor} · {item.time}</li>)}</ul></div>}
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default TransactionsPage;
