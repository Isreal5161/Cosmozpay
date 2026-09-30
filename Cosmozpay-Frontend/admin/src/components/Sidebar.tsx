import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/wallet', label: 'Wallet' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/payments', label: 'Payments' },
  { to: '/finance', label: 'Finance' },
  { to: '/kyc', label: 'KYC' },
  { to: '/fraud', label: 'Fraud' },
  { to: '/support', label: 'Support' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/reports', label: 'Reports' },
  { to: '/products', label: 'Products' },
  { to: '/merchants', label: 'Merchants' },
  { to: '/staff', label: 'Staff' },
  { to: '/settings', label: 'Settings' },
  { to: '/security', label: 'Security' },
  { to: '/marketing', label: 'Marketing' },
  { to: '/audit', label: 'Audit' },
  { to: '/api', label: 'API' },
  { to: '/monitoring', label: 'Monitoring' }
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">CosmozPay Admin</div>
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          {link.label}
        </NavLink>
      ))}
    </aside>
  );
}

export default Sidebar;
