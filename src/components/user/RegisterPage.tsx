import React, { useState } from 'react';
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { RegisterDto } from '../dto/RegisterDto';

export const RegisterPage: React.FC = () => {
  const [form, setForm] = useState<RegisterDto>({
    appUserName: "",
    appUserEmail: "",
    appUserPassword: "",
    appUserNationality: "",
    appUserLanguagesSpoken: [],
    appUserCity: "",
    appUserLiveInDistrict: "",
  });

  const languageOptions = [
    { label: "English", value: "English" },
    { label: "Polish", value: "Polish" },
    { label: "Spanish", value: "Spanish" },
    { label: "German", value: "German" },
    { label: "French", value: "French" },
  ];


  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const body = JSON.stringify(form, null, 2);

    console.log("REQUEST BODY (JSON):\n", body);
  };

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 24 }}>
      <Card title="Register" style={{ width: "min(640px, 95vw)" }}>
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span className="p-float-label">
            <InputText
              id="name"
              value={form.appUserName}
              onChange={(e) => setForm((p) => ({ ...p, appUserName: e.target.value }))}
              style={{ width: "100%" }}
            />
            <label htmlFor="name">Name</label>
          </span>

          <span className="p-float-label">
            <InputText
              id="email"
              value={form.appUserEmail}
              onChange={(e) => setForm((p) => ({ ...p, appUserEmail: e.target.value }))}
              style={{ width: "100%" }}
            />
            <label htmlFor="email">Email</label>
          </span>

          <span className="p-float-label">
            <Password
              id="password"
              value={form.appUserPassword}
              onChange={(e) => setForm((p) => ({ ...p, appUserPassword: e.target.value }))}
              toggleMask
              feedback={false}
              inputStyle={{ width: "100%" }}
              style={{ width: "100%" }}
            />
            <label htmlFor="password">Password</label>
          </span>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <span className="p-float-label">
              <InputText
                id="nationality"
                value={form.appUserNationality}
                onChange={(e) => setForm((p) => ({ ...p, appUserNationality: e.target.value }))}
                style={{ width: "100%" }}
              />
              <label htmlFor="nationality">Nationality</label>
            </span>

            <span className="p-float-label">
              <InputText
                id="city"
                value={form.appUserCity}
                onChange={(e) => setForm((p) => ({ ...p, appUserCity: e.target.value }))}
                style={{ width: "100%" }}
              />
              <label htmlFor="city">City</label>
            </span>
          </div>

          <span className="p-float-label">
            <MultiSelect
              id="languages"
              value={form.appUserLanguagesSpoken}
              options={languageOptions}
              onChange={(e) => setForm((p) => ({ ...p, appUserLanguagesSpoken: e.value }))}
              display="chip"
              placeholder="Select languages"
              style={{ width: "100%" }}
            />
            <label htmlFor="languages">Languages spoken</label>
          </span>

          <span className="p-float-label">
            <InputText
              id="district"
              value={form.appUserLiveInDistrict}
              onChange={(e) => setForm((p) => ({ ...p, appUserLiveInDistrict: e.target.value }))}
              style={{ width: "100%" }}
            />
            <label htmlFor="district">Live in district</label>
          </span>

          <Button type="submit" label="Register" icon="pi pi-check" />

        </form>
      </Card>
    </div>
  );
};

function useMemo(arg0: () => string, arg1: RegisterDto[]) {
    throw new Error('Function not implemented.');
}
