import React, { useMemo, useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import streetArtBlue from "../images/streetArtBlue.jpeg";
import { Dropdown } from "primereact/dropdown";
import { RegisterPageTwo } from "./RegisterPageTwo";

export type RegisterDto = {
  appUserName: string;
  appUserEmail: string;
  appUserPassword: string;
  appUserNationality: string;
  appUserLanguagesSpoken: string[];
  appUserCity: string;
  appUserLiveInDistrict: string;
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const districtOptions = useMemo(
  () => [
    { label: "Jeżyce", value: "Jeżyce" },
    { label: "Grunwald", value: "Grunwald" },
    { label: "Stare Miasto", value: "Stare Miasto" },
    { label: "Nowe Miasto", value: "Nowe Miasto" },
    { label: "Wilda", value: "Wilda" },
  ],
  []
);

const nationalityOptions = useMemo(
  () => [
    { label: "Polish", value: "Polish" },
    { label: "German", value: "German" },
    { label: "Spanish", value: "Spanish" },
    { label: "French", value: "French" },
    { label: "English", value: "English" },
    { label: "Ukrainian", value: "Ukrainian" },
    { label: "Other", value: "Other" },
  ],
  []
);



  const [form, setForm] = useState<RegisterDto>({
    appUserName: "",
    appUserEmail: "",
    appUserPassword: "",
    appUserNationality: "",
    appUserLanguagesSpoken: [],
    appUserCity: "Poznań",
    appUserLiveInDistrict: "",
  });

  const languageOptions = useMemo(
    () => [
      { label: "English", value: "English" },
      { label: "Polish", value: "Polish" },
      { label: "Spanish", value: "Spanish" },
      { label: "German", value: "German" },
      { label: "French", value: "French" },
    ],
    []
  );

  const canGoNext =
    form.appUserName.trim() &&
    form.appUserEmail.trim() &&
    form.appUserPassword.trim();

  const onNext = (e: React.FormEvent) => {
    e.preventDefault();
      fetch("http://localhost:8080/auth/register", {
        method: "POST",
        body: JSON.stringify(form, null, 2),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      }).then(response => {
          if (!response.ok) {
            alert(`Błąd ${response.status}: ${response.statusText}`);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
      })
      .then(data => {
        console.log("Response from server:\n", data);
        navigate("/register/2", { state: form });
      })
      .catch((err) => {
        console.error("Fetch error:", err);
      });
  };

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
        title="Register Page - 1"
        style={{
          width: "min(980px, 96vw)",
          background: "#4b55a3",
          color: "white",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          {/* LEFT: image */}
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 12,
              minHeight: 460,
            }}
          >
            <img
              src={streetArtBlue}
              alt="street art"
              style={{
                width: "100%",
                height: 460,
                objectFit: "cover",
                borderRadius: 10,
                display: "block",
              }}
            />
          </div>

          <form
            onSubmit={onNext}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              paddingRight: 6,
            }}
          >
            <InputText
              value={form.appUserName}
              onChange={(e) => setForm((p) => ({ ...p, appUserName: e.target.value }))}
              placeholder="Name"
              style={{ width: "100%", borderRadius: 10 }}
            />

            <InputText
              value={form.appUserEmail}
              onChange={(e) => setForm((p) => ({ ...p, appUserEmail: e.target.value }))}
              placeholder="Email"
              style={{ width: "100%", borderRadius: 10 }}
            />

            <Password
              value={form.appUserPassword}
              onChange={(e) => setForm((p) => ({ ...p, appUserPassword: e.target.value }))}
              placeholder="Password"
              toggleMask
              feedback={false}
              inputStyle={{ width: "100%" }}
              style={{ width: "100%" }}
            />

            {/* 2 small fields like in mock */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <InputText
                  value={form.appUserCity}
                  disabled
                  placeholder="City"
                  style={{ width: "100%", borderRadius: 10, opacity: 0.9 }}
                />

              <Dropdown
  value={form.appUserNationality}
  options={nationalityOptions}
  onChange={(e) =>
    setForm((p) => ({ ...p, appUserNationality: e.value ?? "" }))
  }
  placeholder="Nationality"
  style={{ width: "100%" }}
  filter
  showClear
/>

            </div>

                        <Dropdown
              value={form.appUserLiveInDistrict}
              options={districtOptions}
              onChange={(e) =>
                setForm((p) => ({ ...p, appUserLiveInDistrict: e.value ?? "" }))
              }
              placeholder="Live in district"
              style={{ width: "100%" }}
              filter
              showClear
            />


            <MultiSelect
              value={form.appUserLanguagesSpoken}
              options={languageOptions}
              onChange={(e) => setForm((p) => ({ ...p, appUserLanguagesSpoken: e.value }))}
              display="chip"
              placeholder="Languages spoken (dropdown)"
              style={{ width: "100%" }}
            />

            {/* Next button bottom-right */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
              <Button
                type="submit"
                label="Next"
                icon="pi pi-arrow-right"
                iconPos="right"
                disabled={!canGoNext}
                style={{
                  borderRadius: 10,
                  fontWeight: 700,
                  paddingInline: 18,
                }}
              />
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
