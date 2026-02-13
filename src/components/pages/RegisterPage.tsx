import React, { useMemo, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RegisterDto } from "../dto/auth/RegisterDto";

import streetArtBlue from "../images/streetArtBlue.jpeg";
import styles from "../../styles/pages.module.css";

import { AuthShell } from "../../widgets/auth/AutoShell";
import { AuthImagePanel } from "../../widgets/auth/ImagePanel";
import { LanguageSwitch } from "../../widgets/LanguageSwitch";

import { LANGUAGE_OPTIONS, DISTRICT_OPTIONS, NATIONALITY_OPTIONS } from "../constants/Options";
import { EMAIL_REGEX, PASSWORD_REGEX } from "../constants/validators";

type FormErrors = Partial<Record<keyof RegisterDto, string>>;
type Touched = Partial<Record<keyof RegisterDto, boolean>>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
    if (!name) e.appUserName = t("validation.nameRequired");
    else if (name.length < 5) e.appUserName = t("validation.nameMin");
    else if (name.length > 30) e.appUserName = t("validation.nameMax");

    const email = v.appUserEmail.trim();
    if (!email) e.appUserEmail = t("validation.emailRequired");
    else if (!EMAIL_REGEX.test(email)) e.appUserEmail = t("validation.emailInvalid");

    const pass = v.appUserPassword;
    if (!pass) e.appUserPassword = t("validation.passwordRequired");
    else if (!PASSWORD_REGEX.test(pass)) e.appUserPassword = t("validation.passwordRules");

    if (!v.appUserCity.trim()) e.appUserCity = t("validation.cityRequired");
    if (!v.appUserNationality.trim()) e.appUserNationality = t("validation.nationalityRequired");
    if (!v.appUserLiveInDistrict.trim()) e.appUserLiveInDistrict = t("validation.districtRequired");

    if (!v.appUserLanguagesSpoken || v.appUserLanguagesSpoken.length === 0) {
      e.appUserLanguagesSpoken = t("validation.selectAtLeastOne");
    }

    return e;
  };

  const errors = useMemo(() => validate(form), [form]); // t() is inside validate via closure
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
        alert(`${t("common.error")} ${res.status}: ${raw || res.statusText}`);
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
    <AuthShell title={t("auth.signUpTitle")} cardClassName={styles.authCardRegister}>
      <LanguageSwitch />

      <div className={styles.registerGrid}>
        <AuthImagePanel src={streetArtBlue} alt="street art" imgClassName={styles.imageFill460} />

        <form onSubmit={onNext} className={styles.formRegister}>
          <div className={styles.fieldBlock}>
            <InputText
              value={form.appUserName}
              onChange={(e) => setForm((p) => ({ ...p, appUserName: e.target.value }))}
              onBlur={() => markTouched("appUserName")}
              placeholder={t("validation.nameRequired") /* możesz zmienić na osobny klucz np. auth.name */}
              className={`${styles.fullWidth} ${styles.radius10} ${showError("appUserName") ? "p-invalid" : ""}`}
            />
            {showError("appUserName") ? <small className="p-error">{errors.appUserName}</small> : null}
          </div>

          <div className={styles.fieldBlock}>
            <InputText
              value={form.appUserEmail}
              onChange={(e) => setForm((p) => ({ ...p, appUserEmail: e.target.value }))}
              onBlur={() => markTouched("appUserEmail")}
              placeholder={t("auth.email")}
              className={`${styles.fullWidth} ${styles.radius10} ${showError("appUserEmail") ? "p-invalid" : ""}`}
            />
            {showError("appUserEmail") ? <small className="p-error">{errors.appUserEmail}</small> : null}
          </div>

          <div className={styles.fieldBlock}>
            <Password
              value={form.appUserPassword}
              onChange={(e) => setForm((p) => ({ ...p, appUserPassword: e.target.value }))}
              onBlur={() => markTouched("appUserPassword")}
              placeholder={t("auth.password")}
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
                placeholder={t("addArtPiece.city")}
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
                placeholder={t("validation.nationalityRequired") /* najlepiej dać klucz auth.nationality */}
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
              placeholder={t("validation.districtRequired") /* najlepiej dać klucz auth.liveInDistrict */}
              className={`${styles.fullWidth} ${showError("appUserLiveInDistrict") ? "p-invalid" : ""}`}
              filter
              showClear
            />
            {showError("appUserLiveInDistrict") ? <small className="p-error">{errors.appUserLiveInDistrict}</small> : null}
          </div>

          <div className={styles.fieldBlock}>
            <MultiSelect
              value={form.appUserLanguagesSpoken}
              options={LANGUAGE_OPTIONS as any}
              onChange={(e) => setForm((p) => ({ ...p, appUserLanguagesSpoken: e.value }))}
              onBlur={() => markTouched("appUserLanguagesSpoken")}
              display="chip"
              placeholder={t("validation.selectAtLeastOne") /* najlepiej dać klucz auth.languagesSpoken */}
              className={`${styles.fullWidth} ${showError("appUserLanguagesSpoken") ? "p-invalid" : ""}`}
            />
            {showError("appUserLanguagesSpoken") ? <small className="p-error">{errors.appUserLanguagesSpoken}</small> : null}
          </div>

          <div className={styles.dialogActions}>
            <Button
              type="submit"
              label={submitting ? t("auth.submitting") : t("auth.next")}
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