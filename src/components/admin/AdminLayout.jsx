import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>

      {/* data-asb-root: isolates sidebar from ALL global theme CSS rules */}
      <div data-asb-root style={{ flexShrink: 0 }}>
        <AdminSidebar />
      </div>

      <div style={{ flex: 1, padding: '24px', background: '#ffffff', color: '#0f172a', overflowY: 'auto' }}>
        <Outlet />
      </div>

    </div>
  );
};

export default AdminLayout;
