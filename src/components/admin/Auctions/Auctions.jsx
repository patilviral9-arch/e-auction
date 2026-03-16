import React, { useState } from 'react';

const initial = [
  { id:'#4820', item:'Vintage Rolex GMT-Master', seller:'Arjun M.', category:'Watches', startBid:'$2,000', currentBid:'$4,200', bids:28, ends:'2h 14m', status:'Live' },
  { id:'#4819', item:'Abstract Oil Painting', seller:'Liu Y.', category:'Art', startBid:'$500', currentBid:'$850', bids:11, ends:'5h 02m', status:'Live' },
  { id:'#4818', item:'1967 Fender Stratocaster', seller:'Tom W.', category:'Instruments', startBid:'$5,000', currentBid:'$7,600', bids:43, ends:'—', status:'Closed' },
  { id:'#4821', item:'Rare Stamp Collection', seller:'Sarah K.', category:'Collectibles', startBid:'$300', currentBid:'—', bids:0, ends:'Mar 17', status:'Pending' },
  { id:'#4817', item:'Louis Vuitton Trunk', seller:'Priya N.', category:'Luxury', startBid:'$1,500', currentBid:'$3,100', bids:19, ends:'1h 58m', status:'Live' },
];
const statusCls = { Live:'bg-blue-100 text-blue-700', Closed:'bg-gray-100 text-gray-600', Pending:'bg-yellow-100 text-yellow-700', Cancelled:'bg-red-100 text-red-700' };

const Auctions = () => {
  const [auctions, setAuctions] = useState(initial);
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = auctions.filter(a => statusFilter === 'All' || a.status === statusFilter);
  const updateStatus = (id, s) => setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: s } : a));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Auctions</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">+ New Auction</button>
      </div>
      <div className="flex gap-3 mb-4">
        <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Search auctions..." />
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {['All','Live','Pending','Closed','Cancelled'].map(o => <option key={o} value={o}>{o === 'All' ? 'All Status' : o}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
          {['All Categories','Watches','Art','Instruments','Collectibles','Luxury'].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['Lot #','Item','Seller','Category','Start Bid','Current Bid','Bids','Ends','Status','Actions'].map(h=><th key={h} className="px-3 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-3 py-3 text-gray-500 font-mono">{a.id}</td>
                <td className="px-3 py-3 font-medium text-gray-800">{a.item}</td>
                <td className="px-3 py-3 text-gray-600">{a.seller}</td>
                <td className="px-3 py-3 text-gray-500">{a.category}</td>
                <td className="px-3 py-3 text-gray-600">{a.startBid}</td>
                <td className="px-3 py-3 font-semibold text-gray-800">{a.currentBid}</td>
                <td className="px-3 py-3 text-gray-600">{a.bids}</td>
                <td className="px-3 py-3 text-gray-500">{a.ends}</td>
                <td className="px-3 py-3"><span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (statusCls[a.status] || '')}>{a.status}</span></td>
                <td className="px-3 py-3 flex gap-1">
                  <button className="text-xs border border-gray-200 rounded px-2 py-1 hover:bg-gray-100">View</button>
                  {a.status === 'Live' && <button onClick={() => updateStatus(a.id,'Closed')} className="text-xs border border-red-200 text-red-600 rounded px-2 py-1 hover:bg-red-50">End</button>}
                  {a.status === 'Pending' && <><button onClick={() => updateStatus(a.id,'Live')} className="text-xs border border-green-200 text-green-600 rounded px-2 py-1 hover:bg-green-50">Approve</button><button onClick={() => updateStatus(a.id,'Cancelled')} className="text-xs border border-red-200 text-red-600 rounded px-2 py-1 hover:bg-red-50">Reject</button></>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Auctions;
