import React from 'react';

const bids = [
  { id:'#B9921', bidder:'Liu Y.', auction:'Vintage Rolex GMT', amount:'$4,200', prev:'$4,050', inc:'+$150', time:'10:42 AM', status:'Winning' },
  { id:'#B9920', bidder:'Sarah K.', auction:'Vintage Rolex GMT', amount:'$4,050', prev:'$3,900', inc:'+$150', time:'10:38 AM', status:'Outbid' },
  { id:'#B9919', bidder:'Tom W.', auction:'Fender Stratocaster', amount:'$7,600', prev:'$7,200', inc:'+$400', time:'9:55 AM', status:'Won' },
  { id:'#B9918', bidder:'Arjun M.', auction:'Abstract Painting', amount:'$850', prev:'$700', inc:'+$150', time:'9:31 AM', status:'Winning' },
  { id:'#B9917', bidder:'Priya N.', auction:'LV Trunk', amount:'$3,100', prev:'$2,900', inc:'+$200', time:'9:14 AM', status:'Winning' },
];
const statusCls = { Winning:'bg-green-100 text-green-700', Outbid:'bg-gray-100 text-gray-500', Won:'bg-blue-100 text-blue-700' };

const Bids = () => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800">Bid History</h1>
      <div className="flex gap-2">
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"><option>All Auctions</option><option>Vintage Rolex GMT</option><option>Fender Stratocaster</option></select>
        <button className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Export CSV</button>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[['Total Bids Today','560'],['Avg Bid Increment','$187'],['Highest Bid (Today)','$7,600']].map(([l,v]) => (
        <div key={l} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">{l}</p>
          <p className="text-3xl font-bold text-gray-800">{v}</p>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50"><tr>{['Bid #','Bidder','Auction','Amount','Previous','Increment','Time','Status'].map(h=><th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>)}</tr></thead>
        <tbody>
          {bids.map(b => (
            <tr key={b.id} className="border-t border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-gray-500">{b.id}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{b.bidder}</td>
              <td className="px-4 py-3 text-gray-600">{b.auction}</td>
              <td className="px-4 py-3 font-semibold text-gray-800">{b.amount}</td>
              <td className="px-4 py-3 text-gray-500">{b.prev}</td>
              <td className="px-4 py-3 text-green-600 font-medium">{b.inc}</td>
              <td className="px-4 py-3 text-gray-500">{b.time}</td>
              <td className="px-4 py-3"><span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (statusCls[b.status] || '')}>{b.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
export default Bids;
