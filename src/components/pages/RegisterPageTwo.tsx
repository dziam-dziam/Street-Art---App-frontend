import React, { useMemo, useState } from "react";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Divider } from "primereact/divider";
import { Dropdown } from "primereact/dropdown";
import { useNavigate, useLocation } from "react-router-dom";

import streetArtBrown from "../images/streetArtBrown.jpeg";
import styles from "../../styles/pages.module.css";

import { AuthShell } from "../../widgets/auth/AutoShell";
import { AuthImagePanel } from "../../widgets/auth/ImagePanel";

import { DISTRICT_OPTIONS, HOUR_OPTIONS, TRANSPORT_OPTIONS } from "../constants/options";

type MeansOfTransport = (typeof TRANSPORT_OPTIONS)[number]["value"];

export type RegisterDto = {
  appUserName: string;
  appUserEmail: string;
  appUserPassword: string;
  appUserNationality: string;
  appUserLanguagesSpoken: string[];
  appUserCity: string;
  appUserLiveInDistrict: string;
};

export type AddCommuteDto = {
  commuteThroughDistrictName: string;
  commuteTripsPerWeek: number;
  commuteStartHour: number;
  commuteStopHour: number;
  commuteMeansOfTransport: MeansOfTransport[];
};

export const RegisterPageTwo: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const registerData = location.state as RegisterDto | undefined;

  const [commuteForm, setCommuteForm] = useState<AddCommuteDto>({
    commuteThroughDistrictName: "",
    commuteTripsPerWeek: 1,
    commuteStartHour: 8,
    commuteStopHour: 17,
    commuteMeansOfTransport: [],
  });

  const [commutes, setCommutes] = useState<AddCommuteDto[]>([]);

  const previewRows = useMemo(() => {
    const maskedPassword = registerData?.appUserPassword ? "••••••••" : "";
    return [
      { label: "Name", value: registerData?.appUserName },
      { label: "Email", value: registerData?.appUserEmail },
      { label: "Password", value: maskedPassword },
      { label: "Nationality", value: registerData?.appUserNationality },
      { label: "City", value: registerData?.appUserCity },
      { label: "Live in district", value: registerData?.appUserLiveInDistrict },
      { label: "Languages", value: (registerData?.appUserLanguagesSpoken ?? []).join(", ") },
    ];
  }, [registerData]);

  const addCommute = () => {
    const d = commuteForm.commuteThroughDistrictName.trim();
    if (!d) return;

    const start = Math.max(0, Math.min(23, commuteForm.commuteStartHour ?? 0));
    const stop = Math.max(0, Math.min(23, commuteForm.commuteStopHour ?? 0));
    const trips = Math.max(0, Math.min(50, commuteForm.commuteTripsPerWeek ?? 0));

    if (stop < start) return;

    const cleaned: AddCommuteDto = {
      commuteThroughDistrictName: d,
      commuteTripsPerWeek: trips,
      commuteStartHour: start,
      commuteStopHour: stop,
      commuteMeansOfTransport: commuteForm.commuteMeansOfTransport ?? [],
    };

    setCommutes((prev) => [...prev, cleaned]);

    setCommuteForm({
      commuteThroughDistrictName: "",
      commuteTripsPerWeek: 1,
      commuteStartHour: 8,
      commuteStopHour: 17,
      commuteMeansOfTransport: [],
    });
  };

  const removeCommute = (index: number) => {
    setCommutes((prev) => prev.filter((_, i) => i !== index));
  };

  const finalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerData?.appUserEmail) {
      alert("Brak appUserEmail (nie przeszedł ze strony 1).");
      return;
    }

    if (commutes.length === 0) {
      alert("Dodaj przynajmniej jeden commute (kliknij Add commute).");
      return;
    }

    const lastCommute = commutes[commutes.length - 1];

    const url = new URL("http://localhost:8080/auth/addCommute");
    url.searchParams.set("appUserEmail", registerData.appUserEmail);

    try {
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(lastCommute),
      });

      if (!res.ok) {
        alert(`Błąd ${res.status}: ${res.statusText}`);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json().catch(() => null);
      console.log("Response from server:\n", data);

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const isAddDisabled =
    !commuteForm.commuteThroughDistrictName.trim() ||
    (commuteForm.commuteStopHour ?? 0) < (commuteForm.commuteStartHour ?? 0);

  return (
    <AuthShell title="Sign Up - Add Commutes" cardClassName={styles.authCardRegister}>
      <div className={styles.registerGrid}>
        <AuthImagePanel src={streetArtBrown} alt="art" imgClassName={styles.imageFill420} />

        <div className={styles.stackCol}>
          <div className={styles.previewPanel}>
            <div className={styles.sectionTitle}>Podgląd danych (Page 1)</div>

            <div className={styles.previewRows}>
              {previewRows.map((r) => (
                <div key={r.label} className={styles.previewRow}>
                  <span className={styles.previewLabel}>{r.label}</span>
                  <span className={styles.previewValue} title={String(r.value ?? "")}>
                    {r.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.commutePanel}>
            <div className={styles.sectionTitle}>Dodaj przejazd (Commute)</div>

            <div style={{ display: "grid", gap: 12 }}>
              <div className={styles.fieldStack}>
                <label className={styles.fieldLabel}>Commute through district</label>
                <Dropdown
                  value={commuteForm.commuteThroughDistrictName}
                  options={DISTRICT_OPTIONS as any}
                  onChange={(e) => setCommuteForm((p) => ({ ...p, commuteThroughDistrictName: e.value ?? "" }))}
                  placeholder="Select district"
                  className={styles.fullWidth}
                  filter
                  showClear
                />
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldStack}>
                  <label className={styles.fieldLabel}>Trips per week</label>
                  <InputNumber
                    value={commuteForm.commuteTripsPerWeek}
                    onValueChange={(e) => setCommuteForm((p) => ({ ...p, commuteTripsPerWeek: Number(e.value ?? 0) }))}
                    min={0}
                    max={50}
                    className={styles.fullWidth}
                    inputStyle={{ width: "100%" }}
                  />
                </div>

                <div className={styles.fieldStack}>
                  <label className={styles.fieldLabel}>Means of transport</label>
                  <MultiSelect
                    value={commuteForm.commuteMeansOfTransport}
                    options={TRANSPORT_OPTIONS as any}
                    onChange={(e) => setCommuteForm((p) => ({ ...p, commuteMeansOfTransport: e.value }))}
                    display="chip"
                    placeholder="Select transport"
                    className={styles.fullWidth}
                  />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldStack}>
                  <label className={styles.fieldLabel}>Start time</label>
                  <Dropdown
                    value={commuteForm.commuteStartHour}
                    options={HOUR_OPTIONS as any}
                    onChange={(e) => setCommuteForm((p) => ({ ...p, commuteStartHour: Number(e.value ?? 0) }))}
                    placeholder="00:00"
                    className={styles.fullWidth}
                  />
                </div>

                <div className={styles.fieldStack}>
                  <label className={styles.fieldLabel}>Stop time</label>
                  <Dropdown
                    value={commuteForm.commuteStopHour}
                    options={HOUR_OPTIONS as any}
                    onChange={(e) => setCommuteForm((p) => ({ ...p, commuteStopHour: Number(e.value ?? 0) }))}
                    placeholder="00:00"
                    className={styles.fullWidth}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Button type="button" label="Add commute" icon="pi pi-plus" onClick={addCommute} disabled={isAddDisabled} />
              </div>

              {(commuteForm.commuteStopHour ?? 0) < (commuteForm.commuteStartHour ?? 0) && (
                <small style={{ color: "#ffd6d6" }}>Stop time nie może być wcześniejszy niż Start time.</small>
              )}

              <Divider style={{ margin: "16px 0", opacity: 0.4 }} />

              <div style={{ fontWeight: 700, marginBottom: 10 }}>Twoje commutes</div>

              <div className={styles.tableShell}>
                <DataTable
                  value={commutes.map((c, idx) => ({ ...c, _idx: idx }))}
                  emptyMessage="No commutes added yet."
                  size="small"
                  style={{ background: "transparent" }}
                >
                  <Column field="commuteThroughDistrictName" header="District" />
                  <Column field="commuteTripsPerWeek" header="Trips/week" />
                  <Column field="commuteStartHour" header="Start" />
                  <Column field="commuteStopHour" header="Stop" />
                  <Column header="Transport" body={(row) => (row.commuteMeansOfTransport ?? []).join(", ")} />
                  <Column
                    header=""
                    body={(row) => (
                      <Button type="button" icon="pi pi-trash" severity="danger" text onClick={() => removeCommute(row._idx)} />
                    )}
                    style={{ width: 60 }}
                  />
                </DataTable>
              </div>
            </div>
          </div>

          <div className={styles.centerRow}>
            <Button label="Register" icon="pi pi-check" onClick={finalSubmit} className={styles.registerBtnGreen} />
          </div>
        </div>
      </div>
    </AuthShell>
  );
};
