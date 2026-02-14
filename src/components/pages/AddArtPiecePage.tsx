import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { ToggleButton } from "primereact/togglebutton";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";

import styles from "../../styles/pages.module.css";

import { AddArtPiecePhotoPanel } from "../../widgets/artpiece/AddArtPieceWidgets";
import { DISTRICT_OPTIONS, ART_TYPE_OPTIONS, ART_STYLE_OPTIONS, LANGUAGE_OPTIONS } from "../constants/Options";
import type { AddArtPieceDto } from "../dto/artpiece/AddArtPieceDto";

import { useTranslation } from "react-i18next";

type Errors = Partial<Record<keyof AddArtPieceDto, string>>;

const MAX_NAME = 50;
const MAX_POS = 50;
const MAX_DESC = 200;

type CreatedArtPieceDto = { id: number };

export const AddArtPiecePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  const { t, i18n } = useTranslation();
  const activeLang = (i18n.language || "pl").toLowerCase().startsWith("pl") ? "pl" : "en";
  const setLang = (lng: "pl" | "en") => void i18n.changeLanguage(lng);

  const [addArtPieceForm, setForm] = useState<AddArtPieceDto>({
    artPieceAddress: "",
    artPieceName: "Anonymous",
    artPieceContainsText: false,
    artPiecePosition: "",
    artPieceUserDescription: "",
    artPieceDistrict: "",
    artPieceCity: "Poznań",
    artPieceTypes: [],
    artPieceStyles: [],
    artPieceTextLanguages: [],
  });

  const [touched, setTouched] = useState<Partial<Record<keyof AddArtPieceDto, boolean>>>({});
  const markTouched = (k: keyof AddArtPieceDto) => setTouched((p) => ({ ...p, [k]: true }));
  const showErr = (k: keyof AddArtPieceDto, errors: Errors) => Boolean(touched[k] && errors[k]);

  const [addressStatus, setAddressStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [addressHint, setAddressHint] = useState("");

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPhotos = (files: File[]) => {
    const next = [...photoFiles, ...files];

    photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    const urls = next.map((f) => URL.createObjectURL(f));

    setPhotoFiles(next);
    setPhotoPreviewUrls(urls);
  };

  const removePhotoAt = (idx: number) => {
    const next = photoFiles.filter((_, i) => i !== idx);

    photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    const urls = next.map((f) => URL.createObjectURL(f));

    setPhotoFiles(next);
    setPhotoPreviewUrls(urls);
  };

  const clearAllPhotos = () => {
    photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    setPhotoFiles([]);
    setPhotoPreviewUrls([]);
  };

  const validate = (v: AddArtPieceDto): Errors => {
    const e: Errors = {};

    const name = v.artPieceName.trim();
    if (!name) e.artPieceName = t("validation.nameRequired");
    else if (name.length > MAX_NAME) e.artPieceName = t("validation.maxChars", { max: MAX_NAME });

    const addr = v.artPieceAddress.trim();
    if (!addr) e.artPieceAddress = t("validation.addressRequired");

    const pos = v.artPiecePosition.trim();
    if (pos.length > MAX_POS) e.artPiecePosition = t("validation.positionMax", { max: MAX_POS });

    const district = v.artPieceDistrict?.trim() ?? "";
    if (!district) e.artPieceDistrict = t("validation.districtRequired");

    if (!v.artPieceTypes || v.artPieceTypes.length === 0) e.artPieceTypes = t("validation.selectAtLeastOne");
    if (!v.artPieceStyles || v.artPieceStyles.length === 0) e.artPieceStyles = t("validation.selectAtLeastOne");

    const desc = v.artPieceUserDescription.trim();
    if (desc.length > MAX_DESC) e.artPieceUserDescription = t("validation.descMax", { max: MAX_DESC });

    if (v.artPieceContainsText && (!v.artPieceTextLanguages || v.artPieceTextLanguages.length === 0)) {
      e.artPieceTextLanguages = t("validation.selectAtLeastOne");
    }

    return e;
  };

  const errors = useMemo(() => validate(addArtPieceForm), [addArtPieceForm]);
  const canSubmitBase = Object.keys(errors).length === 0;

  const shouldShowAddressHint = !errors.artPieceAddress && addArtPieceForm.artPieceAddress.trim().length > 0;

  const validateAddressWithNominatim = async () => {
    const addr = addArtPieceForm.artPieceAddress.trim();

    if (!addr) {
      setAddressStatus("idle");
      setAddressHint("");
      return false;
    }

    setAddressStatus("checking");
    setAddressHint(t("addArtpiece.addressChecking"));

    try {
      const q = `${addr}, ${addArtPieceForm.artPieceCity || "Poznań"}, Poland`;

      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "json");
      url.searchParams.set("q", q);
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "1");

      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      if (!res.ok) {
        setAddressStatus("invalid");
        setAddressHint(t("addArtpiece.addressVerifyFail"));
        return false;
      }

      const data = (await res.json()) as any[];
      if (!Array.isArray(data) || data.length === 0) {
        setAddressStatus("invalid");
        setAddressHint(t("addArtpiece.addressNotFound"));
        return false;
      }

      const display = String(data[0]?.display_name ?? "");
      const inPoznan = display.toLowerCase().includes("poznań") || display.toLowerCase().includes("poznan");
      if (!inPoznan) {
        setAddressStatus("invalid");
        setAddressHint(t("addArtpiece.addressNotPoznan"));
        return false;
      }

      setAddressStatus("valid");
      setAddressHint(t("addArtpiece.addressValid"));
      return true;
    } catch {
      setAddressStatus("invalid");
      setAddressHint(t("addArtpiece.addressVerifyFail"));
      return false;
    }
  };

  const canSubmit = canSubmitBase && addressStatus === "valid";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      artPieceName: true,
      artPieceAddress: true,
      artPiecePosition: true,
      artPieceDistrict: true,
      artPieceTypes: true,
      artPieceStyles: true,
      artPieceUserDescription: true,
      artPieceTextLanguages: true,
    });

    if (!canSubmitBase) {
      toast.current?.show({
        severity: "warn",
        summary: t("toasts.fixErrorsSummary"),
        detail: t("toasts.fixErrorsDetail"),
        life: 2200,
      });
      return;
    }

    const okAddress = await validateAddressWithNominatim();
    if (!okAddress) {
      toast.current?.show({
        severity: "warn",
        summary: t("toasts.invalidAddressSummary"),
        detail: t("toasts.invalidAddressDetail"),
        life: 2500,
      });
      return;
    }

    const createUrl = "http://localhost:8080/addNew/addArtPiece";

    try {
      // 1) create art piece
      const createRes = await fetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(addArtPieceForm),
        credentials: "include",
      });

      if (!createRes.ok) {
        const body = await createRes.text().catch(() => "");
        throw new Error(`Failed to add art piece: ${createRes.status} ${body}`);
      }

      const created = (await createRes.json().catch(() => null)) as CreatedArtPieceDto | null;
      const artPieceId = created?.id;

      if (!artPieceId) {
        throw new Error(t("addArtpiece.noIdReturned"));
      }

      // 2) upload photos (if any)
      if (photoFiles.length > 0) {
        await Promise.all(
          photoFiles.map(async (file) => {
            const fd = new FormData();
            fd.append("image", file);

            const upRes = await fetch(`http://localhost:8080/api/photos/upload/${artPieceId}/photos`, {
              method: "POST",
              body: fd,
              credentials: "include",
            });

            if (!upRes.ok) {
              const body = await upRes.text().catch(() => "");
              throw new Error(`Photo upload failed: ${upRes.status} ${body}`);
            }
          })
        );
      }

      toast.current?.show({
        severity: "success",
        summary: t("addArtpiece.successSummary"),
        detail: photoFiles.length > 0 ? t("addArtpiece.successWithPhotos") : t("addArtpiece.successNoPhotos"),
        life: 2200,
      });

      setTimeout(() => navigate("/app", { replace: true }), 990);
    } catch (error: any) {
      console.error("Error during adding art piece:", error);

      toast.current?.show({
        severity: "error",
        summary: t("addArtpiece.errorSummary"),
        detail: error?.message ?? t("addArtpiece.errorGeneric"),
        life: 3200,
      });
    }
  };

  return (
    <div className={styles.pageCenter}>
      <Toast ref={toast} position="center" />

      {/* language switch */}
      <div style={{ position: "absolute", top: 18, right: 18, display: "flex", gap: 8, zIndex: 5 }}>
        <Button
          label={t("common.pl")}
          size="small"
          outlined={activeLang !== "pl"}
          onClick={() => setLang("pl")}
          className={activeLang !== "pl" ? styles.langBtnInactive : ""}
        />
        <Button
          label={t("common.en")}
          size="small"
          outlined={activeLang !== "en"}
          onClick={() => setLang("en")}
          className={activeLang !== "en" ? styles.langBtnInactive : ""}
        />
      </div>

      <Card title={t("addArtpiece.title")} className={styles.cardShell}>
        <div className={styles.twoColGrid}>
          <AddArtPiecePhotoPanel
            onBack={() => navigate(-1)}
            previewUrls={photoPreviewUrls}
            onFilesSelected={addPhotos}
            onRemoveAt={removePhotoAt}
            onClearAll={clearAllPhotos}
          />

          <form onSubmit={onSubmit} className={styles.formPanel}>
            {/* Name */}
            <div className={styles.fieldStack}>
              <InputText
                value={addArtPieceForm.artPieceName}
                onChange={(e) => setForm((p) => ({ ...p, artPieceName: e.target.value }))}
                onBlur={() => markTouched("artPieceName")}
                placeholder={t("addArtpiece.placeholders.name")}
                className={`${styles.fullWidth} ${styles.radius10} ${showErr("artPieceName", errors) ? "p-invalid" : ""}`}
              />
              {showErr("artPieceName", errors) ? <small className="p-error">{errors.artPieceName}</small> : null}
              <small style={{ opacity: 0.85 }}>
                {addArtPieceForm.artPieceName.trim().length}/{MAX_NAME}
              </small>
            </div>

            {/* Address */}
            <div className={styles.fieldStack}>
              <InputText
                value={addArtPieceForm.artPieceAddress}
                onChange={(e) => {
                  setForm((p) => ({ ...p, artPieceAddress: e.target.value }));
                  setAddressStatus("idle");
                  setAddressHint("");
                }}
                onBlur={() => {
                  markTouched("artPieceAddress");
                  void validateAddressWithNominatim();
                }}
                placeholder={t("addArtpiece.placeholders.address")}
                className={`${styles.fullWidth} ${styles.radius10} ${
                  showErr("artPieceAddress", errors) || (shouldShowAddressHint && addressStatus === "invalid") ? "p-invalid" : ""
                }`}
              />

              {showErr("artPieceAddress", errors) ? <small className="p-error">{errors.artPieceAddress}</small> : null}

              {shouldShowAddressHint && addressStatus === "checking" ? <small style={{ opacity: 0.9 }}>{addressHint}</small> : null}
              {shouldShowAddressHint && addressStatus === "valid" ? <small style={{ opacity: 0.95 }}>{addressHint}</small> : null}
              {shouldShowAddressHint && addressStatus === "invalid" ? <small className="p-error">{addressHint}</small> : null}
            </div>

            {/* Position */}
            <div className={styles.fieldStack}>
              <InputText
                value={addArtPieceForm.artPiecePosition}
                onChange={(e) => setForm((p) => ({ ...p, artPiecePosition: e.target.value }))}
                onBlur={() => markTouched("artPiecePosition")}
                placeholder={t("addArtpiece.placeholders.position")}
                className={`${styles.fullWidth} ${styles.radius10} ${showErr("artPiecePosition", errors) ? "p-invalid" : ""}`}
              />
              {showErr("artPiecePosition", errors) ? <small className="p-error">{errors.artPiecePosition}</small> : null}
              <small style={{ opacity: 0.85 }}>
                {addArtPieceForm.artPiecePosition.trim().length}/{MAX_POS}
              </small>
            </div>

            {/* District + City */}
            <div className={styles.grid2}>
              <div className={styles.fieldStack}>
                <Dropdown
                  value={addArtPieceForm.artPieceDistrict}
                  options={DISTRICT_OPTIONS as any}
                  onChange={(e) => setForm((p) => ({ ...p, artPieceDistrict: e.value ?? "" }))}
                  onBlur={() => markTouched("artPieceDistrict")}
                  placeholder={t("placeholders.selectDistrict")}
                  className={`${styles.fullWidth} ${showErr("artPieceDistrict", errors) ? "p-invalid" : ""}`}
                  filter
                  showClear
                />
                {showErr("artPieceDistrict", errors) ? <small className="p-error">{errors.artPieceDistrict}</small> : null}
              </div>

              <InputText
                value={addArtPieceForm.artPieceCity}
                disabled
                placeholder={t("fields.city")}
                className={`${styles.fullWidth} ${styles.radius10}`}
              />
            </div>

            {/* Types */}
            <div className={styles.fieldStack}>
              <MultiSelect
                value={addArtPieceForm.artPieceTypes}
                options={ART_TYPE_OPTIONS as any}
                onChange={(e) => setForm((p) => ({ ...p, artPieceTypes: e.value }))}
                onBlur={() => markTouched("artPieceTypes")}
                placeholder={t("placeholders.selectTypes")}
                display="chip"
                className={`${styles.fullWidth} ${showErr("artPieceTypes", errors) ? "p-invalid" : ""}`}
              />
              {showErr("artPieceTypes", errors) ? <small className="p-error">{errors.artPieceTypes}</small> : null}
            </div>

            {/* Styles */}
            <div className={styles.fieldStack}>
              <MultiSelect
                value={addArtPieceForm.artPieceStyles}
                options={ART_STYLE_OPTIONS as any}
                onChange={(e) => setForm((p) => ({ ...p, artPieceStyles: e.value }))}
                onBlur={() => markTouched("artPieceStyles")}
                placeholder={t("placeholders.selectStyles")}
                display="chip"
                className={`${styles.fullWidth} ${showErr("artPieceStyles", errors) ? "p-invalid" : ""}`}
              />
              {showErr("artPieceStyles", errors) ? <small className="p-error">{errors.artPieceStyles}</small> : null}
            </div>

            {/* Contains text */}
            <div className={styles.fieldStack}>
              <label className={styles.fieldLabel}>{t("fields.containsText")}</label>

              <div style={{ display: "inline-flex", alignSelf: "flex-start" }}>
                <ToggleButton
                  checked={addArtPieceForm.artPieceContainsText}
                  onChange={(e) => {
                    const next = Boolean(e.value);
                    setForm((p) => ({
                      ...p,
                      artPieceContainsText: next,
                      artPieceTextLanguages: next ? p.artPieceTextLanguages : [],
                    }));
                    markTouched("artPieceTextLanguages");
                  }}
                  onLabel={t("toggle.yes")}
                  offLabel={t("toggle.no")}
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  pt={{
                    root: {
                      style: { padding: "6px 10px", minWidth: "auto" },
                    },
                  }}
                />
              </div>
            </div>

            {/* Languages */}
            {addArtPieceForm.artPieceContainsText && (
              <div className={styles.fieldStack}>
                <MultiSelect
                  value={addArtPieceForm.artPieceTextLanguages}
                  options={LANGUAGE_OPTIONS as any}
                  onChange={(e) => setForm((p) => ({ ...p, artPieceTextLanguages: e.value }))}
                  onBlur={() => markTouched("artPieceTextLanguages")}
                  placeholder={t("placeholders.selectLanguages")}
                  display="chip"
                  className={`${styles.fullWidth} ${showErr("artPieceTextLanguages", errors) ? "p-invalid" : ""}`}
                />
                {showErr("artPieceTextLanguages", errors) ? <small className="p-error">{errors.artPieceTextLanguages}</small> : null}
              </div>
            )}

            {/* Description */}
            <div className={styles.fieldStack}>
              <InputTextarea
                value={addArtPieceForm.artPieceUserDescription}
                onChange={(e) => setForm((p) => ({ ...p, artPieceUserDescription: e.target.value }))}
                onBlur={() => markTouched("artPieceUserDescription")}
                rows={4}
                placeholder={t("addArtpiece.placeholders.description")}
                className={`${styles.fullWidth} ${showErr("artPieceUserDescription", errors) ? "p-invalid" : ""}`}
              />
              {showErr("artPieceUserDescription", errors) ? <small className="p-error">{errors.artPieceUserDescription}</small> : null}
              <small style={{ opacity: 0.85 }}>
                {addArtPieceForm.artPieceUserDescription.trim().length}/{MAX_DESC}
              </small>
            </div>

            <div className={styles.actionsRight}>
              <Button type="button" label={t("buttons.cancel")} severity="secondary" onClick={() => navigate(-1)} />
              <Button type="submit" label={t("buttons.save")} icon="pi pi-check" disabled={!canSubmit} />
            </div>

            {!canSubmitBase ? (
              <small className="p-error">{t("addArtpiece.fixErrorsToEnableSave")}</small>
            ) : addressStatus !== "valid" ? (
              <small className="p-error">{t("addArtpiece.provideValidAddress")}</small>
            ) : null}
          </form>
        </div>
      </Card>
    </div>
  );
};
