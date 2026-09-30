import { mockData } from '../data/mockData';

function MerchantsPage() {
  const { merchants } = mockData;

  return (
    <div>
      <h1 className="page-heading">Merchant Management</h1>
      <section className="panel">
        <h2 className="section-title">Merchants ({merchants.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Merchant ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Settlement</th>
              <th>Transactions</th>
              <th>Earnings</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((merchant) => (
              <tr key={merchant.id}>
                <td>{merchant.id}</td>
                <td>{merchant.name}</td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: merchant.status === 'Verified' ? '#d1fae5' : '#fef3c7', fontSize: '12px' }}>{merchant.status}</span></td>
                <td>{merchant.settlement}</td>
                <td>{merchant.totalTransactions}</td>
                <td>₦{merchant.earnings.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default MerchantsPage;
