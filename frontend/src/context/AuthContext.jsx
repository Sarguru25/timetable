import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        // Verify token with backend
        const response = await api.get("/auth/me");
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          logout();
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user: userData, token } = response.data;

      setUser(userData);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      return { success: false, message };
    }
  };

  const signup = async (userData) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        return { 
          success: false, 
          message: "Authentication required. Please login as admin first." 
        };
      }

      const response = await api.post("/auth/signup", userData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return { 
        success: true, 
        message: response.data.message,
        data: response.data 
      };
    } catch (error) {
      console.error("Signup error:", error);
      const message = error.response?.data?.message || "User creation failed. Please try again.";
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    navigate("/login");
  };

  const hasRole = (requiredRoles) => {
    if (!user || !user.role) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  };

  const isAdmin = () => hasRole('admin');
  const isHOD = () => hasRole('hod');
  const isFaculty = () => hasRole(['assistant_professor', 'associate_professor', 'professor']);
  const isStudent = () => hasRole('student');

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    hasRole,
    isAdmin,
    isHOD,
    isFaculty,
    isStudent
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};