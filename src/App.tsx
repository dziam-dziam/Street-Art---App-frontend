import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminPage } from "./components/user/AdminPage";
import { LoginPage } from "./components/user/LoginPage";
import { ProtectedRoute } from "./components/user/ProtectedRoute";
import { RegisterPage } from "./components/user/RegisterPage";
import { RegisterPageTwo } from "./components/user/RegisterPageTwo";
import { AppView } from "./components/user/AppView";
import { AddArtPiecePage } from "./components/user/AddArtPiecePage";
import AdminFetchTest from "./components/user/AdminFetch";
import AdminFetchUsers from "./components/user/AdminFetchAppUser";
import AdminFetchArtPieces from "./components/user/AdminFetchArtpieces";
import AllFetches from "./components/user/AllFetches";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<AppView />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/artpieces/add" element={<AddArtPiecePage />} />
      <Route path="/admin/test" element={<AdminFetchTest />} />
      <Route path="/admin/test/users" element={<AdminFetchUsers />} />
      <Route path="/admin/test/artpieces" element={<AdminFetchArtPieces />} />
      <Route path="/allfetch" element={<AllFetches/>} />
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
