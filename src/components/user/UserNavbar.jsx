import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export const UserNavbar = ({ role, setRole }) => {
  const location = useLocation();

  const navStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 30px",
    backgroundColor: "#1e293b",
    color: "white",
  };

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    margin: "0 12px",
    fontWeight: "500",
  };

  const activeStyle = {
    borderBottom: "2px solid #38bdf8",
  };

  const roleButton = (type) => ({
    padding: "6px 12px",
    margin: "0 5px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    backgroundColor: role === type ? "#38bdf8" : "#334155",
    color: "white",
  });

  return (
    <>
    <nav style={navStyle}>
      {/* Left side: Logo + Home + Profile */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2 style={{ margin: 0, marginRight: "20px",color:"red",fontWeight: "bold"}}>E-Auction</h2>

        <Link
          to="/"
          style={{
            ...linkStyle,
            ...(location.pathname === "/" && activeStyle),
          }}
        >
          Home
        </Link>

        <Link
          to="/profile"
          style={{
            ...linkStyle,
            ...(location.pathname === "/profile" && activeStyle),
          }}
        >
          Profile
        </Link>

        <Link
          to="/user/GetApiDemo"
          style={{
            ...linkStyle,
            ...(location.pathname === "/user/GetApiDemo" && activeStyle),
          }}
        >
          Get API Demo
        </Link>

        <Link
          to="/user/UseEffectDemo"
          style={{
            ...linkStyle,
            ...(location.pathname === "/user/UseEffectDemo" && activeStyle),
          }}
        >
          Get API Demo
        </Link>

      </div>

      {/* Right side: Role Switch + Logout */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <button style={roleButton("buyer")} onClick={() => setRole("buyer")}>
          Buyer
        </button>
        <button style={roleButton("seller")} onClick={() => setRole("seller")}>
          Seller
        </button>
       <button>
        <Link to="/" style={{ ...linkStyle, marginLeft: "20px" }}>
          Logout
        </Link>
        </button>
      </div>
    </nav>
    
      {/* 🔥 PAGE CONTENT HERE */}
      <div style={{ padding: "20px" }}>
        <Outlet />
        </div>
        </>
  );
};
