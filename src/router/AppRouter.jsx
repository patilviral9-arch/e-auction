import React from "react";
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";

import { Login }   from "../components/Login";
import { Signup }  from "../components/Signup";

import { UserNavbar }    from "../components/user/UserNavbar";
import { HomeComponent } from "../components/user/HomeComponent";

import AdminLayout from "../components/admin/AdminLayout";
import Dashboard   from "../components/admin/Dashboard";
import Settings    from "../components/admin/Settings";
import Reports     from "../components/admin/Reports/Reports";
import UsersList   from "../components/admin/Users/UsersList";
import Auctions from "../components/admin/Auctions/Auctions";
import BidsList from "../components/admin/Bids/BidsList";
import Categories from "../components/admin/Categories/Categories";

import BrowseAuctions  from "../pages/BrowseAuctions";
import AddAuction      from "../components/user/Business/AddAuction";
import PersonalProfile from "../pages/PersonalProfile";
import BusinessProfile from "../pages/BusinessProfile";
import AuctionDetail   from "../pages/AuctionDetail";
import Listings        from "../components/user/Business/Listings";
import ProtectedRoutes from "../components/user/ProtectedRoutes";
import { Forgetpassword } from "../components/Forgetpassword";
import { Resetpassword } from "../components/Resetpassword";
import EditAuction from "../components/user/Business/EditAuction";
import MyWishlist from "../pages/MyWishlist";
import LiveAuctions from "../pages/LiveAuctions"
import MyBids from "../pages/MyBids"
import WonAuctions from "../pages/WonAuctions"
import Notifications from "../pages/Notifications";
import AboutUs from "../pages/AboutUs";
import Payouts from "../pages/Payouts";
import Wallet from "../pages/Wallet";
import BusinessAnalytics from "../pages/BusinessAnalytics";
import { useMaintenanceMode } from "../hooks/useMaintenanceMode";




function AppShell() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </ThemeProvider>
  );
}

function ProfileSwitch() {
  const { role } = useAuth();
  return role === "business" ? <BusinessProfile /> : <PersonalProfile />;
}

function UserShell() {
  const { role, userName, setRole, logout } = useAuth();
  const maintenanceMode = useMaintenanceMode();
  const blockUserContent = maintenanceMode && role !== "admin";

  return (
    <>
      <UserNavbar
        role={role}
        userName={userName}
        setRole={setRole}
        onLogout={logout}
        maintenanceMode={maintenanceMode}
      />
      {blockUserContent ? (
        <div
          style={{
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2.5rem, 7vw, 5rem)",
              lineHeight: 1.1,
              fontWeight: 800,
              color: "#f59e0b",
              letterSpacing: "0.01em",
            }}
          >
            Website is in Maintenance
          </h1>
        </div>
      ) : (
        <Outlet />
      )}
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/login",  element: <Login /> },
      { path: "/Login",  element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/Signup", element: <Signup /> },
      {path:"/forgotpassword",element:<Forgetpassword/>},
      {path:"/resetpassword/:token",element:<Resetpassword/>},

      {
        path: "/admin",
        element: <ProtectedRoutes userRoles={["admin"]}>
          <AdminLayout />
        </ProtectedRoutes>,
        children: [
          { index: true,               element: <Dashboard /> },
          { path: "Users/UsersList",   element: <UsersList /> },
          { path: "Auctions/Auctions", element: <Auctions/>},
          { path: "Categories/Categories", element: <Categories /> },
          { path: "bids",              element:<BidsList/>},
          { path: "reports",           element: <Reports /> },
          { path: "Reports/Reports",   element: <Reports /> },
          { path: "settings",          element: <Settings /> },
        ],
      },

      {
        path: "/",
        element: <UserShell />,
        children: [
          { index: true,             element: <HomeComponent /> },
          { path: "browse",          element: <BrowseAuctions /> },
          { path: "LiveAuctions",     element: <LiveAuctions/> },
          { path: "my-bids",         element: <ProtectedRoutes userRoles={["personal"]}><MyBids/> </ProtectedRoutes> },
          { path: "auction/:id",     element: <AuctionDetail /> },
          { path: "add-auction",     element:<ProtectedRoutes userRoles={["business"]}> <AddAuction /></ProtectedRoutes> },
          { path: "profile",         element: <ProfileSwitch /> },
          { path: "my-listings",     element: <ProfileSwitch /> },
          { path: "analytics",       element: <ProtectedRoutes userRoles={["business"]}><BusinessAnalytics /></ProtectedRoutes> },
          { path: "payouts",         element: <ProtectedRoutes userRoles={["business"]}><Payouts/></ProtectedRoutes> },
          { path: "won",             element:<ProtectedRoutes userRoles={["personal"]}> <WonAuctions/> </ProtectedRoutes> },
          { path: "wallet", element: <Wallet/> },
          { path: "business/Listings",  element:<ProtectedRoutes userRoles={["business"]}><Listings/></ProtectedRoutes> },
          { path: "/edit-auction/:id",  element:<ProtectedRoutes userRoles={["business"]}><EditAuction/></ProtectedRoutes>},
          { path: "MyWishlist", element:<MyWishlist/>},
          { path: "notifications", element: <Notifications />},
          { path: "aboutus", element: <AboutUs /> },
        ],
      },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

const AppRouter = () => <RouterProvider router={router} />;
export default AppRouter;
