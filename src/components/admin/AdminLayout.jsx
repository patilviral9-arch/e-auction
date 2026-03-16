import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => {
  return (
    <div className="flex bg-gray-100 min-h-screen">

      <AdminSidebar />

        <div className="p-6">
          <Outlet />
        </div>

    </div>
  );
};

export default AdminLayout;