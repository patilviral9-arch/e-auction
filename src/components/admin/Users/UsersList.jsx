import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const statusStyle = {
  active: "bg-green-100 text-green-700",
  deactive: "bg-gray-200 text-gray-700",
  suspended: "bg-red-100 text-red-700",
};

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "inactive" || value === "deactive") return "deactive";
  if (value === "blocked" || value === "suspended") return "suspended";
  if (value === "active") return "active";
  return value;
};

const uiToApiStatus = (status) => {
  if (status === "deactive") return "inactive";
  if (status === "suspended") return "blocked";
  return status;
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
      const normalized = Array.isArray(data)
        ? data.map((user) => ({ ...user, status: normalizeStatus(user.status) }))
        : [];
      setUsers(normalized);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    const { value: formValues } = await Swal.fire({
      title:
        '<div style="font-weight:800;font-size:32px;color:#1e293b;padding-top:15px;">Create Account</div>',
      width: "650px",
      padding: "2.5em",
      background: "#ffffff",
      html: `
        <div style="padding: 0 10px;">
          <div style="display:flex;background:#f8fafc;border-radius:16px;padding:6px;margin-bottom:35px;border:1px solid #e2e8f0;box-shadow:inset 0 2px 4px rgba(0,0,0,0.02);">
            <button id="btn-personal" type="button" style="flex:1;padding:16px;border:none;border-radius:12px;cursor:pointer;font-size:18px;font-weight:700;transition:all 0.2s ease;background:linear-gradient(135deg,#312e81,#4338ca);color:#f8fafc;">Personal</button>
            <button id="btn-business" type="button" style="flex:1;padding:16px;border:none;border-radius:12px;cursor:pointer;font-size:18px;font-weight:700;transition:all 0.2s ease;background:transparent;color:#475569;">Business</button>
            <button id="btn-admin" type="button" style="flex:1;padding:16px;border:none;border-radius:12px;cursor:pointer;font-size:18px;font-weight:700;transition:all 0.2s ease;background:transparent;color:#475569;">Admin</button>
          </div>

          <input type="hidden" id="swal-role" value="personal">

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:25px;text-align:left;">
            <div id="name-fields-container" style="grid-column:span 2;display:grid;grid-template-columns:1fr 1fr;gap:20px;">
              <div>
                <label style="display:block;font-size:14px;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:10px;letter-spacing:1px;">First Name</label>
                <input id="swal-first" class="swal2-input" style="width:100%;margin:0;height:60px;border-radius:12px;font-size:18px;border:2px solid #e2e8f0;" placeholder="John">
              </div>
              <div>
                <label style="display:block;font-size:14px;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:10px;letter-spacing:1px;">Last Name</label>
                <input id="swal-last" class="swal2-input" style="width:100%;margin:0;height:60px;border-radius:12px;font-size:18px;border:2px solid #e2e8f0;" placeholder="Doe">
              </div>
            </div>

            <div id="business-field-container" style="grid-column:span 2;display:none;">
              <label style="display:block;font-size:14px;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:10px;letter-spacing:1px;">Business Name</label>
              <input id="swal-business" class="swal2-input" style="width:100%;margin:0;height:60px;border-radius:12px;font-size:18px;border:2px solid #e2e8f0;" placeholder="Legal Company Name">
            </div>

            <div style="grid-column:span 2;">
              <label style="display:block;font-size:14px;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:10px;letter-spacing:1px;">Email Address</label>
              <input id="swal-email" type="email" class="swal2-input" style="width:100%;margin:0;height:60px;border-radius:12px;font-size:18px;border:2px solid #e2e8f0;" placeholder="name@email.com">
            </div>

            <div style="grid-column:span 2;">
              <label style="display:block;font-size:14px;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:10px;letter-spacing:1px;">Password</label>
              <input id="swal-pass" type="password" class="swal2-input" style="width:100%;margin:0;height:60px;border-radius:12px;font-size:18px;border:2px solid #e2e8f0;" placeholder="************">
            </div>
          </div>
        </div>
      `,
      didOpen: () => {
        const btns = {
          personal: document.getElementById("btn-personal"),
          business: document.getElementById("btn-business"),
          admin: document.getElementById("btn-admin"),
        };
        const roleInput = document.getElementById("swal-role");
        const nameFields = document.getElementById("name-fields-container");
        const businessFields = document.getElementById("business-field-container");

        const setButtonStyle = (button, isActive) => {
          if (!button) return;
          if (isActive) {
            button.style.setProperty(
              "background",
              "linear-gradient(135deg,#312e81,#4338ca)",
              "important"
            );
            button.style.setProperty("color", "#f8fafc", "important");
            button.style.setProperty(
              "box-shadow",
              "0 6px 16px rgba(67,56,202,0.28)",
              "important"
            );
          } else {
            button.style.setProperty("background", "transparent", "important");
            button.style.setProperty("color", "#475569", "important");
            button.style.setProperty("box-shadow", "none", "important");
          }
        };

        const updateUI = (activeRole) => {
          roleInput.value = activeRole;
          Object.entries(btns).forEach(([role, button]) => {
            setButtonStyle(button, role === activeRole);
          });

          if (activeRole === "business") {
            nameFields.style.display = "none";
            businessFields.style.display = "block";
          } else {
            nameFields.style.display = "grid";
            businessFields.style.display = "none";
          }
        };

        btns.personal?.addEventListener("click", () => updateUI("personal"));
        btns.business?.addEventListener("click", () => updateUI("business"));
        btns.admin?.addEventListener("click", () => updateUI("admin"));
      },
      confirmButtonText: "Register User",
      confirmButtonColor: "#4f46e5",
      showCancelButton: true,
      preConfirm: () => {
        const role = document.getElementById("swal-role").value;
        const email = document.getElementById("swal-email").value.trim();
        const password = document.getElementById("swal-pass").value;
        const firstName = document.getElementById("swal-first").value.trim();
        const lastName = document.getElementById("swal-last").value.trim();
        const businessName = document.getElementById("swal-business").value.trim();

        if (!email || !password) {
          return Swal.showValidationMessage("Email and password are required");
        }

        const payload = { role, email, password, status: "active" };

        if (role === "business") {
          if (!businessName) {
            return Swal.showValidationMessage("Business name is required");
          }
          payload.businessName = businessName;
        } else {
          if (!firstName) {
            return Swal.showValidationMessage("First name is required");
          }
          payload.firstName = firstName;
          payload.lastName = lastName;
        }

        return payload;
      },
    });

    if (formValues) {
      try {
        const res = await axios.post("http://localhost:3000/user/register", formValues);
        if (res.status === 201 || res.status === 200) {
          Swal.fire({
            icon: "success",
            title: "User Created",
            showConfirmButton: false,
            timer: 1500,
          });
          fetchUsers();
        }
      } catch (err) {
        Swal.fire("Error", err.response?.data?.message || "Registration failed", "error");
      }
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await axios.put(`http://localhost:3000/user/updateuser/${id}`, {
        status: uiToApiStatus(newStatus),
      });

      if (res.status === 200) {
        const updatedStatus = normalizeStatus(res.data?.data?.status || newStatus);
        setUsers((prev) =>
          prev.map((user) => (user._id === id ? { ...user, status: updatedStatus } : user))
        );
        setDropdown(null);
        Swal.fire({
          icon: "success",
          title: "Updated!",
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    } catch (err) {
      Swal.fire("Error", "Could not update status.", "error");
    }
  };

  const deleteUser = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/user/deleteuser/${id}`);
        setUsers((prev) => prev.filter((user) => user._id !== id));
        Swal.fire("Deleted!", "", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete user.", "error");
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    const name =
      user.role === "business"
        ? (user.businessName || user.firstName || "").toLowerCase()
        : `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();

    const matchSearch =
      name.includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || user.role === roleFilter;
    const matchStatus =
      statusFilter === "All" || normalizeStatus(user.status) === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">User Management</h1>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 mb-6 sm:mb-8">
        <input
          type="text"
          placeholder="Search users..."
          className="w-full flex-1 border border-black rounded-lg px-4 py-2.5 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full lg:w-auto border border-black rounded-lg px-4 py-2.5 bg-white outline-none"
        >
          <option value="All">All Roles</option>
          <option value="personal">Personal</option>
          <option value="business">Business</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full lg:w-auto border border-black rounded-lg px-4 py-2.5 bg-white outline-none"
        >
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="deactive">Deactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          onClick={handleAddUser}
          className="w-full lg:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 whitespace-nowrap"
        >
          + Add User
        </button>
      </div>

      <div className="bg-white rounded-[20px] border border-black overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-black">
            <tr className="text-left text-gray-500 font-bold uppercase tracking-wider">
              <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">User</th>
              <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">Email</th>
              <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">Role</th>
              <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-center">Status</th>
              <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 sm:px-6 lg:px-8 py-10 text-center text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 font-bold text-gray-900 text-base">
                    {user.role === "business"
                      ? user.businessName || user.firstName || "-"
                      : `${user.firstName || ""} ${user.lastName || ""}`.trim() || "-"}
                  </td>
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-gray-500 text-base">{user.email}</td>
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-gray-700 capitalize">{user.role}</td>
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-center">
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold inline-block ${
                        statusStyle[normalizeStatus(user.status)] || "bg-gray-100"
                      }`}
                    >
                      {normalizeStatus(user.status)}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                    <div className="flex justify-center gap-3">
                      <div className="relative">
                        <button
                          onClick={() => setDropdown(dropdown === user._id ? null : user._id)}
                          className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded text-xs hover:bg-indigo-100 transition-colors"
                        >
                          Change Status
                        </button>
                        {dropdown === user._id && (
                          <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                            {["active", "deactive", "suspended"].map((status) => (
                              <button
                                key={status}
                                onClick={() => updateStatus(user._id, status)}
                                className="block px-4 py-2 hover:bg-gray-100 w-full text-left capitalize text-xs text-gray-700"
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteUser(user._id)}
                        className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default UsersList;
