import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from 'sweetalert2';

const statusStyle = {
  active: "bg-green-100 text-green-700",
  deactive: "bg-gray-200 text-gray-700",
  suspended: "bg-red-100 text-red-700",
};

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [dropdown, setDropdown] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:3000/user/getusers");
      const data = res.data?.users || res.data?.data || res.data || [];
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
  const { value: formValues } = await Swal.fire({
    title: '<div style="font-weight: 800; font-size: 32px; color: #1e293b; padding-top: 15px;">Create Account</div>',
    width: '650px',
    padding: '2.5em',
    background: '#ffffff',
    html: `
      <div style="padding: 0 10px;">
        
        <div style="display: flex; background: #f8fafc; border-radius: 16px; padding: 6px; margin-bottom: 35px; border: 1px solid #e2e8f0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
          <button id="btn-personal" type="button" style="flex: 1; padding: 16px; border: none; border-radius: 12px; cursor: pointer; font-size: 18px; font-weight: 700; transition: all 0.2s ease; background: #1e293b; color: white;">Personal</button>
          <button id="btn-business" type="button" style="flex: 1; padding: 16px; border: none; border-radius: 12px; cursor: pointer; font-size: 18px; font-weight: 700; transition: all 0.2s ease; background: transparent; color: #64748b;">Business</button>
          <button id="btn-admin" type="button" style="flex: 1; padding: 16px; border: none; border-radius: 12px; cursor: pointer; font-size: 18px; font-weight: 700; transition: all 0.2s ease; background: transparent; color: #64748b;">Admin</button>
        </div>

        <input type="hidden" id="swal-role" value="personal">

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; text-align: left;">
          
          <div id="name-fields-container" style="grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
             <div style="grid-column: span 1;">
              <label style="display: block; font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">First Name</label>
              <input id="swal-first" class="swal2-input" style="width: 100%; margin: 0; height: 60px; border-radius: 12px; font-size: 18px; border: 2px solid #e2e8f0;" placeholder="John">
            </div>
            <div style="grid-column: span 1;">
              <label style="display: block; font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Last Name</label>
              <input id="swal-last" class="swal2-input" style="width: 100%; margin: 0; height: 60px; border-radius: 12px; font-size: 18px; border: 2px solid #e2e8f0;" placeholder="Doe">
            </div>
          </div>

          <div id="business-field-container" style="grid-column: span 2; display: none;">
            <label style="display: block; font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Business Name</label>
            <input id="swal-business" class="swal2-input" style="width: 100%; margin: 0; height: 60px; border-radius: 12px; font-size: 18px; border: 2px solid #e2e8f0;" placeholder="Legal Company Name">
          </div>

          <div style="grid-column: span 2;">
            <label style="display: block; font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Email Address</label>
            <input id="swal-email" type="email" class="swal2-input" style="width: 100%; margin: 0; height: 60px; border-radius: 12px; font-size: 18px; border: 2px solid #e2e8f0;" placeholder="name@email.com">
          </div>

          <div style="grid-column: span 2;">
            <label style="display: block; font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Password</label>
            <input id="swal-pass" type="password" class="swal2-input" style="width: 100%; margin: 0; height: 60px; border-radius: 12px; font-size: 18px; border: 2px solid #e2e8f0;" placeholder="••••••••••••">
          </div>

        </div>
      </div>
    `,
    didOpen: () => {
      const btns = {
        personal: document.getElementById('btn-personal'),
        business: document.getElementById('btn-business'),
        admin: document.getElementById('btn-admin')
      };
      const roleInput = document.getElementById('swal-role');
      const nameFields = document.getElementById('name-fields-container');
      const businessFields = document.getElementById('business-field-container');

      const updateUI = (activeRole) => {
        roleInput.value = activeRole;
        // Reset and set button styles
        Object.values(btns).forEach(btn => {
          btn.style.background = 'transparent';
          btn.style.color = '#64748b';
        });
        btns[activeRole].style.background = '#1e293b';
        btns[activeRole].style.color = 'white';

        // Toggle field visibility
        if (activeRole === 'business') {
          nameFields.style.display = 'none';
          businessFields.style.display = 'block';
        } else {
          nameFields.style.display = 'grid';
          businessFields.style.display = 'none';
        }
      };

      btns.personal.addEventListener('click', () => updateUI('personal'));
      btns.business.addEventListener('click', () => updateUI('business'));
      btns.admin.addEventListener('click', () => updateUI('admin'));
    },
    confirmButtonText: 'Register User',
    confirmButtonColor: '#4f46e5',
    showCancelButton: true,
    preConfirm: () => {
      const role = document.getElementById('swal-role').value;
      const email = document.getElementById('swal-email').value;
      const password = document.getElementById('swal-pass').value;

      if (!email || !password) return Swal.showValidationMessage('Required fields missing');

      const payload = { role, email, password, status: 'active' };

      if (role === 'business') {
        payload.firstName = document.getElementById('swal-business').value;
        payload.lastName = "";
      } else {
        payload.firstName = document.getElementById('swal-first').value;
        payload.lastName = document.getElementById('swal-last').value;
      }
      return payload;
    }
  });

  if (formValues) {
    try {
      const res = await axios.post("http://localhost:3000/user/register", formValues);
      if (res.status === 201 || res.status === 200) {
        Swal.fire({ icon: 'success', title: 'User Created', showConfirmButton: false, timer: 1500 });
        fetchUsers();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Registration failed', 'error');
    }
  }
};

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await axios.put(`http://localhost:3000/user/updateuser/${id}`, {
        status: newStatus,
      });

      if (res.status === 200) {
        setUsers((prev) =>
          prev.map((u) => (u._id === id ? { ...u, status: newStatus } : u))
        );
        setDropdown(null);
        Swal.fire({
          icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end'
        });
      }
    } catch (err) {
      Swal.fire('Error', 'Could not update status.', 'error');
    }
  };

  const deleteUser = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/user/deleteuser/${id}`);
        setUsers((prev) => prev.filter((u) => u._id !== id));
        Swal.fire('Deleted!', '', 'success');
      } catch (err) {
        Swal.fire('Error', 'Failed to delete user.', 'error');
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    const matchStatus = statusFilter === "All" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">User Management</h1>

      {/* Filter Row */}
      <div className="flex items-center gap-4 mb-8">
        <input
          type="text"
          placeholder="Search users..."
          className="flex-1 border border-black rounded-lg px-4 py-2.5 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border border-black rounded-lg px-4 py-2.5 bg-white outline-none">
          <option value="All">All Roles</option>
          <option value="personal">Personal</option>
          <option value="business">Business</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-black rounded-lg px-4 py-2.5 bg-white outline-none">
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="deactive">Deactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <button onClick={handleAddUser} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 whitespace-nowrap">
          + Add User
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[20px] border border-black overflow-visible shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-black">
            <tr className="text-left text-gray-500 font-bold uppercase tracking-wider">
              <th className="px-8 py-5">User</th>
              <th className="px-8 py-5">Email</th>
              <th className="px-8 py-5">Role</th>
              <th className="px-8 py-5 text-center">Status</th>
              <th className="px-8 py-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {filteredUsers.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5 font-bold text-gray-900 text-base">{u.firstName} {u.lastName}</td>
                <td className="px-8 py-5 text-gray-500 text-base">{u.email}</td>
                <td className="px-8 py-5 text-gray-700 capitalize">{u.role}</td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold inline-block ${statusStyle[u.status] || "bg-gray-100"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex justify-center gap-3">
                    <div className="relative">
                      <button 
                        onClick={() => setDropdown(dropdown === u._id ? null : u._id)} 
                        className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded text-xs hover:bg-indigo-100 transition-colors"
                      >
                        Change Status
                      </button>
                      {dropdown === u._id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                          {['active', 'deactive', 'suspended'].map((s) => (
                            <button key={s} onClick={() => updateStatus(u._id, s)} className="block px-4 py-2 hover:bg-gray-100 w-full text-left capitalize text-xs text-gray-700">
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => deleteUser(u._id)} 
                      className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;