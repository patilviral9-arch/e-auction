import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const Toggle = ({ on, onToggle }) => (
  <button 
    onClick={onToggle} 
    className={"relative w-10 h-6 rounded-full transition-colors " + (on ? 'bg-indigo-600' : 'bg-gray-300')}
  >
    <span className={"absolute top-1 w-4 h-4 bg-white rounded-full transition-all " + (on ? 'left-5' : 'left-1')}></span>
  </button>
);

const Settings = () => {
  // --- Platform State ---
  const [platform, setPlatform] = useState({ 
    name: 'E-Auction', 
    commission: '10%', 
    minBid: '$50' 
  });

  // --- Features & Theme State ---
  const [features, setFeatures] = useState({
    autoApprove: false,
    emailNotifications: true,
    proxyBidding: true,
    maintenanceMode: false,
    darkMode: localStorage.getItem('theme') === 'dark' // Check local storage on load
  });

  // Handle Theme Change
  useEffect(() => {
    if (features.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [features.darkMode]);

  const handlePlatformChange = k => e => setPlatform(p => ({ ...p, [k]: e.target.value }));
  
  const toggleFeature = (key) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // Here you would typically send an axios.put to your backend config
    Swal.fire({
      icon: 'success',
      title: 'Settings Saved',
      text: 'Platform configuration has been updated.',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>

      {/* Platform Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-4 transition-colors">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Platform</h3>
        {[
          ['Site Name', 'name', 'Displayed in browser title and emails'],
          ['Platform Commission', 'commission', 'Percentage taken from each sale'],
          ['Minimum Bid Increment', 'minBid', 'Minimum raise required per bid']
        ].map(([l, k, desc]) => (
          <div key={k} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{l}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <input 
              value={platform[k]} 
              onChange={handlePlatformChange(k)} 
              className="border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-1.5 text-sm text-right outline-none focus:border-indigo-400 w-32" 
            />
          </div>
        ))}
      </div>

      {/* Features & Theme Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6 transition-colors">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Appearance & Features</h3>
        
        {/* Theme Toggle */}
        <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Dark Mode</p>
            <p className="text-xs text-gray-400">Switch between light and dark visual themes</p>
          </div>
          <Toggle on={features.darkMode} onToggle={() => toggleFeature('darkMode')} />
        </div>

        {/* Other Features */}
        {[
          ['Auto-approve Auctions', 'autoApprove', 'Skip admin review for trusted sellers'],
          ['Email Notifications', 'emailNotifications', 'Outbid and winning alerts for users'],
          ['Proxy Bidding', 'proxyBidding', 'Allow users to set max automatic bids'],
          ['Maintenance Mode', 'maintenanceMode', 'Take the site offline for updates']
        ].map(([l, key, desc]) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{l}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <Toggle on={features[key]} onToggle={() => toggleFeature(key)} />
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700">Save Changes</button>
        <button className="border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Reset Defaults</button>
      </div>
    </div>
  );
};

export default Settings;