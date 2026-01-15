import React, { useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const body = { email, password };
    console.log("LOGIN BODY:\n", JSON.stringify(body, null, 2));

    // TODO: tu zrobisz request do backendu
    // na razie przykładowo:
    // navigate("/admin");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f4f5f7",
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
              src="https://via.placeholder.com/520x420.png?text=StreetArt+Image"
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={{
                  width: "100%",
                  borderRadius: 8,
                }}
              />

              <Password
                value={password}
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
