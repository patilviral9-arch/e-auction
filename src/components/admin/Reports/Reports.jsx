import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const Reports = () => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
      <div className="flex gap-2">
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"><option>Last 30 days</option><option>Last 7 days</option><option>This year</option></select>
        <button className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Export PDF</button>
      </div>
    </div>
    <div className="grid grid-cols-4 gap-4 mb-6">
      {[['Gross Revenue','$94.2K','↑ 18% vs last month',true],['Platform Fees','$9.4K','↑ 18% vs last month',true],['Auctions Completed','312','↑ 24 this week',true],['New Registrations','348','↓ 6% vs last month',false]].map(([l,v,c,up]) => (
        <div key={l} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">{l}</p>
          <p className="text-3xl font-bold text-gray-800">{v}</p>
          <p className={"text-xs mt-1 " + (up ? 'text-green-600' : 'text-red-500')}>{c}</p>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Revenue — 2026</h3>
      <Line data={{ labels: ['Jan','Feb','Mar','Apr','May','Jun'], datasets: [
        { label:'Gross Revenue', data:[62000,71000,80000,75000,88000,94200], borderColor:'#4f46e5', backgroundColor:'rgba(79,70,229,0.08)', tension:.4, fill:true, pointRadius:3 },
        { label:'Platform Fee', data:[6200,7100,8000,7500,8800,9420], borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.07)', tension:.4, fill:true, pointRadius:3 },
      ]}} options={{ responsive:true, plugins:{ legend:{ position:'top', labels:{ font:{ size:11 } } } }, scales:{ y:{ ticks:{ callback: v => '$' + Math.round(v/1000) + 'k', font:{ size:10 } } }, x:{ ticks:{ font:{ size:10 } } } } }} />
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Categories by Bid Volume</h3>
      <Bar data={{ labels:['Art','Watches','Collectibles','Luxury','Instruments','Antiques'], datasets:[{ data:[4820,3940,2780,3100,1920,640], backgroundColor:'#4f46e5', borderRadius:4 }]}} options={{ indexAxis:'y', responsive:true, plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ font:{ size:10 } } }, y:{ ticks:{ font:{ size:11 } } } } }} />
    </div>
  </div>
);
export default Reports;
