import React, { useMemo, useState } from "react";
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

import { LANGUAGE_OPTIONS, DISTRICT_OPTIONS, NATIONALITY_OPTIONS } from "../constants/Options";
import { EMAIL_REGEX, PASSWORD_REGEX } from "../constants/validators";

type FormErrors = Partial<Record<keyof RegisterDto, string>>;
type Touched = Partial<Record<keyof RegisterDto, boolean>>;

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

  const [touched, setTouched] = useState<Touched>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (v: RegisterDto): FormErrors => {
    const e: FormErrors = {};

    const name = v.appUserName.trim();
    if (!name) e.appUserName = "Name is required.";
    else if (name.length < 5) e.appUserName = "Name must be at least 5 characters.";
    else if (name.length > 30) e.appUserName = "Name cannot be longer than 30 characters.";

    const email = v.appUserEmail.trim();
    if (!email) e.appUserEmail = "Email is required.";
    else if (!EMAIL_REGEX.test(email)) e.appUserEmail = "Email format is invalid.";

    const pass = v.appUserPassword;
    if (!pass) e.appUserPassword = "Password is required.";
    else if (!PASSWORD_REGEX.test(pass)) {
      e.appUserPassword =
        "Min 10 characters + 1 uppercase letter + 1 digit + 1 special character.";
    }

    if (!v.appUserCity.trim()) e.appUserCity = "City is required.";
    if (!v.appUserNationality.trim()) e.appUserNationality = "Nationality is required.";
    if (!v.appUserLiveInDistrict.trim()) e.appUserLiveInDistrict = "District is required.";

    if (!v.appUserLanguagesSpoken || v.appUserLanguagesSpoken.length === 0) {
      e.appUserLanguagesSpoken = "Select at least one language.";
    }

    return e;
  };

  const errors = useMemo(() => validate(form), [form]);
  const canGoNext = Object.keys(errors).length === 0 && !submitting;

  const markTouched = (k: keyof RegisterDto) => setTouched((p) => ({ ...p, [k]: true }));
  const showError = (k: keyof RegisterDto) => Boolean(touched[k] && errors[k]);

  const onNext = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      appUserName: true,
      appUserEmail: true,
      appUserPassword: true,
      appUserNationality: true,
      appUserLanguagesSpoken: true,
      appUserCity: true,
      appUserLiveInDistrict: true,
    });

    if (Object.keys(errors).length > 0) return;

    try {
      setSubmitting(true);

      const res = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
        headers: { "Content-type": "application/json; charset=UTF-8" },
        credentials: "include",
      });

      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        alert(`Błąd ${res.status}: ${raw || res.statusText}`);
        return;
      }

      const text = await res.text().catch(() => "");
      console.log("Response from server:\n", text);

      navigate("/register/2", { state: form });
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Sign Up" cardClassName={styles.authCardRegister}>
      <div className={styles.registerGrid}>
        <AuthImagePanel src={streetArtBlue} alt="street art" imgClassName={styles.imageFill460} />

        <form onSubmit={onNext} className={styles.formRegister}>
          <div className={styles.fieldBlock}>
            <InputText
              value={form.appUserName}
              onChange={(e) => setForm((p) => ({ ...p, appUserName: e.target.value }))}
              onBlur={() => markTouched("appUserName")}
              placeholder="Name"
              className={`${styles.fullWidth} ${styles.radius10} ${showError("appUserName") ? "p-invalid" : ""}`}
            />
            {showError("appUserName") ? <small className="p-error">{errors.appUserName}</small> : null}
          </div>

          <div className={styles.fieldBlock}>
            <InputText
              value={form.appUserEmail}
              onChange={(e) => setForm((p) => ({ ...p, appUserEmail: e.target.value }))}
              onBlur={() => markTouched("appUserEmail")}
              placeholder="Email"
              className={`${styles.fullWidth} ${styles.radius10} ${showError("appUserEmail") ? "p-invalid" : ""}`}
            />
            {showError("appUserEmail") ? <small className="p-error">{errors.appUserEmail}</small> : null}
          </div>

          <div className={styles.fieldBlock}>
            <Password
              value={form.appUserPassword}
              onChange={(e) => setForm((p) => ({ ...p, appUserPassword: e.target.value }))}
              onBlur={() => markTouched("appUserPassword")}
              placeholder="Password"
              toggleMask
              feedback={false}
              inputStyle={{ width: "100%" }}
              className={`${styles.fullWidth} ${showError("appUserPassword") ? "p-invalid" : ""}`}
            />
            {showError("appUserPassword") ? <small className="p-error">{errors.appUserPassword}</small> : null}
          </div>

          <div className={styles.grid2}>
            <div className={styles.fieldBlock}>
              <InputText
                value={form.appUserCity}
                disabled
                placeholder="City"
                onBlur={() => markTouched("appUserCity")}
                className={`${styles.fullWidth} ${styles.radius10} ${showError("appUserCity") ? "p-invalid" : ""}`}
              />
              {showError("appUserCity") ? <small className="p-error">{errors.appUserCity}</small> : null}
            </div>

            <div className={styles.fieldBlock}>
              <Dropdown
                value={form.appUserNationality}
                options={NATIONALITY_OPTIONS as any}
                onChange={(e) => setForm((p) => ({ ...p, appUserNationality: e.value ?? "" }))}
                onBlur={() => markTouched("appUserNationality")}
                placeholder="Nationality"
                className={`${styles.fullWidth} ${showError("appUserNationality") ? "p-invalid" : ""}`}
                filter
                showClear
              />
              {showError("appUserNationality") ? <small className="p-error">{errors.appUserNationality}</small> : null}
            </div>
          </div>

          <div className={styles.fieldBlock}>
            <Dropdown
              value={form.appUserLiveInDistrict}
              options={DISTRICT_OPTIONS as any}
              onChange={(e) => setForm((p) => ({ ...p, appUserLiveInDistrict: e.value ?? "" }))}
              onBlur={() => markTouched("appUserLiveInDistrict")}
              placeholder="Live in district"
              className={`${styles.fullWidth} ${showError("appUserLiveInDistrict") ? "p-invalid" : ""}`}
              filter
              showClear
            />
            {showError("appUserLiveInDistrict") ? (
              <small className="p-error">{errors.appUserLiveInDistrict}</small>
            ) : null}
          </div>

          <div className={styles.fieldBlock}>
            <MultiSelect
              value={form.appUserLanguagesSpoken}
              options={LANGUAGE_OPTIONS as any}
              onChange={(e) => setForm((p) => ({ ...p, appUserLanguagesSpoken: e.value }))}
              onBlur={() => markTouched("appUserLanguagesSpoken")}
              display="chip"
              placeholder="Languages spoken"
              className={`${styles.fullWidth} ${showError("appUserLanguagesSpoken") ? "p-invalid" : ""}`}
            />
            {showError("appUserLanguagesSpoken") ? (
              <small className="p-error">{errors.appUserLanguagesSpoken}</small>
            ) : null}
          </div>

          <div className={styles.dialogActions}>
            <Button
              type="submit"
              label={submitting ? "Submitting..." : "Next"}
              icon="pi pi-arrow-right"
              iconPos="right"
              disabled={!canGoNext}
              className={`${styles.radius10} ${styles.btnRounded12Bold}`}
              style={{ paddingInline: 18 }}
            />
          </div>
        </form>
      </div>
    </AuthShell>
  );
};
