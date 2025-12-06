import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // ✅


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, email, role }
  const [token, setToken] = useState(null);

  // تحميل التوكن من localStorage عند بداية التطبيق
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      try {
        const decoded = jwtDecode(savedToken);
        setUser({ id: decoded.id, email: decoded.email, role: decoded.role });
        setToken(savedToken);
      } catch {
        localStorage.removeItem("token");
      }
    }
  }, []);

  const login = (token) => {
    const decoded = jwtDecode(token);
    setUser({ id: decoded.id, email: decoded.email, role: decoded.role });
    setToken(token);

    localStorage.setItem("token", token);
    localStorage.setItem("token_expiry", Date.now() + 24 * 60 * 60 * 1000);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("token_expiry");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
