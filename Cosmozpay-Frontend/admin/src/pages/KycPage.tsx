import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { adminMockService, type KycRecord } from '../services/mockAdminService';

function KycPage() {
  const [kyc, setKyc] = useState<KycRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KycRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await adminMockService.fetchKyc();
      setKyc(data);
      setLoading(false);
    };
    void load();
  }, []);

  const runDecision = async (kycId: string, action: 'approve' | 'reject' | 'resubmit') => {
    const confirmed = action === 'reject' ? window.confirm('Reject this KYC?') : true;
    if (!confirmed) return;
    await adminMockService.updateKyc(kycId, action);
    const refreshed = await adminMockService.fetchKyc();
    setKyc(refreshed);
    setToast(`KYC ${action}d`);
  };

  return (
    <div>
      <h1 className="page-heading">KYC & Compliance</h1>
      <section className="panel">
        <h2 className="section-title">KYC Applications ({kyc.length})</h2>
        {loading ? <div>Loading KYC…</div> : <table className="table"><thead><tr><th>KYC ID</th><th>User</th><th>ID Type</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>{kyc.map((app) => <tr key={app.id}><td><button onClick={() => setSelected(app)} style={{ border: 'none', background: 'transparent', color: '#1d4ed8', cursor: 'pointer', padding: 0 }}>{app.id}</button></td><td>{app.user}</td><td>{app.idType}</td><td>{app.status}</td><td>{app.submittedDate}</td><td><select defaultValue="" onChange={(e) => { const value = e.target.value; if (value) { void runDecision(app.id, value as 'approve' | 'reject' | 'resubmit'); e.target.value=''; } }} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #dbe2ef' }}><option value="">Action</option><option value="approve">Approve</option><option value="reject">Reject</option><option value="resubmit">Resubmit</option></select></td></tr>)}</tbody></table>}
      </section>

      <Modal open={!!selected} title={`KYC ${selected?.id ?? ''}`} onClose={() => setSelected(null)}>
        {selected && <div className="panel-card"><p className="panel-title">Documents</p><p>ID: {selected.document}</p><p>Selfie: {selected.selfie}</p><p>Reason: {selected.reason ?? 'None'}</p><ul>{selected.history.map((entry) => <li key={entry.time}>{entry.action} by {entry.actor} · {entry.time}</li>)}</ul></div>}
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default KycPage;
