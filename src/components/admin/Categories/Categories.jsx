import React, { useState } from 'react';

const initCats = [
  { id:1, name:'Watches', auctions:84, active:22, status:'Active' },
  { id:2, name:'Art', auctions:131, active:38, status:'Active' },
  { id:3, name:'Collectibles', auctions:97, active:14, status:'Active' },
  { id:4, name:'Instruments', auctions:52, active:9, status:'Active' },
  { id:5, name:'Luxury', auctions:76, active:31, status:'Active' },
  { id:6, name:'Antiques', auctions:44, active:0, status:'Inactive' },
];

const Categories = () => {
  const [cats, setCats] = useState(initCats);
  const [form, setForm] = useState({ name:'', description:'', status:'Active' });
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const save = () => {
    if (!form.name) return;
    setCats(prev => [...prev, { id: Date.now(), name: form.name, auctions:0, active:0, status: form.status }]);
    setForm({ name:'', description:'', status:'Active' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['Category','Auctions','Active','Status','Actions'].map(h=><th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.auctions}</td>
                  <td className="px-4 py-3 text-gray-600">{c.active}</td>
                  <td className="px-4 py-3"><span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (c.status==='Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>{c.status}</span></td>
                  <td className="px-4 py-3"><button className="text-xs border border-gray-200 rounded px-2 py-1 hover:bg-gray-100">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Add Category</h3>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-gray-500 block mb-1">Category Name</label><input value={form.name} onChange={set('name')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="e.g. Rare Books" /></div>
            <div><label className="text-xs font-medium text-gray-500 block mb-1">Description</label><textarea value={form.description} onChange={set('description')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 resize-none" rows={3} placeholder="Short description..." /></div>
            <div><label className="text-xs font-medium text-gray-500 block mb-1">Status</label><select value={form.status} onChange={set('status')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"><option>Active</option><option>Inactive</option></select></div>
            <div className="flex gap-2 pt-1"><button onClick={save} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Save</button><button onClick={() => setForm({ name:'',description:'',status:'Active' })} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button></div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Categories;
