import { mockData } from '../data/mockData';

function MarketingPage() {
  const { marketing } = mockData;

  return (
    <div>
      <h1 className="page-heading">Marketing</h1>
      <section className="panel">
        <h2 className="section-title">Campaigns & Promotions ({marketing.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Code/Name</th>
              <th>Status</th>
              <th>Usage/Points</th>
            </tr>
          </thead>
          <tbody>
            {marketing.map((campaign) => (
              <tr key={campaign.id}>
                <td>{campaign.id}</td>
                <td><span style={{ padding: '2px 6px', borderRadius: '3px', background: '#eef2ff', fontSize: '12px' }}>{campaign.type}</span></td>
                <td>{campaign.code || campaign.name}</td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: campaign.status === 'Active' ? '#d1fae5' : campaign.status === 'Scheduled' ? '#fef3c7' : '#f3f4f6', fontSize: '12px' }}>{campaign.status}</span></td>
                <td>{campaign.usageCount ? campaign.usageCount.toLocaleString() : campaign.points ? `${campaign.points.toLocaleString()} pts` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default MarketingPage;
