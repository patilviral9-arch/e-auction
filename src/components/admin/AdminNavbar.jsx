import React from 'react';

const AdminNavbar = () => (
  <div className="bg-white shadow flex justify-between items-center px-6 py-3 border-b border-gray-200">
    <h2 className="text-lg font-semibold text-gray-800">Admin Dashboard</h2>
    <div className="flex items-center gap-4">
      <button className="relative p-2 text-gray-500 hover:text-gray-700">
        🔔<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>
      <span className="text-sm text-gray-600">Welcome, Admin</span>
      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">AD</div>
    </div>
  </div>
);
export default AdminNavbar;
