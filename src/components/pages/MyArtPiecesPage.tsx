import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../../styles/pages.module.css";

import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Chip } from "primereact/chip";
import { Carousel } from "primereact/carousel";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { ToggleButton } from "primereact/togglebutton";
import { Divider } from "primereact/divider";

import { ART_TYPE_OPTIONS, ART_STYLE_OPTIONS, LANGUAGE_OPTIONS } from "../constants/Options";
import { useTranslation } from "react-i18next";

const BASE_URL = "http://localhost:8080";

type ArtPieceMapPointDto = {
  id: number;
  title: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
};

type PhotoResponseDto = {
  id?: number;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
  downloadUrl?: string;
};

type ArtPieceDetailsDto = {
  id: number;
  artPieceAddress: string;
  artPieceName: string;
  artPieceContainsText: boolean;
  artPiecePosition: string;
  artPieceUserDescription: string;
  districtName?: string;
  cityName?: string;
  artPieceTextLanguages: string[];
  artPieceTypes: string[];
  artPieceStyles: string[];
  photos: PhotoResponseDto[];
};

type ApErrors = {
  artPieceName?: string;
  artPieceAddress?: string;
  artPiecePosition?: string;
  artPieceUserDescription?: string;
  artPieceTypes?: string;
  artPieceStyles?: string;
  artPieceTextLanguages?: string;
};

type ApTouched = Partial<Record<keyof ApErrors, boolean>>;

export const MyArtPiecesPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

    const { t, i18n } = useTranslation();
    const activeLang = (i18n.language || "pl").toLowerCase().startsWith("pl") ? "pl" : "en";
    const setLang = (lng: "pl" | "en") => void i18n.changeLanguage(lng);

  // ----------------- LIST -----------------
  const [items, setItems] = useState<ArtPieceMapPointDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----------------- DETAILS DIALOG -----------------
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [details, setDetails] = useState<ArtPieceDetailsDto | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // ----------------- EDIT DIALOG -----------------
  
  const [editOpen, setEditOpen] = useState(false);

  const [artPieceName, setApName] = useState("");
  const [artPieceAddress, setApAddress] = useState("");
  const [artPieceUserDescription, setApUserDescription] = useState("");
  const [artPiecePosition, setApPosition] = useState("");
  const [artPieceContainsText, setApContainsText] = useState(false);
  const [artPieceTypes, setApTypes] = useState<string[]>([]);
  const [artPieceStyles, setApStyles] = useState<string[]>([]);
  const [artPieceTextLanguages, setApLangs] = useState<string[]>([]);

  const [apTouched, setApTouched] = useState<ApTouched>({});
  const markApTouched = (k: keyof ApErrors) => setApTouched((p) => ({ ...p, [k]: true }));
  const showApErr = (k: keyof ApErrors, errors: ApErrors) => Boolean(apTouched[k] && errors[k]);

  const MAX_NAME = 50;
  const MAX_POS = 50;
  const MAX_DESC = 200;

  const validateAp = useCallback((): ApErrors => {
    const e: ApErrors = {};

    const name = artPieceName.trim();
    if (!name) e.artPieceName = "Name is required.";
    else if (name.length > MAX_NAME) e.artPieceName = `Max ${MAX_NAME} chars.`;

    const addr = artPieceAddress.trim();
    if (!addr) e.artPieceAddress = "Address is required.";

    const pos = artPiecePosition.trim();
    if (pos.length > MAX_POS) e.artPiecePosition = `Max ${MAX_POS} chars.`;

    const desc = artPieceUserDescription.trim();
    if (desc.length > MAX_DESC) e.artPieceUserDescription = `Max ${MAX_DESC} chars.`;

    if (!artPieceTypes.length) e.artPieceTypes = "Select at least one type.";
    if (!artPieceStyles.length) e.artPieceStyles = "Select at least one style.";

    if (artPieceContainsText && !artPieceTextLanguages.length) {
      e.artPieceTextLanguages = "Select at least one text language.";
    }

    return e;
  }, [
    artPieceName,
    artPieceAddress,
    artPiecePosition,
    artPieceUserDescription,
    artPieceTypes,
    artPieceStyles,
    artPieceContainsText,
    artPieceTextLanguages,
  ]);

  const apErrors = useMemo(() => validateAp(), [validateAp]);
  const canSave = Object.keys(apErrors).length === 0;

    // ---- Address validator (Nominatim) ----
  const [addressStatus, setAddressStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [addressHint, setAddressHint] = useState("");

  const shouldShowAddressHint = !apErrors.artPieceAddress && artPieceAddress.trim().length > 0;

  // ----------------- FETCH LIST -----------------
  const loadMy = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/my/artPieces`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const raw = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`GET /my/artPieces failed: ${res.status}. ${raw.slice(0, 200)}`);

      const data = raw.trim() ? (JSON.parse(raw) as ArtPieceMapPointDto[]) : [];
      setItems(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Fetch error");
    } finally {
      setLoading(false);
    }
  }, []);

  // ----------------- FETCH DETAILS -----------------
  const loadDetails = useCallback(async (id: number) => {
    setLoadingDetails(true);
    setDetails(null);
    setDetailsError(null);

    try {
      const res = await fetch(`${BASE_URL}/map/artPieces/${id}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const raw = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`GET /map/artPieces/${id} failed: ${res.status}. ${raw.slice(0, 200)}`);

      setDetails(raw.trim() ? (JSON.parse(raw) as ArtPieceDetailsDto) : null);
    } catch (e: any) {
      setDetailsError(e?.message ?? "Details error");
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    void loadMy();
  }, [loadMy]);

  const selectedTitle = useMemo(() => {
    const it = items.find((x) => x.id === selectedId);
    return it?.title ?? "Details";
  }, [items, selectedId]);

  // ----------------- OPEN EDIT -----------------
  const validateAddressWithNominatim = useCallback(async () => {
    const addr = artPieceAddress.trim();

    if (!addr) {
      setAddressStatus("idle");
      setAddressHint("");
      return false;
    }

    setAddressStatus("checking");
    setAddressHint("Checking address...");

    try {
      const q = `${addr}, Poznań, Poland`;

      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "json");
      url.searchParams.set("q", q);
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "1");

      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });

      if (!res.ok) {
        setAddressStatus("invalid");
        setAddressHint("Could not verify address right now. Try again.");
        return false;
      }

      const data = (await res.json()) as any[];
      if (!Array.isArray(data) || data.length === 0) {
        setAddressStatus("invalid");
        setAddressHint("Address not found. Add street number / be more specific.");
        return false;
      }

      const display = String(data[0]?.display_name ?? "");
      const inPoznan = display.toLowerCase().includes("poznań") || display.toLowerCase().includes("poznan");
      if (!inPoznan) {
        setAddressStatus("invalid");
        setAddressHint("Found an address, but it doesn't look like Poznań.");
        return false;
      }

      setAddressStatus("valid");
      setAddressHint("Address looks valid ✅");
      return true;
    } catch {
      setAddressStatus("invalid");
      setAddressHint("Could not verify address. Check connection and try again.");
      return false;
    }
  }, [artPieceAddress]);


  const openEdit = useCallback(() => {
    setAddressStatus("idle");
    setAddressHint("");

    if (!details) return;

    setApName(details.artPieceName ?? "");
    setApAddress(details.artPieceAddress ?? "");
    setApUserDescription(details.artPieceUserDescription ?? "");
    setApPosition(details.artPiecePosition ?? "");
    setApContainsText(!!details.artPieceContainsText);

    setApTypes((details.artPieceTypes ?? []).map(String));
    setApStyles((details.artPieceStyles ?? []).map(String));
    setApLangs((details.artPieceTextLanguages ?? []).map(String));

    setApTouched({});
    setEditOpen(true);
  }, [details]);

  // ----------------- SAVE EDIT -----------------
  const saveEdit = useCallback(async () => {
    const id = selectedId ?? details?.id;
    if (!id) return;

    setApTouched({
      artPieceName: true,
      artPieceAddress: true,
      artPiecePosition: true,
      artPieceUserDescription: true,
      artPieceTypes: true,
      artPieceStyles: true,
      artPieceTextLanguages: true,
    });

    if (!canSave) {
      toast.current?.show({
        severity: "warn",
        summary: "Fix errors",
        detail: "Please correct highlighted fields.",
        life: 2200,
      });
      return;
    }
        const okAddress = await validateAddressWithNominatim();
    if (!okAddress) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid address",
        detail: "Please provide a valid address in Poznań.",
        life: 2500,
      });
      return;
    }


    try {
      const body = {
        artPieceCity: "Poznań",
        artPieceAddress: artPieceAddress.trim(),
        artPieceName: artPieceName.trim(),
        artPieceUserDescription: artPieceUserDescription.trim(),
        artPiecePosition: artPiecePosition.trim(),
        artPieceContainsText,
        artPieceTypes,
        artPieceStyles,
        artPieceTextLanguages: artPieceContainsText ? artPieceTextLanguages : [],
      };

      const res = await fetch(`${BASE_URL}/my/artPieces/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json; charset=UTF-8", Accept: "application/json" },
        body: JSON.stringify(body),
      });

      const raw = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`PUT /my/artPieces/${id} failed: ${res.status}. ${raw.slice(0, 200)}`);

      toast.current?.show({
        severity: "success",
        summary: "Zapisano ✅",
        detail: "Zaktualizowano ArtPiece",
        life: 2000,
      });

      setEditOpen(false);

      await loadMy();
      await loadDetails(id);
    } catch (e: any) {
      toast.current?.show({
        severity: "error",
        summary: "Błąd zapisu",
        detail: e?.message ?? "Update error",
        life: 3500,
      });
    }
  }, [
    selectedId,
    details?.id,
    canSave,
    artPieceAddress,
    artPieceName,
    artPieceUserDescription,
    artPiecePosition,
    artPieceContainsText,
    artPieceTypes,
    artPieceStyles,
    artPieceTextLanguages,
    loadMy,
    loadDetails,
  ]);

  const closeDetailsDialog = useCallback(() => {
    setSelectedId(null);
    setDetails(null);
    setDetailsError(null);
    setEditOpen(false);
  }, []);

  return (
    <div className={styles.pageCenter}>
      <Toast ref={toast} position="top-right" />

      <Card title="Moje dzieła" className={styles.cardShell}>
        {error ? <div className={styles.adminError}>Error: {error}</div> : null}

        <div className={styles.row}>
          <Button label="Wróć" icon="pi pi-arrow-left" severity="secondary" onClick={() => navigate("/app")} />
          <Button label="Odśwież" icon="pi pi-refresh" onClick={() => void loadMy()} loading={loading} />
        </div>

        <Divider className={styles.dividerSoft} />

        {loading ? <div style={{ opacity: 0.85 }}>Loading...</div> : null}
        {!loading && items.length === 0 ? <div style={{ opacity: 0.9 }}>(Brak dodanych artpieces)</div> : null}

        <div className={styles.listGrid1}>
          {items.map((x) => (
            <div key={x.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <div className={styles.itemMeta}>
                  <div className={styles.itemTitle}>{x.title}</div>
                  <div className={styles.itemSubtitle}>{x.address}</div>
                  <div className={styles.itemSubtitle}>District: {x.district}</div>
                </div>

                <Button
                  label="Otwórz"
                  icon="pi pi-external-link"
                  className={styles.btnRounded12Bold}
                  onClick={() => {
                    setSelectedId(x.id);
                    void loadDetails(x.id);
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* DETAILS */}
        <Dialog
          header={details?.artPieceName ?? selectedTitle}
          visible={selectedId != null}
          className={styles.dialogWide}
          onHide={closeDetailsDialog}
        >
          {details && !loadingDetails && !detailsError ? (
            <div className={styles.dialogActions}>
              <Button label="Edytuj" icon="pi pi-pencil" onClick={openEdit} />
            </div>
          ) : null}

          {loadingDetails ? <div style={{ opacity: 0.85 }}>Loading...</div> : null}
          {detailsError ? <div className={styles.adminError}>{detailsError}</div> : null}

          {details && (
            <div className={styles.dialogGrid14}>
              {details.photos?.length ? (
                <Carousel
                  value={details.photos}
                  numVisible={1}
                  numScroll={1}
                  circular
                  showIndicators={details.photos.length > 1}
                  showNavigators={details.photos.length > 1}
                  itemTemplate={(p) => {
                    const src = p.downloadUrl?.startsWith("http") ? p.downloadUrl : `${BASE_URL}${p.downloadUrl ?? ""}`;
                    return (
                      <div className={styles.photoFrame}>
                        <img
                          src={src}
                          alt={p.fileName ?? "photo"}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      </div>
                    );
                  }}
                />
              ) : (
                <div style={{ opacity: 0.85 }}>(no photos)</div>
              )}

              <div className={styles.detailsGrid}>
                <div>
                  <b>Name:</b> {details.artPieceName}
                </div>
                <div>
                  <b>Address:</b> {details.artPieceAddress}
                </div>
                <div>
                  <b>District:</b> {details.districtName ?? "-"}
                </div>
                <div>
                  <b>City:</b> {details.cityName ?? "Poznań"}
                </div>
                <div>
                  <b>Position:</b> {details.artPiecePosition || "-"}
                </div>
                <div>
                  <b>Contains text:</b> {details.artPieceContainsText ? "Yes" : "No"}
                </div>
              </div>

              <div>
                <b>Types:</b>{" "}
                {details.artPieceTypes?.length ? (
                  <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                    {details.artPieceTypes.map((t) => (
                      <Chip key={t} label={t} />
                    ))}
                  </span>
                ) : (
                  <span> -</span>
                )}
              </div>

              <div>
                <b>Styles:</b>{" "}
                {details.artPieceStyles?.length ? (
                  <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                    {details.artPieceStyles.map((s) => (
                      <Chip key={s} label={s} />
                    ))}
                  </span>
                ) : (
                  <span> -</span>
                )}
              </div>

              <div>
                <b>Text languages:</b>{" "}
                {details.artPieceContainsText && details.artPieceTextLanguages?.length ? (
                  <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                    {details.artPieceTextLanguages.map((l) => (
                      <Chip key={l} label={l} />
                    ))}
                  </span>
                ) : (
                  <span> -</span>
                )}
              </div>

              <div>
                <b>Description:</b>
                <div style={{ marginTop: 6, opacity: 0.95 }}>{details.artPieceUserDescription || "-"}</div>
              </div>
            </div>
          )}
        </Dialog>

        {/* EDIT */}
        <Dialog
          header={`Edytuj: ${details?.artPieceName ?? ""}`}
          visible={editOpen}
          className={styles.dialogWide}
          onHide={() => setEditOpen(false)}
        >
          <div className={styles.dialogGrid14}>
            <div className={styles.fieldBlock}>
              <small className={styles.fieldLabelSmall}>Name</small>
              <InputText
                value={artPieceName}
                onChange={(e) => setApName(e.target.value)}
                onBlur={() => markApTouched("artPieceName")}
                className={`${styles.fullWidth} ${showApErr("artPieceName", apErrors) ? "p-invalid" : ""}`}
              />
              {showApErr("artPieceName", apErrors) ? <small className="p-error">{apErrors.artPieceName}</small> : null}
              <small style={{ opacity: 0.85 }}>
                {artPieceName.trim().length}/{MAX_NAME}
              </small>
            </div>

                        <div className={styles.fieldBlock}>
              <small className={styles.fieldLabelSmall}>Address</small>
              <InputText
                value={artPieceAddress}
                onChange={(e) => {
                  setApAddress(e.target.value);
                  setAddressStatus("idle");
                  setAddressHint("");
                }}
                onBlur={() => {
                  markApTouched("artPieceAddress");
                  void validateAddressWithNominatim();
                }}
                className={`${styles.fullWidth} ${
                  showApErr("artPieceAddress", apErrors) ||
                  (shouldShowAddressHint && addressStatus === "invalid")
                    ? "p-invalid"
                    : ""
                }`}
              />

              {showApErr("artPieceAddress", apErrors) ? (
                <small className="p-error">{apErrors.artPieceAddress}</small>
              ) : null}

              {shouldShowAddressHint && addressStatus === "checking" ? (
                <small style={{ opacity: 0.9 }}>{addressHint}</small>
              ) : null}
              {shouldShowAddressHint && addressStatus === "valid" ? (
                <small style={{ opacity: 0.95 }}>{addressHint}</small>
              ) : null}
              {shouldShowAddressHint && addressStatus === "invalid" ? (
                <small className="p-error">{addressHint}</small>
              ) : null}
            </div>


            <div className={styles.fieldBlock}>
              <small className={styles.fieldLabelSmall}>Description</small>
              <InputText
                value={artPieceUserDescription}
                onChange={(e) => setApUserDescription(e.target.value)}
                onBlur={() => markApTouched("artPieceUserDescription")}
                className={`${styles.fullWidth} ${showApErr("artPieceUserDescription", apErrors) ? "p-invalid" : ""}`}
              />
              {showApErr("artPieceUserDescription", apErrors) ? (
                <small className="p-error">{apErrors.artPieceUserDescription}</small>
              ) : null}
              <small style={{ opacity: 0.85 }}>
                {artPieceUserDescription.trim().length}/{MAX_DESC}
              </small>
            </div>

            <div className={styles.fieldBlock}>
              <small className={styles.fieldLabelSmall}>Position</small>
              <InputText
                value={artPiecePosition}
                onChange={(e) => setApPosition(e.target.value)}
                onBlur={() => markApTouched("artPiecePosition")}
                className={`${styles.fullWidth} ${showApErr("artPiecePosition", apErrors) ? "p-invalid" : ""}`}
              />
              {showApErr("artPiecePosition", apErrors) ? (
                <small className="p-error">{apErrors.artPiecePosition}</small>
              ) : null}
              <small style={{ opacity: 0.85 }}>
                {artPiecePosition.trim().length}/{MAX_POS}
              </small>
            </div>

            <div className={styles.fieldToggleStack}>
              <small className={styles.fieldLabelSmall}>Contains text</small>
              <ToggleButton
                checked={artPieceContainsText}
                onChange={(e) => {
                  setApContainsText(e.value);
                  if (!e.value) setApLangs([]);
                  markApTouched("artPieceTextLanguages");
                }}
                onLabel="Yes"
                offLabel="No"
                className={styles.fullWidth}
              />
            </div>

            {artPieceContainsText && (
              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>Text languages</small>
                <MultiSelect
                  value={artPieceTextLanguages}
                  onChange={(e) => setApLangs(e.value)}
                  onBlur={() => markApTouched("artPieceTextLanguages")}
                  options={LANGUAGE_OPTIONS as any}
                  placeholder="Select languages"
                  className={`${styles.fullWidth} ${showApErr("artPieceTextLanguages", apErrors) ? "p-invalid" : ""}`}
                  display="chip"
                />
                {showApErr("artPieceTextLanguages", apErrors) ? (
                  <small className="p-error">{apErrors.artPieceTextLanguages}</small>
                ) : null}
              </div>
            )}

            <div className={styles.fieldBlock}>
              <small className={styles.fieldLabelSmall}>Types</small>
              <MultiSelect
                value={artPieceTypes}
                onChange={(e) => setApTypes(e.value)}
                onBlur={() => markApTouched("artPieceTypes")}
                options={ART_TYPE_OPTIONS as any}
                placeholder="Select types"
                className={`${styles.fullWidth} ${showApErr("artPieceTypes", apErrors) ? "p-invalid" : ""}`}
                display="chip"
              />
              {showApErr("artPieceTypes", apErrors) ? <small className="p-error">{apErrors.artPieceTypes}</small> : null}
            </div>

            <div className={styles.fieldBlock}>
              <small className={styles.fieldLabelSmall}>Styles</small>
              <MultiSelect
                value={artPieceStyles}
                onChange={(e) => setApStyles(e.value)}
                onBlur={() => markApTouched("artPieceStyles")}
                options={ART_STYLE_OPTIONS as any}
                placeholder="Select styles"
                className={`${styles.fullWidth} ${showApErr("artPieceStyles", apErrors) ? "p-invalid" : ""}`}
                display="chip"
              />
              {showApErr("artPieceStyles", apErrors) ? (
                <small className="p-error">{apErrors.artPieceStyles}</small>
              ) : null}
            </div>
          </div>

          <div className={styles.dialogActions}>
            <Button label="Cancel" severity="secondary" onClick={() => setEditOpen(false)} />
            <Button
  label="Save"
  icon="pi pi-check"
  onClick={saveEdit}
  disabled={!canSave || addressStatus !== "valid"}
/>
{!canSave ? (
  <small className="p-error">Fix errors above to enable Save.</small>
) : addressStatus !== "valid" ? (
  <small className="p-error">Please provide a valid address (verified).</small>
) : null}

          </div>
        </Dialog>
      </Card>
    </div>
  );
};