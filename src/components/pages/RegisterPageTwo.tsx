import React, { useMemo, useState } from "react";
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Divider } from "primereact/divider";
import { Dropdown } from "primereact/dropdown";
import { useNavigate, useLocation } from "react-router-dom";
import type { RegisterDto } from "../dto/auth/RegisterDto";
import type { AddCommuteDto } from "../dto/commute/AddCommuteDto";

import streetArtBrown from "../images/streetArtBrown.jpeg";
import styles from "../../styles/pages.module.css";

import { AuthShell } from "../../widgets/auth/AutoShell";
import { AuthImagePanel } from "../../widgets/auth/ImagePanel";

import { DISTRICT_OPTIONS, HOUR_OPTIONS, TRANSPORT_OPTIONS } from "../constants/Options";

type CommuteErrors = Partial<Record<keyof AddCommuteDto, string>>;

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
  const [touchedAdd, setTouchedAdd] = useState(false);

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

  const validateCommute = (c: AddCommuteDto): CommuteErrors => {
    const e: CommuteErrors = {};

    const district = c.commuteThroughDistrictName?.trim() ?? "";
    if (!district) e.commuteThroughDistrictName = "Select district.";

    const trips = Number(c.commuteTripsPerWeek ?? 0);
    if (!(trips > 0 && trips < 100)) e.commuteTripsPerWeek = "Trips per week must be > 0 and < 100.";

    const start = Number(c.commuteStartHour ?? 0);
    const stop = Number(c.commuteStopHour ?? 0);
    if (start < 0 || start > 23) e.commuteStartHour = "Start time must be between 0 and 23.";
    if (stop < 0 || stop > 23) e.commuteStopHour = "Stop time must be between 0 and 23.";

    const transport = c.commuteMeansOfTransport ?? [];
    if (!transport.length) e.commuteMeansOfTransport = "Select at least one means of transport.";

    return e;
  };

  const commuteErrors = useMemo(() => validateCommute(commuteForm), [commuteForm]);

  const isNextDay = Number(commuteForm.commuteStartHour ?? 0) >= Number(commuteForm.commuteStopHour ?? 0);

  const isAddDisabled = Object.keys(commuteErrors).length > 0;

  const addCommute = () => {
    setTouchedAdd(true);
    if (Object.keys(commuteErrors).length > 0) return;

    const d = commuteForm.commuteThroughDistrictName.trim();
    const start = Math.max(0, Math.min(23, Number(commuteForm.commuteStartHour ?? 0)));
    const stop = Math.max(0, Math.min(23, Number(commuteForm.commuteStopHour ?? 0)));
    const trips = Math.max(1, Math.min(99, Number(commuteForm.commuteTripsPerWeek ?? 1)));

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
    setTouchedAdd(false);
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
        credentials: "include",
      });

      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        alert(`Błąd ${res.status}: ${raw || res.statusText}`);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json().catch(() => null);
      console.log("Response from server:\n", data);

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const showError = (key: keyof AddCommuteDto) => touchedAdd && Boolean(commuteErrors[key]);

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
                  className={`${styles.fullWidth} ${showError("commuteThroughDistrictName") ? "p-invalid" : ""}`}
                  filter
                  showClear
                />
                {showError("commuteThroughDistrictName") ? <small className="p-error">{commuteErrors.commuteThroughDistrictName}</small> : null}
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldStack}>
                  <label className={styles.fieldLabel}>Trips per week</label>
                  <InputNumber
                    value={commuteForm.commuteTripsPerWeek}
                    onValueChange={(e) => setCommuteForm((p) => ({ ...p, commuteTripsPerWeek: Number(e.value ?? 0) }))}
                    min={1}
                    max={99}
                    className={`${styles.fullWidth} ${showError("commuteTripsPerWeek") ? "p-invalid" : ""}`}
                    inputStyle={{ width: "100%" }}
                    useGrouping={false}
                  />
                  {showError("commuteTripsPerWeek") ? <small className="p-error">{commuteErrors.commuteTripsPerWeek}</small> : null}
                </div>

                <div className={styles.fieldStack}>
                  <label className={styles.fieldLabel}>Means of transport</label>
                  <MultiSelect
                    value={commuteForm.commuteMeansOfTransport}
                    options={TRANSPORT_OPTIONS as any}
                    onChange={(e) => setCommuteForm((p) => ({ ...p, commuteMeansOfTransport: e.value }))}
                    display="chip"
                    placeholder="Select transport"
                    className={`${styles.fullWidth} ${showError("commuteMeansOfTransport") ? "p-invalid" : ""}`}
                  />
                  {showError("commuteMeansOfTransport") ? <small className="p-error">{commuteErrors.commuteMeansOfTransport}</small> : null}
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
                    className={`${styles.fullWidth} ${showError("commuteStartHour") ? "p-invalid" : ""}`}
                  />
                  {showError("commuteStartHour") ? <small className="p-error">{commuteErrors.commuteStartHour}</small> : null}
                </div>

                <div className={styles.fieldStack}>
                  <label className={styles.fieldLabel}>{isNextDay ? "Stop Time, Next Day" : "Stop time"}</label>
                  <Dropdown
                    value={commuteForm.commuteStopHour}
                    options={HOUR_OPTIONS as any}
                    onChange={(e) => setCommuteForm((p) => ({ ...p, commuteStopHour: Number(e.value ?? 0) }))}
                    placeholder="00:00"
                    className={`${styles.fullWidth} ${showError("commuteStopHour") ? "p-invalid" : ""}`}
                  />
                  {showError("commuteStopHour") ? <small className="p-error">{commuteErrors.commuteStopHour}</small> : null}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Button type="button" label="Add commute" icon="pi pi-plus" onClick={addCommute} disabled={isAddDisabled} />
              </div>

              <Divider style={{ margin: "16px 0", opacity: 0.4 }} />

              <div style={{ fontWeight: 700, marginBottom: 10 }}>Twoje commutes</div>

              <div className={styles.tableShell}>
                <DataTable value={commutes.map((c, idx) => ({ ...c, _idx: idx }))} emptyMessage="No commutes added yet." size="small" style={{ background: "transparent" }}>
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