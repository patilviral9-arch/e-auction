import React from "react";
import { AdminSidebar } from "./Adminsidebar";


export const AdminLayout = ({ children }) => {
  return (
    <div className="flex">
      <AdminSidebar/>
      <div className="flex-1 p-8 bg-gray-100 min-h-screen">
        {children}
      </div>
    </div>
  );
};