import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddUser = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'Bidder', phone:'', status:'Active' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    alert('User created: ' + form.name);
    navigate('/admin/users');
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/users')} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">← Back</button>
        <h1 className="text-2xl font-bold text-gray-800">Add New User</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[['Full Name','name','text','e.g. John Smith'],['Email Address','email','email','user@email.com'],['Password','password','password','Min 8 characters'],['Phone (optional)','phone','tel','+91 98765 43210']].map(([label,key,type,ph]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                <input type={type} placeholder={ph} value={form[key]} onChange={set(key)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
              <select value={form.role} onChange={set('role')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {['Bidder','Seller','Admin'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={set('status')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {['Active','Pending','Banned'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700">Create User</button>
            <button type="button" onClick={() => navigate('/admin/users')} className="border border-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddUser;
