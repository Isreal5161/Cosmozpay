import { mockData } from '../data/mockData';

function StaffPage() {
  const { staff } = mockData;

  return (
    <div>
      <h1 className="page-heading">Staff & Admin Management</h1>
      <section className="panel">
        <h2 className="section-title">Admin Accounts ({staff.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Staff ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>{member.name}</td>
                <td>{member.email}</td>
                <td><span style={{ padding: '2px 6px', borderRadius: '3px', background: '#eef2ff', fontSize: '12px' }}>{member.role}</span></td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: member.status === 'Active' ? '#d1fae5' : '#f3f4f6', fontSize: '12px' }}>{member.status}</span></td>
                <td>{member.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default StaffPage;
