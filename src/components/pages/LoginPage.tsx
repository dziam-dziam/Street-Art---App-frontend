import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import streetArtGreen from "../images/streetArtGreen.jpeg";
import styles from "../../styles/pages.module.css";

import { AuthShell } from "../../widgets/auth/AutoShell";
import { AuthImagePanel } from "../../widgets/auth/ImagePanel";
import { LanguageSwitch } from "../../widgets/LanguageSwitch";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [appUserEmail, setEmail] = useState("");
  const [appUserPassword, setPassword] = useState("");

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = { appUserEmail, appUserPassword };
    console.log("LOGIN BODY:\n", JSON.stringify(body, null, 2));

    const url = new URL("http://localhost:8080/auth/login");
    try {
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!res.ok) {
        alert(t("auth.loginFailed"));
        throw new Error(`HTTP error by login! status: ${res.status}`);
      }

      const data = await res.json().catch(() => null);
      console.log("Response from server:\n", data);
      navigate("/app", { replace: true });
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  return (
    <AuthShell cardClassName={styles.authCardLogin}>
        <LanguageSwitch />

      <div className={styles.authGrid2}>
        <AuthImagePanel src={streetArtGreen} alt="street art" imgClassName={styles.imageFill420} />

        <div className={styles.formRightPad}>
          <div className={styles.headline}>
            {t("auth.welcomeTitle")}
            <br />
            {t("auth.welcomeSubtitle")}
          </div>

          <form onSubmit={onLogin} className={styles.formCol}>
            <InputText
              value={appUserEmail}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.email")}
              className={`${styles.fullWidth} ${styles.radius10}`}
            />

            <Password
              value={appUserPassword}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.password")}
              toggleMask
              feedback={false}
              inputStyle={{ width: "100%" }}
              className={styles.fullWidth}
            />

            <div className={styles.buttonsCol}>
              <Button type="submit" label={t("auth.login")} className={styles.btnW140} />

              <Button
                type="button"
                label={t("auth.signup")}
                outlined
                onClick={() => navigate("/register")}
                className={`${styles.btnW140} ${styles.btnOutlinedWhite}`}
              />
            </div>
          </form>
        </div>
      </div>
    </AuthShell>
  );
};