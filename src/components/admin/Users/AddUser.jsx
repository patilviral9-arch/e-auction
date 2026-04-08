import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const AddUser = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: "personal",
    status: "active",
    firstName: "",
    lastName: "",
    businessName: "",
    email: "",
    password: "",
    phone: "",
  });

  const isBusiness = form.role === "business";
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      Swal.fire("Required", "Email and password are required.", "warning");
      return;
    }

    if (isBusiness && !form.businessName.trim()) {
      Swal.fire("Required", "Business name is required.", "warning");
      return;
    }

    if (!isBusiness && !form.firstName.trim()) {
      Swal.fire("Required", "First name is required.", "warning");
      return;
    }

    const payload = {
      role: form.role,
      status: form.status,
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
    };

    if (isBusiness) {
      payload.businessName = form.businessName.trim();
    } else {
      payload.firstName = form.firstName.trim();
      payload.lastName = form.lastName.trim();
    }

    try {
      const res = await axios.post("http://localhost:3000/user/register", payload);
      if (res.status === 201 || res.status === 200) {
        await Swal.fire("Created", "User added successfully.", "success");
        navigate("/admin/Users/UsersList");
      }
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to create user.", "error");
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/admin/Users/UsersList")}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg"
        >
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Add New User</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {!isBusiness ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    placeholder="John"
                    value={form.firstName}
                    onChange={set("firstName")}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={set("lastName")}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  />
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Business Name</label>
                <input
                  type="text"
                  placeholder="Legal Company Name"
                  value={form.businessName}
                  onChange={set("businessName")}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="user@email.com"
                value={form.email}
                onChange={set("email")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
              <input
                type="password"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={set("password")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone (optional)</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={set("phone")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
              <select
                value={form.role}
                onChange={set("role")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                {["personal", "business", "admin"].map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={set("status")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                {["active", "deactive", "suspended"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700"
            >
              Create User
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/Users/UsersList")}
              className="border border-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;
