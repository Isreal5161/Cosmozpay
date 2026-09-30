import { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import { adminMockService } from '../services/mockAdminService';

function FraudPage() {
  const [fraud, setFraud] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await adminMockService.fetchFraud();
      setFraud(data);
    };
    void load();
  }, []);

  return fraud ? (
    <div>
      <h1 className="page-heading">Fraud & Risk Management</h1>
      <section className="panel panel-grid">
        <div className="panel-card"><p className="panel-title">Freeze User</p><button onClick={() => { setToast('User frozen'); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #dbe2ef', background: 'white' }}>Freeze</button></div>
        <div className="panel-card"><p className="panel-title">Blacklist User</p><button onClick={() => { setToast('User blacklisted'); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #dbe2ef', background: 'white' }}>Blacklist</button></div>
      </section>
      <section className="panel"><h2 className="section-title">Suspicious Transactions</h2><table className="table"><thead><tr><th>Txn ID</th><th>User</th><th>Amount</th><th>Risk</th><th>Type</th><th>Date</th></tr></thead><tbody>{fraud.suspiciousTransactions.map((txn: any) => <tr key={txn.txnId}><td>{txn.txnId}</td><td>{txn.user}</td><td>₦{txn.amount}</td><td>{txn.riskScore}</td><td>{txn.type}</td><td>{txn.date}</td></tr>)}</tbody></table></section>
      <section className="panel"><h2 className="section-title">Failed Logins</h2><table className="table"><thead><tr><th>User</th><th>IP</th><th>Time</th></tr></thead><tbody>{fraud.failedLogins.map((row: any, index: number) => <tr key={index}><td>{row.user}</td><td>{row.ip}</td><td>{row.time}</td></tr>)}</tbody></table></section>
      <section className="panel"><h2 className="section-title">Device & IP History</h2><table className="table"><thead><tr><th>User</th><th>Device</th><th>IP</th><th>Status</th></tr></thead><tbody>{fraud.deviceHistory.map((row: any, index: number) => <tr key={index}><td>{row.user}</td><td>{row.device}</td><td>{fraud.ipHistory[index]?.ip ?? '-'}</td><td>{row.status}</td></tr>)}</tbody></table></section>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  ) : <div>Loading fraud data…</div>;
}

export default FraudPage;
