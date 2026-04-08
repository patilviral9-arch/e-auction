import React, { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

// ── Decode JWT payload without any library ───────────────────────────────────
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function resolveUserFromPayload(payload) {
  if (!payload) return { userName: "Guest", userEmail: "", userId: null, avatar: null };
  const userName =
    payload.businessName
      ? payload.businessName
      : ((payload.firstName || "") + " " + (payload.lastName || "")).trim() ||
        payload.userName ||
        "Guest";
  return {
    userName,
    userEmail: payload.email  || "",
    userId:    payload._id    || payload.id || payload.userId || null,
    avatar:    payload.avatar || null,
  };
}

// ── Initialise state from token + persisted avatar ───────────────────────────
function initAuth() {
  const token = sessionStorage.getItem("token");
  const role  = sessionStorage.getItem("role") || "guest";
  if (!token) return { role: "guest", userName: "Guest", userEmail: "", userId: null, avatar: null };

  const payload  = parseJwt(token);
  const userData = resolveUserFromPayload(payload);

  // FIX: If the JWT doesn't have an avatar (uploaded after login),
  // fall back to the URL we saved manually in sessionStorage.
  if (!userData.avatar) {
    const persistedAvatar = sessionStorage.getItem("avatar");
    if (persistedAvatar) userData.avatar = persistedAvatar;
  }

  return { role, ...userData };
}

// ────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(initAuth);

  // Called from Login after a successful API response.
  const login = useCallback((token, role) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("role",  role);

    const payload  = parseJwt(token);
    const userData = resolveUserFromPayload(payload);

    // If the JWT already has an avatar, persist it too
    if (userData.avatar) {
      sessionStorage.setItem("avatar", userData.avatar);
    } else {
      // Clear any stale avatar from a previous account
      sessionStorage.removeItem("avatar");
    }

    setAuth({ role, ...userData });

    // Avatar edge-case: if the JWT doesn't carry avatar, fetch it once
    if (!userData.avatar && userData.userId) {
      fetch(`http://localhost:3000/user/getuser/${userData.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const url = data?.data?.avatar;
          if (url) {
            // FIX: persist the fetched avatar too
            sessionStorage.setItem("avatar", url);
            setAuth(prev => ({ ...prev, avatar: url }));
          }
        })
        .catch(() => {});
    }
  }, []);

  // Called after a successful avatar upload from profile pages
  const setAvatar = useCallback((url) => {
    // FIX: persist the new avatar URL so it survives a page refresh
    if (url) {
      sessionStorage.setItem("avatar", url);
    } else {
      sessionStorage.removeItem("avatar");
    }
    setAuth(prev => ({ ...prev, avatar: url || null }));
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("avatar"); // FIX: clear avatar on logout
    setAuth({ role: "guest", userName: "Guest", userEmail: "", userId: null, avatar: null });
  }, []);

  // Still exported so existing consumers don't break
  const setRole = useCallback((newRole) => {
    sessionStorage.setItem("role", newRole);
    setAuth(prev => ({ ...prev, role: newRole }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, setRole, setAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
