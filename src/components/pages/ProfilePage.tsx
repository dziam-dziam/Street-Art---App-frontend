import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { Divider } from "primereact/divider";

import { LANGUAGE_OPTIONS } from "../constants/Options";
import { EMAIL_REGEX, PASSWORD_REGEX } from "../constants/validators";

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
  appUserPassword?: string; // opcjonalne
  appUserLanguagesSpoken: string[];
};

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  const [loading, setLoading] = useState(false);

  const [initialEmail, setInitialEmail] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [password, setPassword] = useState("");

  // proste touched do walidacji
  const [tName, setTName] = useState(false);
  const [tEmail, setTEmail] = useState(false);
  const [tLang, setTLang] = useState(false);
  const [tPass, setTPass] = useState(false);

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

        if (cancelled) return;

        setInitialEmail(data.email ?? "");
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setLanguages(Array.isArray(data.languagesSpoken) ? data.languagesSpoken.map(String) : []);
      } catch (e: any) {
        toast.current?.show({
          severity: "error",
          summary: "Błąd",
          detail: e?.message ?? "Nie udało się pobrać profilu",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    const n = name.trim();
    if (!n) e.name = "Name is required.";
    else if (n.length < 5) e.name = "Name must be at least 5 characters.";
    else if (n.length > 30) e.name = "Name cannot be longer than 30 characters.";

    const em = email.trim();
    if (!em) e.email = "Email is required.";
    else if (!EMAIL_REGEX.test(em)) e.email = "Email format is invalid.";

    if (!languages || languages.length === 0) e.languages = "Select at least one language.";

    const p = password;
    if (p.trim().length > 0 && !PASSWORD_REGEX.test(p)) {
      e.password = "Min 10 characters + 1 uppercase letter + 1 digit + 1 special character.";
    }

    return e;
  }, [name, email, languages, password]);

  const canSave = Object.keys(errors).length === 0 && !loading;

  const save = async () => {
    setTName(true);
    setTEmail(true);
    setTLang(true);
    setTPass(true);

    if (!canSave) {
      toast.current?.show({
        severity: "warn",
        summary: "Popraw błędy",
        detail: "Uzupełnij pola poprawnie.",
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
        summary: "Zapisano ✅",
        detail: "Profil zaktualizowany",
        life: 1800,
      });

      setPassword("");

        const passwordChanged = password.trim().length > 0;
        const emailChanged = oldEmail && oldEmail !== newEmail;

        if (emailChanged || passwordChanged) {
        await fetch(`${BASE}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
        navigate("/login", { replace: true });
        return;
        }

      setInitialEmail(newEmail);
    } catch (e: any) {
      toast.current?.show({
        severity: "error",
        summary: "Błąd zapisu",
        detail: e?.message ?? "Update error",
        life: 3500,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 520 }}>
      <Toast ref={toast} position="top-right" />

      <h2 style={{ marginTop: 0 }}>Mój profil</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <Button label="Wróć" icon="pi pi-arrow-left" severity="secondary" onClick={() => navigate("/app")} />
        <Button label="Zapisz" icon="pi pi-check" onClick={save} disabled={!canSave} />
      </div>

      <Divider />

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <div style={{ marginBottom: 6 }}>Email</div>
          <InputText
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTEmail(true)}
            className={tEmail && errors.email ? "p-invalid" : ""}
            style={{ width: "100%" }}
          />
          {tEmail && errors.email ? <small className="p-error">{errors.email}</small> : null}
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>Name</div>
          <InputText
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTName(true)}
            className={tName && errors.name ? "p-invalid" : ""}
            style={{ width: "100%" }}
          />
          {tName && errors.name ? <small className="p-error">{errors.name}</small> : null}
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>Languages spoken</div>
          <MultiSelect
            value={languages}
            onChange={(e) => setLanguages(e.value)}
            onBlur={() => setTLang(true)}
            options={LANGUAGE_OPTIONS as any}
            placeholder="Select languages"
            className={tLang && errors.languages ? "p-invalid" : ""}
            style={{ width: "100%" }}
            display="chip"
          />
          {tLang && errors.languages ? <small className="p-error">{errors.languages}</small> : null}
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>New password (optional)</div>
          <InputText
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTPass(true)}
            className={tPass && errors.password ? "p-invalid" : ""}
            style={{ width: "100%" }}
          />
          {tPass && errors.password ? <small className="p-error">{errors.password}</small> : null}
          <small style={{ opacity: 0.8 }}>Zostaw puste jeśli nie chcesz zmieniać hasła.</small>
        </div>
      </div>

      {loading ? <div style={{ marginTop: 12, opacity: 0.8 }}>Loading...</div> : null}
    </div>
  );
};