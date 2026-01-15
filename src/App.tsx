import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminPage } from "./components/user/AdminPage";
import { LoginPage } from "./components/user/LoginPage";
import { ProtectedRoute } from "./components/user/ProtectedRoute";
import { RegisterPage } from "./components/user/RegisterPage";
import { RegisterPage2 } from "./components/user/RegisterPageTwo";
import { AppView } from "./components/user/AppView";
import { AddArtPiecePage } from "./components/user/AddArtPiecePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<AppView />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/artpieces/add" element={<AddArtPiecePage />} />
      <Route
        path="/register/2"
        element={
          <RegisterPage2
            registerData={{
              appUserName: "",
              appUserEmail: "",
              appUserPassword: "",
              appUserNationality: "",
              appUserLanguagesSpoken: [],
              appUserCity: "",
              appUserLiveInDistrict: "",
            }}
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
