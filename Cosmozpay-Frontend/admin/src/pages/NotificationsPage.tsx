import { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import { adminMockService, type NotificationPayload } from '../services/mockAdminService';

function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState<NotificationPayload>({ title: '', message: '', type: 'Push', audience: 'All Users', preview: '' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await adminMockService.fetchNotifications();
      setNotifications(data);
      setLoading(false);
    };
    void load();
  }, []);

  const send = async () => {
    await adminMockService.createNotification(form);
    const data = await adminMockService.fetchNotifications();
    setNotifications(data);
    setToast('Notification sent');
  };

  return (
    <div>
      <h1 className="page-heading">Notifications</h1>
      <section className="panel">
        <h2 className="section-title">Send Notification</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #dbe2ef' }} />
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #dbe2ef', minHeight: 90 }} />
          <input value={form.preview} onChange={(e) => setForm({ ...form, preview: e.target.value })} placeholder="Preview text" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #dbe2ef' }} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as NotificationPayload['type'] })} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #dbe2ef' }}><option value="Push">Push</option><option value="In-App">In-App</option><option value="Email">Email</option><option value="SMS">SMS</option><option value="Broadcast">Broadcast</option></select>
          <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #dbe2ef' }}><option>All Users</option><option>Verified Users</option><option>Unverified Users</option><option>Inactive Users</option><option>Users with Wallet Balance</option><option>Users by Network</option></select>
          <button onClick={() => void send()} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: 'white', cursor: 'pointer', width: 180 }}>Send</button>
        </div>
      </section>
      <section className="panel">
        <h2 className="section-title">Notification History</h2>
        {loading ? <div>Loading notifications…</div> : <table className="table"><thead><tr><th>Title</th><th>Type</th><th>Audience</th><th>Status</th><th>Date</th></tr></thead><tbody>{notifications.map((notif) => <tr key={notif.id}><td>{notif.title}</td><td>{notif.type}</td><td>{notif.audience}</td><td>{notif.status}</td><td>{notif.sentDate}</td></tr>)}</tbody></table>}
      </section>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default NotificationsPage;
