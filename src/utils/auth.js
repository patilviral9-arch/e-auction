// Authentication utilities for E-Auction Admin & Users

// Save login session
export const setAuthSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

// Get token
export const getToken = () => {
  return localStorage.getItem("token");
};

// Get logged in user
export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// Check if user is logged in
export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// Logout user
export const clearAuthSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// Check if admin
export const isAdmin = () => {
  const user = getUser();
  return user && user.role === "admin";
};