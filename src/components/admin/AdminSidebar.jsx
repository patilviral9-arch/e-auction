import React from "react";
import {
  LayoutDashboard,
  Users,
  Gavel,
  Package,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { Outlet } from "react-router-dom";

export const AdminSidebar = () => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-[#0f172a] text-white flex flex-col shadow-2xl">
        
        {/* Logo Section */}
        <div className="p-6 text-2xl font-bold border-b border-slate-700">
          E-Auction Admin
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} text="Dashboard" active />
          <SidebarItem icon={<Users size={20} />} text="Users" />
          <SidebarItem icon={<Gavel size={20} />} text="Auctions" />
          <SidebarItem icon={<Package size={20} />} text="Products" />
          <SidebarItem icon={<BarChart3 size={20} />} text="Reports" />
          <SidebarItem icon={<Settings size={20} />} text="Settings" />
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button className="flex items-center gap-3 w-full px-4 py-2 rounded-lg hover:bg-red-500 transition duration-300">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

/* Sidebar Item Component */
const SidebarItem = ({ icon, text, active }) => {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition duration-300
      ${active ? "bg-red-500" : "hover:bg-slate-700"}`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
};
