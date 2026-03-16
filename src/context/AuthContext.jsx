import React, { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => ({
    role:     localStorage.getItem("role")     || "guest",
    userName: localStorage.getItem("userName") || "Guest",
  }));

  // Call this from Login after a successful API response
  // login({ role: "personal", userName: "Arjun" })
  const login = useCallback(({ role, userName }) => {
    localStorage.setItem("role",     role);
    localStorage.setItem("userName", userName);
    setAuth({ role, userName });   // ← triggers re-render of UserShell → UserNavbar
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("firstName");
    setAuth({ role: "guest", userName: "Guest" });
  }, []);

  const setRole = useCallback((newRole) => {
    const userName = localStorage.getItem("userName") || "Guest";
    localStorage.setItem("role", newRole);
    setAuth({ role: newRole, userName });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
