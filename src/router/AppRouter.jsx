import React from "react";
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";

import { Login }   from "../components/Login";
import { Signup }  from "../components/Signup";

import { UserNavbar }    from "../components/user/UserNavbar";
import { HomeComponent } from "../components/user/HomeComponent";

import AdminLayout from "../components/admin/AdminLayout";
import Dashboard   from "../components/admin/Dashboard";
import Settings    from "../components/admin/Settings";
import UsersList   from "../components/admin/Users/UsersList";
import BrowseAuctions  from "../components/user/BrowseAuctions";
import AddAuction      from "../components/user/AddAuction";
import PersonalProfile from "../components/user/PersonalProfile";
import BusinessProfile from "../components/user/BusinessProfile";

// ─────────────────────────────────────────────────────────────────────────────
// AppShell — wraps the entire app in AuthProvider INSIDE the router tree.
// This is the critical fix: AuthProvider must live inside RouterProvider
// so that useAuth() and useNavigate() share the same React context tree.
// ─────────────────────────────────────────────────────────────────────────────
function AppShell() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

function ProfileSwitch() {
  const { role } = useAuth();
  return role === "business" ? <BusinessProfile/> : <PersonalProfile />;
}

// ─────────────────────────────────────────────────────────────────────────────
// UserShell — reads live auth state from context.
// Re-renders automatically the moment login() / logout() is called.
// ─────────────────────────────────────────────────────────────────────────────
function UserShell() {
  const { role, userName, setRole, logout } = useAuth();
  
  return (
    <>
      <UserNavbar
        role={role}
        userName={userName}
        setRole={setRole}
        onLogout={logout}
      />
      {/* CRITICAL: This renders the HomeComponent or other children */}
      <Outlet /> 
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// Router — defined ONCE at module level (never recreated on re-render)
// ─────────────────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    // AppShell provides AuthContext to every route beneath it
    element: <AppShell />,
    children: [

      // ── Auth pages (no navbar)
      { path: "/login",  element: <Login /> },
      { path: "/Login",  element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/Signup", element: <Signup /> },

      // ── Admin (no UserNavbar)
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true,           element: <Dashboard /> },
          { path: "Users/UsersList",     element: <UsersList /> },
          { path: "settings",      element: <Settings /> },
        ],
      },

      // ── User-facing (with UserNavbar)
      {
        path: "/",
        element: <UserShell />,
        children: [
          { index: true,              element: <HomeComponent /> },

          // ── Browsing (shared)
          { path: "browse",           element: <BrowseAuctions /> },
          { path: "live",             element: <BrowseAuctions /> },
          { path: "my-bids",          element: <BrowseAuctions /> },
          { path: "watchlist",        element: <BrowseAuctions /> },
          { path: "category/:slug",   element: <BrowseAuctions /> },
          { path: "auction/:id",      element: <BrowseAuctions /> },

          // ── Business
          { path: "create-auction",   element: <AddAuction /> },

          // ── Profile: ProfileSwitch renders PersonalProfile or BusinessProfile by role
          // All these routes point to same ProfileSwitch so the right page always opens
          { path: "profile",          element: <ProfileSwitch /> },
          { path: "my-listings",      element: <ProfileSwitch /> },
          { path: "analytics",        element: <ProfileSwitch /> },
          { path: "payouts",          element: <ProfileSwitch /> },

          // ── Personal only
          { path: "won",              element: <PersonalProfile /> },
          { path: "payment-methods",  element: <PersonalProfile /> },

        ],
      },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

// ─────────────────────────────────────────────────────────────────────────────
const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
