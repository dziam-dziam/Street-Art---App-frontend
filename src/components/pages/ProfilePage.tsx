import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "../../styles/pages.module.css";
import { useNavigate } from "react-router-dom";

import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { Divider } from "primereact/divider";
import { Card } from "primereact/card";

import { getLanguageOptions } from "../constants/Options";
import { EMAIL_REGEX, PASSWORD_REGEX } from "../constants/validators";

import { useTranslation } from "react-i18next";

const BASE = "http://localhost:8080";

type MeResponse = {
  email: string;
  name: string;
  languagesSpoken: string[];
  roles: string[];
};

type UpdateBody = {
  appUserName: string;
  appUserEmail: string;
  appUserPassword?: string;
  appUserLanguagesSpoken: string[];
};

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  const { t, i18n } = useTranslation();

    const languageOptions = useMemo(() => getLanguageOptions(t), [t, i18n.language]);

  const activeLang = (i18n.language || "pl").toLowerCase().startsWith("pl") ? "pl" : "en";
  const setLang = (lng: "pl" | "en") => void i18n.changeLanguage(lng);

  const [loading, setLoading] = useState(false);
  const [initialEmail, setInitialEmail] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [password, setPassword] = useState("");

  const [tName, setTName] = useState(false);
  const [tEmail, setTEmail] = useState(false);
  const [tLang, setTLang] = useState(false);
  const [tPass, setTPass] = useState(false);
  const [readOnly, setReadOnly] = useState(false);


  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const res = await fetch(`${BASE}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        const raw = await res.text().catch(() => "");
        if (!res.ok) throw new Error(`GET /auth/me failed: ${res.status}. ${raw.slice(0, 200)}`);

        const data = (raw.trim() ? (JSON.parse(raw) as MeResponse) : null) as MeResponse;
        const roles: string[] = Array.isArray((data as any)?.roles) ? (data as any).roles.map(String) : [];
        const isAdmin = roles.some((r) => r.toUpperCase().includes("ADMIN"));
        setReadOnly(isAdmin);


        if (cancelled) return;

        setInitialEmail(data.email ?? "");
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setLanguages(Array.isArray(data.languagesSpoken) ? data.languagesSpoken.map(String) : []);
      } catch (e: any) {
        toast.current?.show({
          severity: "error",
          summary: t("common.error"),
          detail: e?.message ?? t("profile.fetchFailed"),
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    const n = name.trim();
    if (!n) e.name = t("validation.nameRequired");
    else if (n.length < 5) e.name = t("validation.nameMin");
    else if (n.length > 30) e.name = t("validation.nameMax");

    const em = email.trim();
    if (!em) e.email = t("validation.emailRequired");
    else if (!EMAIL_REGEX.test(em)) e.email = t("validation.emailInvalid");

    if (!languages || languages.length === 0) e.languages = t("validation.selectAtLeastOne");

    const p = password;
    if (p.trim().length > 0 && !PASSWORD_REGEX.test(p)) {
      e.password = t("validation.passwordRules");
    }

    return e;
  }, [name, email, languages, password, t]);

  const canSave = Object.keys(errors).length === 0 && !loading;

  const save = async () => {
    if (readOnly) {
  toast.current?.show({
    severity: "info",
    summary: t("common.info", { defaultValue: "Info" }),
    detail: t("profile.readOnlyAdmin", { defaultValue: "Admin cannot edit their profile." }),
    life: 2000,
  });
  return;
}
    setTName(true);
    setTEmail(true);
    setTLang(true);
    setTPass(true);

    if (!canSave) {
      toast.current?.show({
        severity: "warn",
        summary: t("toasts.fixErrorsSummary"),
        detail: t("toasts.fixErrorsDetail"),
        life: 2200,
      });
      return;
    }

    const oldEmail = initialEmail.trim();
    const newEmail = email.trim();

    const body: UpdateBody = {
      appUserName: name.trim(),
      appUserEmail: newEmail,
      appUserLanguagesSpoken: languages,
      ...(password.trim() ? { appUserPassword: password } : {}),
    };

    try {
      setLoading(true);

      const res = await fetch(`${BASE}/updateAppUser/me`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json; charset=UTF-8", Accept: "application/json" },
        body: JSON.stringify(body),
      });

      const raw = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`PUT /updateAppUser/me failed: ${res.status}. ${raw.slice(0, 300)}`);

      toast.current?.show({
        severity: "success",
        summary: t("toasts.savedSummary"),
        detail: t("profile.updated"),
        life: 1800,
      });

      const passwordChanged = password.trim().length > 0;
      const emailChanged = oldEmail && oldEmail !== newEmail;

      setPassword("");

      if (emailChanged || passwordChanged) {
        await fetch(`${BASE}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
        navigate("/login", { replace: true });
        return;
      }

      setInitialEmail(newEmail);
    } catch (e: any) {
      toast.current?.show({
        severity: "error",
        summary: t("profile.saveError"),
        detail: e?.message ?? t("common.unknownError"),
        life: 3500,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageCenter}>
      <div style={{ position: "absolute", top: 18, right: 18, display: "flex", gap: 8, zIndex: 5 }}>
        <Button
  label={t("common.pl")}
  size="small"
  outlined={activeLang !== "pl"}
  onClick={() => setLang("pl")}
  style={activeLang !== "pl" ? { color: "#000", borderColor: "rgba(0,0,0,0.35)" } : undefined}
/>

<Button
  label={t("common.en")}
  size="small"
  outlined={activeLang !== "en"}
  onClick={() => setLang("en")}
  style={activeLang !== "en" ? { color: "#000", borderColor: "rgba(0,0,0,0.35)" } : undefined}
/>

      </div>

      <Toast ref={toast} position="top-right" />

      <Card title={t("appView.myProfile")} className={styles.cardNarrow}>
        <div className={styles.row}>
          <Button
            label={t("buttons.back")}
            icon="pi pi-arrow-left"
            severity="secondary"
            onClick={() => navigate("/app")}
          />
          {!readOnly ? (
  <Button label={t("buttons.save")} icon="pi pi-check" onClick={save} disabled={!canSave} />
) : null}
        </div>

        <Divider className={styles.dividerSoft} />

        <div className={styles.dialogGrid14}>
          <div className={styles.fieldBlock}>
            <small className={styles.fieldLabelSmall}>{t("fields.email")}</small>
            <InputText
  value={email}
  disabled={readOnly}
  onChange={(e) => {
    if (readOnly) return;
    setEmail(e.target.value);
  }}
  onBlur={() => {
    if (readOnly) return;
    setTEmail(true);
  }}
  className={`${styles.fullWidth} ${!readOnly && tEmail && errors.email ? "p-invalid" : ""}`}
/>
{!readOnly && tEmail && errors.email ? <small className="p-error">{errors.email}</small> : null}
          </div>

          <div className={styles.fieldBlock}>
            <small className={styles.fieldLabelSmall}>{t("fields.name")}</small>
            <InputText
  value={name}
  disabled={readOnly}
  onChange={(e) => {
    if (readOnly) return;
    setName(e.target.value);
  }}
  onBlur={() => {
    if (readOnly) return;
    setTName(true);
  }}
  className={`${styles.fullWidth} ${!readOnly && tName && errors.name ? "p-invalid" : ""}`}
/>
{!readOnly && tName && errors.name ? <small className="p-error">{errors.name}</small> : null}
          </div>

          <div className={styles.fieldBlock}>
            <small className={styles.fieldLabelSmall}>{t("fields.languagesSpoken")}</small>
            <MultiSelect
  value={languages}
  disabled={readOnly}
  onChange={(e) => {
    if (readOnly) return;
    setLanguages(e.value);
  }}
  onBlur={() => {
    if (readOnly) return;
    setTLang(true);
  }}
  options={languageOptions as any}
  placeholder={t("placeholders.selectLanguages")}
  className={`${styles.fullWidth} ${!readOnly && tLang && errors.languages ? "p-invalid" : ""}`}
  display="chip"
  showSelectAll={false}
  panelHeaderTemplate={() => null}
/>
{!readOnly && tLang && errors.languages ? <small className="p-error">{errors.languages}</small> : null}
          </div>

          {!readOnly ? (
  <div className={styles.fieldBlock}>
    <small className={styles.fieldLabelSmall}>{t("profile.newPasswordOptional")}</small>
    <InputText
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      onBlur={() => setTPass(true)}
      className={`${styles.fullWidth} ${tPass && errors.password ? "p-invalid" : ""}`}
    />
    {tPass && errors.password ? <small className="p-error">{errors.password}</small> : null}
    <small style={{ opacity: 0.85 }}>{t("profile.passwordHint")}</small>
  </div>
) : null}
        </div>

        {loading ? (
          <div className={styles.mt8} style={{ opacity: 0.85 }}>
            {t("common.loading")}
          </div>
        ) : null}
      </Card>
    </div>
  );
};