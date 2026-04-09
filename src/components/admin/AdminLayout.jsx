import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

const MOBILE_BREAKPOINT = 1024;

const AdminLayout = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_BREAKPOINT : false
  );
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth > MOBILE_BREAKPOINT : true
  );

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);
  const openSidebar = () => setSidebarOpen(true);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        background: "#0f172a",
        position: "relative",
      }}
    >
      {isMobile && !sidebarOpen && (
        <button
          onClick={openSidebar}
          style={{
            position: "fixed",
            top: "12px",
            left: "12px",
            zIndex: 2200,
            border: "1px solid #334155",
            borderRadius: "10px",
            background: "#0f172a",
            color: "#f1f5f9",
            padding: "8px 12px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(0,0,0,0.28)",
          }}
        >
          Menu
        </button>
      )}

      {isMobile && sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={closeSidebar}
          style={{
            position: "fixed",
            inset: 0,
            border: "none",
            background: "rgba(0,0,0,0.42)",
            zIndex: 1999,
            cursor: "pointer",
          }}
        />
      )}

      {/* data-asb-root: isolates sidebar from ALL global theme CSS rules */}
      <div
        data-asb-root
        style={
          isMobile
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                height: "100vh",
                zIndex: 2100,
                transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 0.25s ease",
              }
            : { flexShrink: 0 }
        }
      >
        <AdminSidebar
          isMobile={isMobile}
          onNavigate={isMobile ? closeSidebar : undefined}
          onRequestClose={isMobile ? closeSidebar : undefined}
        />
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          padding: isMobile ? "68px 12px 16px" : "24px",
          background: "#ffffff",
          color: "#0f172a",
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
