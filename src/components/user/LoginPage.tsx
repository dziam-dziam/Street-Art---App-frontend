import React, { useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import streetArtGreen from "../images/streetArtGreen.jpeg"; 


export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [appUserEmail, setEmail] = useState("");
  const [appUserPassword, setPassword] = useState("");

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = { appUserEmail: appUserEmail, appUserPassword: appUserPassword };
    console.log("LOGIN BODY:\n", JSON.stringify(body, null, 2));
    const url = new URL("http://localhost:8080/auth/login");
    try{
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8"},
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        alert("Login failed. Please check your credentials and try again.");
        throw new Error(`HTTP error by login! status: ${res.status}`);
      }
        const data = await res.json().catch(() => null);
    console.log("Response from server:\n", data);
    navigate("/app", { replace: true });
    alert("Login successful!");
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }


  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#7d98cd",
      }}
    >
      <Card
        style={{
          width: "min(920px, 96vw)",
          background: "#4b55a3",
          color: "white",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
            alignItems: "center",
          }}
        >
          {/* LEFT: image */}
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <img
              src={streetArtGreen}
              alt="street art"
              style={{
                width: "100%",
                height: 420,
                objectFit: "cover",
                borderRadius: 10,
                display: "block",
              }}
            />
          </div>

          {/* RIGHT: form */}
          <div style={{ paddingRight: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>
              Welcome to StreetApp!
              <br />
              Let us explore
            </div>

            <form
              onSubmit={onLogin}
              style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}
            >
              <InputText
                value={appUserEmail}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={{
                  width: "100%",
                  borderRadius: 8,
                }}
              />

              <Password
                value={appUserPassword}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                toggleMask
                feedback={false}
                inputStyle={{ width: "100%" }}
                style={{ width: "100%" }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                <Button
                  type="submit"
                  label="Login"
                  style={{
                    width: 140,
                    borderRadius: 10,
                    fontWeight: 700,
                  }}
                />

                <Button
                  type="button"
                  label="Sign Up"
                  outlined
                  onClick={() => navigate("/register")}
                  style={{
                    width: 140,
                    borderRadius: 10,
                    fontWeight: 700,
                    color: "white",
                    borderColor: "rgba(255,255,255,0.75)",
                  }}
                />
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
};
