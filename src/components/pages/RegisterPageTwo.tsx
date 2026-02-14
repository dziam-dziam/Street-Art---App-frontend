import React, { useMemo, useState } from "react";
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Dropdown } from "primereact/dropdown";
import { Carousel } from "primereact/carousel";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type { RegisterDto } from "../dto/auth/RegisterDto";
import type { AddCommuteDto } from "../dto/commute/AddCommuteDto";

import streetArtBrown from "../images/streetArtBrown.jpeg";
import styles from "../../styles/pages.module.css";

import { AuthShell } from "../../widgets/auth/AutoShell";
import { AuthImagePanel } from "../../widgets/auth/ImagePanel";
import { LanguageSwitch } from "../../widgets/LanguageSwitch";

import { DISTRICT_OPTIONS, HOUR_OPTIONS, TRANSPORT_OPTIONS } from "../constants/Options";

type CommuteErrors = Partial<Record<keyof AddCommuteDto, string>>;

export const RegisterPageTwo: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const MAX_COMMUTES = 7;
  const [limitError, setLimitError] = useState<string | null>(null);

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
      { label: t("auth.name"), value: registerData?.appUserName },
      { label: t("auth.email"), value: registerData?.appUserEmail },
      { label: t("auth.password"), value: maskedPassword },
      { label: t("auth.nationality"), value: registerData?.appUserNationality },
      { label: t("auth.city"), value: registerData?.appUserCity },
      { label: t("auth.liveInDistrict"), value: registerData?.appUserLiveInDistrict },
      { label: t("auth.languagesSpoken"), value: (registerData?.appUserLanguagesSpoken ?? []).join(", ") },
    ];
  }, [registerData, t]);

  const validateCommute = (c: AddCommuteDto): CommuteErrors => {
    const e: CommuteErrors = {};

    const district = c.commuteThroughDistrictName?.trim() ?? "";
    if (!district) e.commuteThroughDistrictName = t("register2.selectDistrict");

    const trips = Number(c.commuteTripsPerWeek ?? 0);
    if (!(trips > 0 && trips < 100)) e.commuteTripsPerWeek = t("register2.tripsRange");

    const start = Number(c.commuteStartHour ?? 0);
    const stop = Number(c.commuteStopHour ?? 0);
    if (start < 0 || start > 23) e.commuteStartHour = t("register2.timeRange");
    if (stop < 0 || stop > 23) e.commuteStopHour = t("register2.timeRange");

    const transport = c.commuteMeansOfTransport ?? [];
    if (!transport.length) e.commuteMeansOfTransport = t("register2.selectTransport");

    return e;
  };

  const commuteErrors = useMemo(() => validateCommute(commuteForm), [commuteForm]);
  const isNextDay = Number(commuteForm.commuteStartHour ?? 0) >= Number(commuteForm.commuteStopHour ?? 0);

  const isMaxReached = commutes.length >= MAX_COMMUTES;
  const isAddDisabled = Object.keys(commuteErrors).length > 0 || isMaxReached;

  const addCommute = () => {
    setTouchedAdd(true);

    if (commutes.length >= MAX_COMMUTES) {
      setLimitError(t("register2.limitMax", { max: MAX_COMMUTES }));
      return;
    }

    if (Object.keys(commuteErrors).length > 0) return;

    setLimitError(null);

    const d = (commuteForm.commuteThroughDistrictName ?? "").trim();
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
    setCommutes((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length < MAX_COMMUTES) setLimitError(null);
      return next;
    });
  };

  const finalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerData?.appUserEmail) {
      alert(t("register2.missingEmail"));
      return;
    }

    if (commutes.length === 0) {
      alert(t("register2.addAtLeastOne"));
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
        alert(`${t("common.error")} ${res.status}: ${raw || res.statusText}`);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      await res.json().catch(() => null);
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Fetch error:", err);
      alert(t("validation.networkError"));
    }
  };

  const showError = (key: keyof AddCommuteDto) => touchedAdd && Boolean(commuteErrors[key]);

  const commuteCarouselItem = (c: AddCommuteDto & { _idx: number }) => {
    const transport = (c.commuteMeansOfTransport ?? []).join(", ");
    const start = String(c.commuteStartHour ?? "").padStart(2, "0") + ":00";
    const stop = String(c.commuteStopHour ?? "").padStart(2, "0") + ":00";

    return (
      <div className={styles.commuteCard}>
        <div className={styles.commuteCardTop}>
          <div className={styles.commuteCardTitle}>{c.commuteThroughDistrictName || "—"}</div>

          <button
            type="button"
            className={styles.commuteRemoveX}
            onClick={() => removeCommute(c._idx)}
            aria-label={t("register2.removeCommute")}
            title={t("register2.remove")}
          >
            ×
          </button>
        </div>

        <div className={styles.commuteCardMeta}>
          <div>
            <b>{t("register2.tripsPerWeek")}:</b> {c.commuteTripsPerWeek}
          </div>
          <div>
            <b>{t("register2.start")}:</b> {start}
          </div>
          <div>
            <b>{t("register2.stop")}:</b> {stop}
          </div>
        </div>

        <div className={styles.commuteCardTransport} title={transport}>
          <b>{t("register2.transport")}:</b> {transport || "—"}
        </div>
      </div>
    );
  };

  return (
    <AuthShell title={t("register2.title")} cardClassName={styles.authCardRegister}>
      <LanguageSwitch />

      <div className={styles.registerGrid}>
        <AuthImagePanel src={streetArtBrown} alt="art" imgClassName={styles.imageFill420} />

        <div className={styles.stackCol}>
          <div className={styles.commutePanel}>
            <div className={styles.sectionTitle}>{t("register2.question")}</div>

            <div style={{ display: "grid", gap: 12 }}>
              <div className={styles.fieldStack}>
                <label className={styles.fieldLabel}>{t("register2.commuteDistrict")}</label>
                <Dropdown
                  value={commuteForm.commuteThroughDistrictName}
                  options={DISTRICT_OPTIONS as any}
                  onChange={(e) => setCommuteForm((p) => ({ ...p, commuteThroughDistrictName: e.value ?? "" }))}
                  placeholder={t("register2.selectDistrictPlaceholder")}
                  className={`${styles.fullWidth} ${showError("commuteThroughDistrictName") ? "p-invalid" : ""}`}
                  filter
                  showClear
                />
                {showError("commuteThroughDistrictName") ? (
                  <small className="p-error">{commuteErrors.commuteThroughDistrictName}</small>
                ) : null}
              </div>

              <div className={styles.gridTripsTransport}>
                <div className={`${styles.fieldStack} ${styles.tripsNumber}`}>
                  <label className={styles.fieldLabel}>{t("register2.tripsPerWeek")}</label>
                  <InputNumber
                    value={commuteForm.commuteTripsPerWeek}
                    onValueChange={(e) => setCommuteForm((p) => ({ ...p, commuteTripsPerWeek: Number(e.value ?? 0) }))}
                    min={1}
                    max={99}
                    className={`${styles.fullWidth} ${showError("commuteTripsPerWeek") ? "p-invalid" : ""}`}
                    useGrouping={false}
                  />
                  {showError("commuteTripsPerWeek") ? <small className="p-error">{commuteErrors.commuteTripsPerWeek}</small> : null}
                </div>

                <div className={styles.fieldStack}>
                  <label className={styles.fieldLabel}>{t("register2.transport")}</label>
                  <MultiSelect
                    value={commuteForm.commuteMeansOfTransport}
                    options={TRANSPORT_OPTIONS as any}
                    onChange={(e) => setCommuteForm((p) => ({ ...p, commuteMeansOfTransport: e.value }))}
                    display="chip"
                    placeholder={t("register2.selectTransportPlaceholder")}
                    className={`${styles.fullWidth} ${showError("commuteMeansOfTransport") ? "p-invalid" : ""}`}
                  />
                  {showError("commuteMeansOfTransport") ? (
                    <small className="p-error">{commuteErrors.commuteMeansOfTransport}</small>
                  ) : null}
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.fieldStack}>
                  <label className={styles.fieldLabel}>{t("register2.startTime")}</label>
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
                  <label className={styles.fieldLabel}>
                    {isNextDay ? t("register2.stopTimeNextDay") : t("register2.stopTime")}
                  </label>
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
                <Button
                  type="button"
                  label={t("register2.addCommute")}
                  icon="pi pi-plus"
                  onClick={addCommute}
                  disabled={isAddDisabled}
                />
              </div>

              {limitError ? <small className="p-error">{limitError}</small> : null}
              {isMaxReached ? (
                <small className="p-error">{t("register2.limitReached", { max: MAX_COMMUTES })}</small>
              ) : null}

              <Divider style={{ margin: "16px 0", opacity: 0.4 }} />

              <div style={{ fontWeight: 700, marginBottom: 10 }}>{t("register2.yourCommutes")}</div>

              <div className={styles.commuteCarouselShell}>
                <div className={styles.commuteCarouselHeader}>
                  <span>{t("register2.savedCommutes")}</span>
                  <span className={styles.commuteCarouselCount}>{commutes.length}</span>
                </div>

                {commutes.length === 0 ? (
                  <div className={styles.emptyCommutes}>{t("register2.noCommutes")}</div>
                ) : (
                  <Carousel
                    value={commutes.map((c, idx) => ({ ...c, _idx: idx }))}
                    numVisible={1}
                    numScroll={1}
                    circular={false}
                    showIndicators={true}
                    showNavigators={true}
                    itemTemplate={commuteCarouselItem as any}
                  />
                )}
              </div>
            </div>
          </div>

          <div className={styles.centerRow}>
            <Button
              label={t("register2.register")}
              icon="pi pi-check"
              onClick={finalSubmit}
              className={styles.registerBtnGreen}
            />
          </div>
        </div>
      </div>
    </AuthShell>
  );
};