import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const token = localStorage.getItem("token");
    console.log("ProtectedRoute token:", token);
    
    if (token) {
        return <Navigate to="/login" replace />;
    }

  return (
  <>{children}</>
  );
}