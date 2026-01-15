import React, { useMemo, useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Divider } from "primereact/divider";
import streetArtBrown from "../images/streetArtBrown.jpeg";

<img
  src={streetArtBrown}
  alt="art"
  style={{
    width: "100%",
    height: 420,
    objectFit: "cover",
    borderRadius: 10,
    display: "block",
  }}
/>


/** Dopasuj do swojego DTO z Page 1 */
export type RegisterDto = {
  appUserName: string;
  appUserEmail: string;
  appUserPassword: string;
  appUserNationality: string;
  appUserLanguagesSpoken: string[];
  appUserCity: string;
  appUserLiveInDistrict: string;
};

export type MeansOfTransport =
  | "WALK"
  | "BIKE"
  | "CAR"
  | "TRAM"
  | "BUS"
  | "TRAIN"
  | "METRO";

export type AddCommuteDto = {
  commuteThroughDistrictName: string;
  commuteTripsPerWeek: number;
  commuteStartHour: number;
  commuteStopHour: number;
  commuteMeansOfTransport: MeansOfTransport[];
};

type RegisterPage2Props = {
  /** dane z Register Page 1 */
  registerData: RegisterDto;

  /** opcjonalnie: np. żeby wrócić do Page 1 */
  onBack?: () => void;

  /** opcjonalnie: callback po finalnym submit */
  onRegister?: (payload: { register: RegisterDto; commutes: AddCommuteDto[] }) => void;
};

export const RegisterPage2: React.FC<RegisterPage2Props> = ({
  registerData,
  onBack,
  onRegister,
}) => {
  const [commuteForm, setCommuteForm] = useState<AddCommuteDto>({
    commuteThroughDistrictName: "",
    commuteTripsPerWeek: 1,
    commuteStartHour: 8,
    commuteStopHour: 17,
    commuteMeansOfTransport: [],
  });

  const [commutes, setCommutes] = useState<AddCommuteDto[]>([]);

  const transportOptions = useMemo(
    () => [
      { label: "Walk", value: "WALK" },
      { label: "Bike", value: "BIKE" },
      { label: "Car", value: "CAR" },
      { label: "Tram", value: "TRAM" },
      { label: "Bus", value: "BUS" },
      { label: "Train", value: "TRAIN" },
      { label: "Metro", value: "METRO" },
    ],
    []
  );

  const previewRows = useMemo(() => {
    const maskedPassword = registerData.appUserPassword ? "••••••••" : "";
    return [
      { label: "Name", value: registerData.appUserName },
      { label: "Email", value: registerData.appUserEmail },
      { label: "Password", value: maskedPassword },
      { label: "Nationality", value: registerData.appUserNationality },
      { label: "City", value: registerData.appUserCity },
      { label: "Live in district", value: registerData.appUserLiveInDistrict },
      {
        label: "Languages",
        value: (registerData.appUserLanguagesSpoken ?? []).join(", "),
      },
    ];
  }, [registerData]);

  const addCommute = () => {
    const d = commuteForm.commuteThroughDistrictName.trim();
    if (!d) return;

    // minimalna walidacja
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

    // reset lekki
    setCommuteForm((p) => ({
      ...p,
      commuteThroughDistrictName: "",
      commuteTripsPerWeek: 1,
      commuteStartHour: 8,
      commuteStopHour: 17,
      commuteMeansOfTransport: [],
    }));
  };

  const removeCommute = (index: number) => {
    setCommutes((prev) => prev.filter((_, i) => i !== index));
  };

  const finalSubmit = () => {
    const payload = { register: registerData, commutes };

    // to co chciałeś: body w konsoli
    console.log("FINAL REGISTER BODY (JSON):\n", JSON.stringify(payload, null, 2));

    onRegister?.(payload);
  };

  const isAddDisabled =
    !commuteForm.commuteThroughDistrictName.trim() ||
    (commuteForm.commuteStopHour ?? 0) < (commuteForm.commuteStartHour ?? 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f4f5f7",
      }}
    >
      <Card
        title="Register Page - 2"
        style={{
          width: "min(980px, 96vw)",
          background: "#4b55a3", // niebiesko-fiolet jak na szkicu
          color: "white",
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
          {/* LEFT: obrazek */}
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 12,
              minHeight: 420,
            }}
          >
            <img
              src="{streetArtBrown}"
              alt="art"
              style={{
                width: "100%",
                height: 420,
                objectFit: "cover",
                borderRadius: 10,
                display: "block",
              }}
            />
          </div>

          {/* RIGHT: preview + commute form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* przyciemnione okno / preview */}
            <div
              style={{
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 10 }}>
                Podgląd danych (Page 1)
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {previewRows.map((r) => (
                  <div
                    key={r.label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "140px 1fr",
                      gap: 10,
                      alignItems: "center",
                      fontSize: 14,
                    }}
                  >
                    <span style={{ opacity: 0.9 }}>{r.label}</span>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.10)",
                        borderRadius: 8,
                        padding: "6px 10px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={String(r.value ?? "")}
                    >
                      {r.value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* commute form */}
            <div
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 10 }}>
                Dodaj przejazd (Commute)
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <span className="p-float-label">
                  <InputText
                    id="districtThrough"
                    value={commuteForm.commuteThroughDistrictName}
                    onChange={(e) =>
                      setCommuteForm((p) => ({
                        ...p,
                        commuteThroughDistrictName: e.target.value,
                      }))
                    }
                    style={{ width: "100%" }}
                  />
                  <label htmlFor="districtThrough">Commute through district</label>
                </span>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <span className="p-float-label">
                    <InputNumber
                      id="trips"
                      value={commuteForm.commuteTripsPerWeek}
                      onValueChange={(e) =>
                        setCommuteForm((p) => ({
                          ...p,
                          commuteTripsPerWeek: Number(e.value ?? 0),
                        }))
                      }
                      min={0}
                      max={50}
                      style={{ width: "100%" }}
                      inputStyle={{ width: "100%" }}
                    />
                    <label htmlFor="trips">Trips per week</label>
                  </span>

                  <span className="p-float-label">
                    <MultiSelect
                      id="transport"
                      value={commuteForm.commuteMeansOfTransport}
                      options={transportOptions}
                      onChange={(e) =>
                        setCommuteForm((p) => ({
                          ...p,
                          commuteMeansOfTransport: e.value,
                        }))
                      }
                      display="chip"
                      placeholder="Select transport"
                      style={{ width: "100%" }}
                    />
                    <label htmlFor="transport">Means of transport</label>
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <span className="p-float-label">
                    <InputNumber
                      id="startHour"
                      value={commuteForm.commuteStartHour}
                      onValueChange={(e) =>
                        setCommuteForm((p) => ({
                          ...p,
                          commuteStartHour: Number(e.value ?? 0),
                        }))
                      }
                      min={0}
                      max={23}
                      style={{ width: "100%" }}
                      inputStyle={{ width: "100%" }}
                    />
                    <label htmlFor="startHour">Start hour (0-23)</label>
                  </span>

                  <span className="p-float-label">
                    <InputNumber
                      id="stopHour"
                      value={commuteForm.commuteStopHour}
                      onValueChange={(e) =>
                        setCommuteForm((p) => ({
                          ...p,
                          commuteStopHour: Number(e.value ?? 0),
                        }))
                      }
                      min={0}
                      max={23}
                      style={{ width: "100%" }}
                      inputStyle={{ width: "100%" }}
                    />
                    <label htmlFor="stopHour">Stop hour (0-23)</label>
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  {onBack && (
                    <Button
                      type="button"
                      label="Back"
                      icon="pi pi-arrow-left"
                      severity="secondary"
                      onClick={onBack}
                    />
                  )}
                  <Button
                    type="button"
                    label="Add commute"
                    icon="pi pi-plus"
                    onClick={addCommute}
                    disabled={isAddDisabled}
                  />
                </div>

                {(commuteForm.commuteStopHour ?? 0) < (commuteForm.commuteStartHour ?? 0) && (
                  <small style={{ color: "#ffd6d6" }}>
                    Stop hour nie może być mniejszy niż Start hour.
                  </small>
                )}
              </div>

              <Divider style={{ margin: "16px 0", opacity: 0.4 }} />

              <div style={{ fontWeight: 700, marginBottom: 10 }}>Twoje commutes</div>

              <div
                style={{
                  background: "rgba(0,0,0,0.18)",
                  borderRadius: 12,
                  padding: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
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
                  <Column
                    header="Transport"
                    body={(row) => (row.commuteMeansOfTransport ?? []).join(", ")}
                  />
                  <Column
                    header=""
                    body={(row) => (
                      <Button
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        onClick={() => removeCommute(row._idx)}
                      />
                    )}
                    style={{ width: 60 }}
                  />
                </DataTable>
              </div>
            </div>
          </div>
        </div>

        {/* FINAL REGISTER BUTTON */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <Button
            label="Register"
            icon="pi pi-check"
            onClick={finalSubmit}
            style={{
              background: "#7ee081",
              borderColor: "#7ee081",
              color: "#1b1b1b",
              fontWeight: 700,
              paddingInline: 26,
            }}
          />
        </div>
      </Card>
    </div>
  );
};
