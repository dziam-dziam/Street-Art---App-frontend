import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminPage } from './components/admin/AdminPage';
import { LoginPage } from './components/user/LoginPage';
import { ProtectedRoute } from './components/user/ProtectedRoute';
import { RegisterPage } from './components/user/RegisterPage';

function App() {
    return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<h2>404 - Not found</h2>} />
    </Routes>
    );
}

export default App;
