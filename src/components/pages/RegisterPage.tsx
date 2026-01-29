import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { useNavigate } from "react-router-dom";
import type { RegisterDto } from "../dto/auth/RegisterDto";


import streetArtBlue from "../images/streetArtBlue.jpeg";
import styles from "../../styles/pages.module.css";

import { AuthShell } from "../../widgets/auth/AutoShell";
import { AuthImagePanel } from "../../widgets/auth/ImagePanel";

import { LANGUAGE_OPTIONS, DISTRICT_OPTIONS, NATIONALITY_OPTIONS } from "../constants/options";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterDto>({
    appUserName: "",
    appUserEmail: "",
    appUserPassword: "",
    appUserNationality: "",
    appUserLanguagesSpoken: [],
    appUserCity: "Poznań",
    appUserLiveInDistrict: "",
  });

  const canGoNext = form.appUserName.trim() && form.appUserEmail.trim() && form.appUserPassword.trim();

  const onNext = (e: React.FormEvent) => {
    e.preventDefault();

    fetch("http://localhost:8080/auth/register", {
      method: "POST",
      body: JSON.stringify(form, null, 2),
      headers: { "Content-type": "application/json; charset=UTF-8" },
    })
      .then((response) => {
        if (!response.ok) {
          alert(`Błąd ${response.status}: ${response.statusText}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json().catch(() => null);
      })
      .then((data) => {
        console.log("Response from server:\n", data);
        navigate("/register/2", { state: form });
      })
      .catch((err) => {
        console.error("Fetch error:", err);
      });
  };

  return (
    <AuthShell title="Sign Up" cardClassName={styles.authCardRegister}>
      <div className={styles.registerGrid}>
        <AuthImagePanel src={streetArtBlue} alt="street art" imgClassName={styles.imageFill460} />

        <form onSubmit={onNext} className={styles.formRegister}>
          <InputText
            value={form.appUserName}
            onChange={(e) => setForm((p) => ({ ...p, appUserName: e.target.value }))}
            placeholder="Name"
            className={`${styles.fullWidth} ${styles.radius10}`}
          />

          <InputText
            value={form.appUserEmail}
            onChange={(e) => setForm((p) => ({ ...p, appUserEmail: e.target.value }))}
            placeholder="Email"
            className={`${styles.fullWidth} ${styles.radius10}`}
          />

          <Password
            value={form.appUserPassword}
            onChange={(e) => setForm((p) => ({ ...p, appUserPassword: e.target.value }))}
            placeholder="Password"
            toggleMask
            feedback={false}
            inputStyle={{ width: "100%" }}
            className={styles.fullWidth}
          />

          <div className={styles.grid2}>
            <InputText value={form.appUserCity} disabled placeholder="City" className={`${styles.fullWidth} ${styles.radius10}`} />

            <Dropdown
              value={form.appUserNationality}
              options={NATIONALITY_OPTIONS as any}
              onChange={(e) => setForm((p) => ({ ...p, appUserNationality: e.value ?? "" }))}
              placeholder="Nationality"
              className={styles.fullWidth}
              filter
              showClear
            />
          </div>

          <Dropdown
            value={form.appUserLiveInDistrict}
            options={DISTRICT_OPTIONS as any}
            onChange={(e) => setForm((p) => ({ ...p, appUserLiveInDistrict: e.value ?? "" }))}
            placeholder="Live in district"
            className={styles.fullWidth}
            filter
            showClear
          />

          <MultiSelect
            value={form.appUserLanguagesSpoken}
            options={LANGUAGE_OPTIONS as any}
            onChange={(e) => setForm((p) => ({ ...p, appUserLanguagesSpoken: e.value }))}
            display="chip"
            placeholder="Languages spoken"
            className={styles.fullWidth}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <Button
              type="submit"
              label="Next"
              icon="pi pi-arrow-right"
              iconPos="right"
              disabled={!canGoNext}
              className={`${styles.radius10}`}
              style={{ fontWeight: 700, paddingInline: 18 }}
            />
          </div>
        </form>
      </div>
    </AuthShell>
  );
};
