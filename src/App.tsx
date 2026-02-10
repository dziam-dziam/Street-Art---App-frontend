import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminPage } from "./components/pages/AdminPage";
import { LoginPage } from "./components/pages/LoginPage";
import { ProtectedRoute } from "./components/pages/ProtectedRoute";
import { RegisterPage } from "./components/pages/RegisterPage";
import { RegisterPageTwo } from "./components/pages/RegisterPageTwo";
import { AppView } from "./components/pages/AppView";
import { AddArtPiecePage } from "./components/pages/AddArtPiecePage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { MyArtPiecesPage } from "./components/pages/MyArtPiecesPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<AppView />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/artpieces/add" element={<AddArtPiecePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/my-artpieces" element={<MyArtPiecesPage />} />

      <Route
        path="/register/2"
        element={
          <RegisterPageTwo
          />
        }
      />

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
