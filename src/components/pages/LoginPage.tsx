import React, { useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import streetArtGreen from "../images/streetArtGreen.jpeg"; 
import styles from "../../styles/pages.module.css";


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
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }


 return (
  <div className={styles.authBg}>
    <Card className={styles.authCardLogin}>
      <div className={styles.authGrid2}>
        <div className={styles.imagePanel}>
          <img src={streetArtGreen} alt="street art" className={styles.imageFill420} />
        </div>

        <div className={styles.formRightPad}>
          <div className={styles.headline}>
            Welcome to StreetApp!
            <br />
            Let us explore
          </div>

          <form onSubmit={onLogin} className={styles.formCol}>
            <InputText
              value={appUserEmail}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={styles.fullWidth}
              style={{ borderRadius: 8 }}
            />

            <Password
              value={appUserPassword}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              toggleMask
              feedback={false}
              inputStyle={{ width: "100%" }}
              className={styles.fullWidth}
            />

            <div className={styles.buttonsCol}>
              <Button type="submit" label="Login" className={styles.btnW140} />

              <Button
                type="button"
                label="Sign Up"
                outlined
                onClick={() => navigate("/register")}
                className={`${styles.btnW140} ${styles.btnOutlinedWhite}`}
              />
            </div>
          </form>
        </div>
      </div>
    </Card>
  </div>
);

};
