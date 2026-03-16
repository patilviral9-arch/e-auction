import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [totalUsers, setTotalUsers] = useState('0');
  const [loading, setLoading] = useState(true);

  // 1. Fetch live user data
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await axios.get("http://localhost:3000/user/getusers");
        // Check for different response structures as we did in UsersList
        const userData = res.data?.users || res.data?.data || res.data || [];
        
        // Format the number with a comma (e.g., 1,234)
        setTotalUsers(userData.length.toLocaleString());
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  // Update metrics array to use the live state
  const metrics = [
    { label: 'Total Users', value: loading ? '...' : totalUsers, change: '↑ Live Data', up: true },
    { label: 'Active Auctions', value: '143', change: '↑ 8 new today', up: true },
    { label: 'Total Bids', value: '18,542', change: '↑ 560 today', up: true },
    { label: 'Revenue', value: '$94.2K', change: '↑ $3.1K this week', up: true },
  ];

  const recentAuctions = [
    { item: 'Vintage Rolex GMT', bid: '$4,200', ends: '2h 14m', status: 'Live' },
    { item: 'Abstract Oil Painting', bid: '$850', ends: '5h 02m', status: 'Live' },
    { item: '1967 Fender Stratocaster', bid: '$7,600', ends: 'Ended', status: 'Closed' },
    { item: 'Rare Stamp Collection', bid: '—', ends: 'Tomorrow', status: 'Pending' },
    { item: 'Louis Vuitton Trunk', bid: '$3,100', ends: '1h 58m', status: 'Live' },
  ];

  const activity = [
    { text: 'New bid on Vintage Rolex GMT — $4,200', time: '2 min ago', color: '#4f46e5' },
    { text: 'User sarah.k registered', time: '14 min ago', color: '#059669' },
    { text: 'Auction "Stamp Collection" pending approval', time: '28 min ago', color: '#d97706' },
    { text: 'Dispute raised on lot #4821', time: '1h ago', color: '#dc2626' },
    { text: 'Payment confirmed — $7,600 for Fender', time: '2h ago', color: '#059669' },
  ];

  const statusColors = { Live: 'bg-blue-100 text-blue-700', Closed: 'bg-gray-100 text-gray-600', Pending: 'bg-yellow-100 text-yellow-700' };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 transition-all hover:shadow-md">
            <p className="text-sm text-gray-500 mb-1">{m.label}</p>
            <p className="text-3xl font-bold text-gray-800">{m.value}</p>
            <p className={`text-xs mt-1 ${m.up ? 'text-green-600' : 'text-red-500'}`}>{m.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Bids & Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Bids & Revenue — Last 7 Days</h3>
          <Bar data={{
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
              { label: 'Bids', data: [380, 420, 510, 360, 480, 560, 490], backgroundColor: '#4f46e5', borderRadius: 4 },
              { label: 'Revenue ($)', data: [8200, 9100, 11200, 7800, 10400, 12000, 10700], backgroundColor: '#10b981', borderRadius: 4 }
            ]
          }} options={{ responsive: true, plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } } }} />
        </div>

        {/* Status Breakdown Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Auction Status Breakdown</h3>
          <div className="flex items-center justify-around">
            <div style={{ width: 180, height: 180 }}>
              <Doughnut data={{
                labels: ['Live', 'Pending', 'Closed', 'Cancelled'],
                datasets: [{ data: [143, 67, 312, 18], backgroundColor: ['#4f46e5', '#f59e0b', '#10b981', '#ef4444'], borderWidth: 0 }]
              }} options={{ responsive: true, cutout: '65%', plugins: { legend: { display: false } } }} />
            </div>
            <div className="text-sm space-y-2">
              {[ ['#4f46e5', 'Live', '143'], ['#f59e0b', 'Pending', '67'], ['#10b981', 'Closed', '312'], ['#ef4444', 'Cancelled', '18'] ].map(([c, l, v]) => (
                <div key={l} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: c }}></span>
                  <span className="text-gray-600">{l}</span>
                  <span className="font-semibold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Recent Auctions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Recent Auctions</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Item', 'Bid', 'Ends', 'Status'].map(h => <th key={h} className="px-4 py-2 text-left text-xs text-gray-500 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {recentAuctions.map((r, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{r.item}</td>
                  <td className="px-4 py-2 text-gray-600">{r.bid}</td>
                  <td className="px-4 py-2 text-gray-600">{r.ends}</td>
                  <td className="px-4 py-2">
                    <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (statusColors[r.status] || '')}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
          </div>
          {activity.map((a, i) => (
            <div key={i} className="flex gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
              <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: a.color }}></span>
              <div>
                <p className="text-sm text-gray-700">{a.text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;