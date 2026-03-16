import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const navSections = [
  { title: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: '⊞', end: true }] },
  { title: 'Management', items: [
    { to: '/admin/Users/UsersList', label: 'Users', icon: '👥' },
    { to: '/admin/Auctions/Auctions', label: 'Auctions', icon: '🔨' },
    { to: '/admin/Categories/Categories', label: 'Categories', icon: '📂' },
  ]},
  { title: 'Bidding', items: [{ to: '/admin/Bids/Bids', label: 'Bids', icon: '📈' }] },
  { title: 'Analytics', items: [{ to: '/admin/Reports/Reports', label: 'Reports', icon: '📊' }] },
  { title: 'System', items: [{ to: '/admin/Settings', label: 'Settings', icon: '⚙️' }] },
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = navSections.map(s => ({
    ...s,
    items: s.items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
  })).filter(s => s.items.length > 0);

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-gray-900 text-white flex flex-col transition-all duration-300 min-h-screen`}>
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!collapsed && <div><div className="text-lg font-bold text-indigo-400">E-Auction</div><div className="text-xs text-gray-500 uppercase tracking-wider">Admin Panel</div></div>}
        <button onClick={() => setCollapsed(!collapsed)} className="w-8 h-8 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center justify-center text-sm">☰</button>
      </div>

      {!collapsed && (
        <div className="p-3">
          <input type="text" placeholder="Search modules..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500" />
        </div>
      )}

      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {filtered.map(section => (
          <div key={section.title} className="mb-3">
            {!collapsed && <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-1">{section.title}</p>}
            {section.items.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) =>
                  `flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
                }>
                <span className="text-base">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-gray-700 space-y-1">
        <button onClick={() => navigate('/')} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-gray-300">
          {collapsed ? '🌐' : <><span>🌐</span><span>Go to Website</span></>}
        </button>
        <button onClick={() => navigate('/login')} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-sm text-white">
          {collapsed ? '🚪' : <><span>🚪</span><span>Logout</span></>}
        </button>
      </div>
    </div>
  );
};
export default AdminSidebar;
