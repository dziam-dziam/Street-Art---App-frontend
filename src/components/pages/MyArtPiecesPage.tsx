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

import { getArtStyleOptions, getArtTypeOptions, getLanguageOptions } from "../constants/Options";
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
  const languageOptions = useMemo(() => getLanguageOptions(t), [t, i18n.language]);
  const artTypeOptions = useMemo(() => getArtTypeOptions(t), [t, i18n.language]);
  const artStyleOptions = useMemo(() => getArtStyleOptions(t), [t, i18n.language]);

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

  // ----------------- PHOTOS (existing + new queue) -----------------
  const [apPhotos, setApPhotos] = useState<PhotoResponseDto[]>([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviewUrls, setNewPhotoPreviewUrls] = useState<string[]>([]);

  const clearNewPhotos = useCallback(() => {
    newPhotoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    setNewPhotoFiles([]);
    setNewPhotoPreviewUrls([]);
  }, [newPhotoPreviewUrls]);

  const addNewPhotos = useCallback(
    (files: File[]) => {
      const next = [...newPhotoFiles, ...files];

      // revoke old urls
      newPhotoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
      const urls = next.map((f) => URL.createObjectURL(f));

      setNewPhotoFiles(next);
      setNewPhotoPreviewUrls(urls);
    },
    [newPhotoFiles, newPhotoPreviewUrls]
  );

  const removeNewPhotoAt = useCallback(
    (idx: number) => {
      const nextFiles = newPhotoFiles.filter((_, i) => i !== idx);

      newPhotoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
      const urls = nextFiles.map((f) => URL.createObjectURL(f));

      setNewPhotoFiles(nextFiles);
      setNewPhotoPreviewUrls(urls);
    },
    [newPhotoFiles, newPhotoPreviewUrls]
  );

  const uploadQueuedPhotos = useCallback(
    async (artPieceId: number) => {
      if (!newPhotoFiles.length) return;

      await Promise.all(
        newPhotoFiles.map(async (file) => {
          const fd = new FormData();
          fd.append("image", file);

          const upRes = await fetch(`${BASE_URL}/api/photos/upload/${artPieceId}/photos`, {
            method: "POST",
            credentials: "include",
            body: fd,
          });

          if (!upRes.ok) {
            const body = await upRes.text().catch(() => "");
            throw new Error(`Photo upload failed: ${upRes.status}. ${body.slice(0, 200)}`);
          }
        })
      );
    },
    [newPhotoFiles]
  );

  const deleteExistingPhoto = useCallback(
    async (photoId: number) => {
      const res = await fetch(`${BASE_URL}/api/photos/delete/${photoId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const raw = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`DELETE photo failed: HTTP ${res.status}. ${raw.slice(0, 200)}`);

      // local update
      setApPhotos((prev) => prev.filter((p) => p.id !== photoId));

      // jeśli mamy details, zaktualizuj też tam (żeby karuzela w details dialog była spójna po zamknięciu edycji)
      setDetails((prev) => (prev ? { ...prev, photos: (prev.photos ?? []).filter((p) => p.id !== photoId) } : prev));
    },
    []
  );

  useEffect(() => {
    return () => {
      newPhotoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------- VALIDATION -----------------
  const [apTouched, setApTouched] = useState<ApTouched>({});
  const markApTouched = (k: keyof ApErrors) => setApTouched((p) => ({ ...p, [k]: true }));
  const showApErr = (k: keyof ApErrors, errors: ApErrors) => Boolean(apTouched[k] && errors[k]);

  const MAX_NAME = 50;
  const MAX_POS = 50;
  const MAX_DESC = 200;

  const validateAp = useCallback((): ApErrors => {
    const e: ApErrors = {};

    const name = artPieceName.trim();
    if (!name) e.artPieceName = t("validation.nameRequired");
    else if (name.length > MAX_NAME) e.artPieceName = t("validation.maxChars", { max: MAX_NAME });

    const addr = artPieceAddress.trim();
    if (!addr) e.artPieceAddress = t("validation.addressRequired");

    const pos = artPiecePosition.trim();
    if (pos.length > MAX_POS) e.artPiecePosition = t("validation.positionMax", { max: MAX_POS });

    const desc = artPieceUserDescription.trim();
    if (desc.length > MAX_DESC) e.artPieceUserDescription = t("validation.descMax", { max: MAX_DESC });

    if (!artPieceTypes.length) e.artPieceTypes = t("validation.selectAtLeastOne");
    if (!artPieceStyles.length) e.artPieceStyles = t("validation.selectAtLeastOne");

    if (artPieceContainsText && !artPieceTextLanguages.length) {
      e.artPieceTextLanguages = t("validation.selectAtLeastOne");
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
    t,
  ]);

  const apErrors = useMemo(() => validateAp(), [validateAp]);
  const canSave = Object.keys(apErrors).length === 0;

  // ---- Address validator (Nominatim) ----
  const [addressDirty, setAddressDirty] = useState(false);
  const [addressStatus, setAddressStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [addressHint, setAddressHint] = useState("");
  const shouldShowAddressHint = addressDirty && !apErrors.artPieceAddress && artPieceAddress.trim().length > 0;
  const [originalAddress, setOriginalAddress] = useState("");

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
      setError(e?.message ?? t("common.unknownError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // ----------------- FETCH DETAILS -----------------
  const loadDetails = useCallback(
    async (id: number) => {
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
        setDetailsError(e?.message ?? t("common.unknownError"));
      } finally {
        setLoadingDetails(false);
      }
    },
    [t]
  );

  useEffect(() => {
    void loadMy();
  }, [loadMy]);

  const selectedTitle = useMemo(() => {
    const it = items.find((x) => x.id === selectedId);
    return it?.title ?? t("appView.details");
  }, [items, selectedId, t]);

  const typeLabel = useCallback((v: string) => t(`options.artTypes.${v}`, { defaultValue: v }), [t]);
  const styleLabel = useCallback((v: string) => t(`options.artStyles.${v}`, { defaultValue: v }), [t]);
  const langLabel = useCallback((v: string) => t(`options.languages.${v}`, { defaultValue: v }), [t]);

  const validateAddressWithNominatim = useCallback(async () => {
    const addr = artPieceAddress.trim();

    if (!addr) {
      setAddressStatus("idle");
      setAddressHint("");
      return false;
    }

    setAddressStatus("checking");
    setAddressHint(t("myArtpieces.addressChecking"));

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
        setAddressHint(t("myArtpieces.addressVerifyFail"));
        return false;
      }

      const data = (await res.json()) as any[];
      if (!Array.isArray(data) || data.length === 0) {
        setAddressStatus("invalid");
        setAddressHint(t("myArtpieces.addressNotFound"));
        return false;
      }

      const display = String(data[0]?.display_name ?? "");
      const inPoznan = display.toLowerCase().includes("poznań") || display.toLowerCase().includes("poznan");
      if (!inPoznan) {
        setAddressStatus("invalid");
        setAddressHint(t("myArtpieces.addressNotPoznan"));
        return false;
      }

      setAddressStatus("valid");
      setAddressHint(t("myArtpieces.addressValid"));
      return true;
    } catch {
      setAddressStatus("invalid");
      setAddressHint(t("myArtpieces.addressVerifyFail"));
      return false;
    }
  }, [artPieceAddress, t]);

  const openEdit = useCallback(() => {
    setAddressStatus("idle");
    setAddressHint("");

    if (!details) return;

    setApName(details.artPieceName ?? "");

    const loadedAddress = details.artPieceAddress ?? "";
    setApAddress(loadedAddress);

    setOriginalAddress(loadedAddress.trim());
    setAddressDirty(false);

    setApUserDescription(details.artPieceUserDescription ?? "");
    setApPosition(details.artPiecePosition ?? "");
    setApContainsText(!!details.artPieceContainsText);

    setApTypes((details.artPieceTypes ?? []).map(String));
    setApStyles((details.artPieceStyles ?? []).map(String));
    setApLangs((details.artPieceTextLanguages ?? []).map(String));

    // ✅ photos do edycji
    setApPhotos(details.photos ?? []);
    clearNewPhotos();

    setApTouched({});
    setEditOpen(true);
  }, [details, clearNewPhotos]);

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
        summary: t("toasts.fixErrorsSummary"),
        detail: t("toasts.fixErrorsDetail"),
        life: 2200,
      });
      return;
    }

    // waliduj Nominatim tylko jeśli user zmienił adres
    if (addressDirty) {
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
    } else {
      setAddressStatus("valid");
      setAddressHint("");
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

      // ✅ upload zdjęć z kolejki (dopiero po PUT)
      await uploadQueuedPhotos(id);
      clearNewPhotos();

      toast.current?.show({
        severity: "success",
        summary: t("toasts.savedSummary"),
        detail: t("toasts.savedArtPieceDetail"),
        life: 2000,
      });

      setEditOpen(false);
      await loadMy();
      await loadDetails(id);
    } catch (e: any) {
      toast.current?.show({
        severity: "error",
        summary: t("myArtpieces.saveError"),
        detail: e?.message ?? t("common.unknownError"),
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
    validateAddressWithNominatim,
    addressDirty,
    uploadQueuedPhotos,
    clearNewPhotos,
    t,
  ]);

  const closeDetailsDialog = useCallback(() => {
    setSelectedId(null);
    setDetails(null);
    setDetailsError(null);
    setEditOpen(false);
  }, []);

  // helper do src (jak w details)
  const photoSrc = useCallback((p: PhotoResponseDto) => {
    if (p.downloadUrl) return p.downloadUrl.startsWith("http") ? p.downloadUrl : `${BASE_URL}${p.downloadUrl}`;
    // fallback: jeśli backend ma tylko id
    if (p.id != null) return `${BASE_URL}/api/photos/download/${p.id}`;
    return "";
  }, []);

  return (
    <div className={styles.pageCenter}>
      <Toast ref={toast} position="top-right" />

      {/* language switch (jak w ProfilePage) */}
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

      <Card title={t("myArtpieces.title")} className={styles.cardShell}>
        {error ? (
          <div className={styles.adminError}>
            {t("common.error")}: {error}
          </div>
        ) : null}

        <div className={styles.row}>
          <Button label={t("buttons.back")} icon="pi pi-arrow-left" severity="secondary" onClick={() => navigate("/app")} />
          <Button label={t("myArtpieces.refresh")} icon="pi pi-refresh" onClick={() => void loadMy()} loading={loading} />
        </div>

        <Divider className={styles.dividerSoft} />

        {loading ? <div style={{ opacity: 0.85 }}>{t("common.loading")}</div> : null}
        {!loading && items.length === 0 ? <div style={{ opacity: 0.9 }}>{t("myArtpieces.empty")}</div> : null}

        <div className={styles.listGrid1}>
          {items.map((x) => (
            <div key={x.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <div className={styles.itemMeta}>
                  <div className={styles.itemTitle}>{x.title}</div>
                  <div className={styles.itemSubtitle}>{x.address}</div>
                  <div className={styles.itemSubtitle}>
                    {t("appView.district")}: {x.district}
                  </div>
                </div>

                <Button
                  label={t("myArtpieces.open")}
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
              <Button label={t("myArtpieces.edit")} icon="pi pi-pencil" onClick={openEdit} />
            </div>
          ) : null}

          {loadingDetails ? <div style={{ opacity: 0.85 }}>{t("common.loading")}</div> : null}
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
                    const src = photoSrc(p);
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
                <div style={{ opacity: 0.85 }}>{t("appView.noPhotos")}</div>
              )}

              <div className={styles.detailsGrid}>
                <div>
                  <b>{t("fields.name")}:</b> {details.artPieceName}
                </div>
                <div>
                  <b>{t("fields.address")}:</b> {details.artPieceAddress}
                </div>
                <div>
                  <b>{t("appView.district")}:</b> {details.districtName ?? "-"}
                </div>
                <div>
                  <b>{t("appView.city")}:</b> {details.cityName ?? "Poznań"}
                </div>
                <div>
                  <b>{t("fields.position")}:</b> {details.artPiecePosition || "-"}
                </div>
                <div>
                  <b>{t("fields.containsText")}:</b> {details.artPieceContainsText ? t("toggle.yes") : t("toggle.no")}
                </div>
              </div>

              <div>
                <b>{t("fields.types")}:</b>{" "}
                {details.artPieceTypes?.length ? (
                  <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                    {details.artPieceTypes.map((tt) => (
                      <Chip key={tt} label={typeLabel(tt)} />
                    ))}
                  </span>
                ) : (
                  <span> -</span>
                )}
              </div>

              <div>
                <b>{t("fields.styles")}:</b>{" "}
                {details.artPieceStyles?.length ? (
                  <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                    {details.artPieceStyles.map((s) => (
                      <Chip key={s} label={styleLabel(s)} />
                    ))}
                  </span>
                ) : (
                  <span> -</span>
                )}
              </div>

              <div>
                <b>{t("fields.textLanguages")}:</b>{" "}
                {details.artPieceContainsText && details.artPieceTextLanguages?.length ? (
                  <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                    {details.artPieceTextLanguages.map((l) => (
                      <Chip key={l} label={langLabel(l)} />
                    ))}
                  </span>
                ) : (
                  <span> -</span>
                )}
              </div>

              <div>
                <b>{t("fields.description")}:</b>
                <div style={{ marginTop: 6, opacity: 0.95 }}>{details.artPieceUserDescription || "-"}</div>
              </div>
            </div>
          )}
        </Dialog>

        {/* EDIT */}
        <Dialog
          header={t("myArtpieces.editHeader", { name: details?.artPieceName ?? "" })}
          visible={editOpen}
          className={styles.dialogWide}
          onHide={() => setEditOpen(false)}
        >
          <div className={styles.dialogGrid14}>
            {/* ✅ PHOTOS EDIT BLOCK */}
            <div className={styles.fieldBlock}>
              <small className={styles.fieldLabelSmall}>{t("fields.photos", { defaultValue: "Photos" })}</small>

              {apPhotos.length ? (
                <Carousel
                  value={apPhotos}
                  numVisible={1}
                  numScroll={1}
                  circular
                  showIndicators={apPhotos.length > 1}
                  showNavigators={apPhotos.length > 1}
                  itemTemplate={(p) => {
                    const src = photoSrc(p);
                    const pid = p.id;

                    return (
                      <div style={{ display: "grid", gap: 10 }}>
                        <div className={styles.photoFrame}>
                          <img
                            src={src}
                            alt={p.fileName ?? "photo"}
                            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                          />
                        </div>

                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <Button
                            label={t("buttons.delete")}
                            icon="pi pi-trash"
                            severity="danger"
                            size="small"
                            disabled={pid == null}
                            onClick={async () => {
                              if (pid == null) return;
                              try {
                                await deleteExistingPhoto(pid);
                                toast.current?.show({
                                  severity: "success",
                                  summary: t("toasts.deletedSummary"),
                                  detail: t("toasts.deletedPhotoDetail", { defaultValue: "Photo deleted." }),
                                  life: 1800,
                                });
                              } catch (e: any) {
                                toast.current?.show({
                                  severity: "error",
                                  summary: t("common.error"),
                                  detail: e?.message ?? t("common.unknownError"),
                                  life: 3000,
                                });
                              }
                            }}
                            pt={{ root: { style: { padding: "6px 10px" } } }}
                          />
                        </div>
                      </div>
                    );
                  }}
                />
              ) : (
                <div style={{ opacity: 0.85 }}>{t("appView.noPhotos")}</div>
              )}

              <Divider className={styles.dividerSoft} />

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (!e.target.files) return;
                    addNewPhotos(Array.from(e.target.files));
                    e.currentTarget.value = "";
                  }}
                />

                <small style={{ opacity: 0.85 }}>
                  {t("common.selected", { defaultValue: "Selected" })}: {newPhotoFiles.length}
                </small>

                <Button
                  label={t("buttons.clearAll", { defaultValue: "Clear" })}
                  severity="secondary"
                  size="small"
                  disabled={!newPhotoFiles.length}
                  onClick={clearNewPhotos}
                  pt={{ root: { style: { padding: "6px 10px" } } }}
                />
              </div>

              {newPhotoPreviewUrls.length ? (
                <div style={{ marginTop: 10 }}>
                  <Carousel
                    value={newPhotoPreviewUrls.map((u, idx) => ({ u, idx }))}
                    numVisible={1}
                    numScroll={1}
                    circular
                    showIndicators={newPhotoPreviewUrls.length > 1}
                    showNavigators={newPhotoPreviewUrls.length > 1}
                    itemTemplate={(x: { u: string; idx: number }) => {
                      return (
                        <div style={{ display: "grid", gap: 10 }}>
                          <div className={styles.photoFrame}>
                            <img
                              src={x.u}
                              alt="new"
                              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                            />
                          </div>

                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <Button
                              label={t("buttons.remove", { defaultValue: "Remove" })}
                              icon="pi pi-times"
                              severity="secondary"
                              size="small"
                              onClick={() => removeNewPhotoAt(x.idx)}
                              pt={{ root: { style: { padding: "6px 10px" } } }}
                            />
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>
              ) : null}
            </div>

            {/* NAME */}
            <div className={styles.fieldBlock}>
              <small className={styles.fieldLabelSmall}>{t("fields.name")}</small>
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

            {/* ADDRESS */}
            <div className={styles.fieldBlock}>
              <small className={styles.fieldLabelSmall}>{t("fields.address")}</small>
              <InputText
                value={artPieceAddress}
                onChange={(e) => {
                  const next = e.target.value;
                  setApAddress(next);

                  const dirtyNow = next.trim() !== originalAddress;
                  setAddressDirty(dirtyNow);

                  if (dirtyNow) {
                    setAddressStatus("idle");
                    setAddressHint("");
                  }
                }}
                onBlur={() => {
                  markApTouched("artPieceAddress");

                  if (!addressDirty) {
                    setAddressStatus("valid");
                    setAddressHint("");
                    return;
                  }

                  void validateAddressWithNominatim();
                }}
                className={`${styles.fullWidth} ${
                  showApErr("artPieceAddress", apErrors) ||
                  (shouldShowAddressHint && addressDirty && addressStatus === "invalid")
                    ? "p-invalid"
                    : ""
                }`}
              />

              {showApErr("artPieceAddress", apErrors) ? <small className="p-error">{apErrors.artPieceAddress}</small> : null}

              {shouldShowAddressHint && addressStatus === "checking" ? <small style={{ opacity: 0.9 }}>{addressHint}</small> : null}
              {shouldShowAddressHint && addressStatus === "valid" ? <small style={{ opacity: 0.95 }}>{addressHint}</small> : null}
              {shouldShowAddressHint && addressStatus === "invalid" ? <small className="p-error">{addressHint}</small> : null}
            </div>

            {/* DESCRIPTION */}
            <div className={styles.fieldBlock}>
              <small className={styles.fieldLabelSmall}>{t("fields.description")}</small>
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

            {/* POSITION */}
            <div className={styles.fieldBlock}>
              <small className={styles.fieldLabelSmall}>{t("fields.position")}</small>
              <InputText
                value={artPiecePosition}
                onChange={(e) => setApPosition(e.target.value)}
                onBlur={() => markApTouched("artPiecePosition")}
                className={`${styles.fullWidth} ${showApErr("artPiecePosition", apErrors) ? "p-invalid" : ""}`}
              />
              {showApErr("artPiecePosition", apErrors) ? <small className="p-error">{apErrors.artPiecePosition}</small> : null}
              <small style={{ opacity: 0.85 }}>
                {artPiecePosition.trim().length}/{MAX_POS}
              </small>
            </div>

            {/* CONTAINS TEXT */}
            <div className={styles.fieldToggleStack}>
              <small className={styles.fieldLabelSmall}>{t("fields.containsText")}</small>
              <ToggleButton
                checked={artPieceContainsText}
                onChange={(e) => {
                  setApContainsText(e.value);
                  if (!e.value) setApLangs([]);
                  markApTouched("artPieceTextLanguages");
                }}
                onLabel={t("toggle.yes")}
                offLabel={t("toggle.no")}
                className={styles.fullWidth}
              />
            </div>

            {artPieceContainsText && (
              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>{t("fields.textLanguages")}</small>
                <MultiSelect
                  value={artPieceTextLanguages}
                  onChange={(e) => setApLangs(e.value)}
                  onBlur={() => markApTouched("artPieceTextLanguages")}
                  options={languageOptions as any}
                  placeholder={t("placeholders.selectLanguages")}
                  className={`${styles.fullWidth} ${showApErr("artPieceTextLanguages", apErrors) ? "p-invalid" : ""}`}
                  display="chip"
                  showSelectAll={false}
                  panelHeaderTemplate={() => null}
                />
                {showApErr("artPieceTextLanguages", apErrors) ? <small className="p-error">{apErrors.artPieceTextLanguages}</small> : null}
              </div>
            )}

            {/* TYPES */}
            <div className={styles.fieldBlock}>
              <small className={styles.fieldLabelSmall}>{t("fields.types")}</small>
              <MultiSelect
                value={artPieceTypes}
                onChange={(e) => setApTypes(e.value)}
                onBlur={() => markApTouched("artPieceTypes")}
                options={artTypeOptions as any}
                placeholder={t("placeholders.selectTypes")}
                className={`${styles.fullWidth} ${showApErr("artPieceTypes", apErrors) ? "p-invalid" : ""}`}
                display="chip"
              />
              {showApErr("artPieceTypes", apErrors) ? <small className="p-error">{apErrors.artPieceTypes}</small> : null}
            </div>

            {/* STYLES */}
            <div className={styles.fieldBlock}>
              <small className={styles.fieldLabelSmall}>{t("fields.styles")}</small>
              <MultiSelect
                value={artPieceStyles}
                onChange={(e) => setApStyles(e.value)}
                onBlur={() => markApTouched("artPieceStyles")}
                options={artStyleOptions as any}
                placeholder={t("placeholders.selectStyles")}
                className={`${styles.fullWidth} ${showApErr("artPieceStyles", apErrors) ? "p-invalid" : ""}`}
                display="chip"
              />
              {showApErr("artPieceStyles", apErrors) ? <small className="p-error">{apErrors.artPieceStyles}</small> : null}
            </div>
          </div>

          <div className={styles.dialogActions}>
            <Button label={t("buttons.cancel")} severity="secondary" onClick={() => setEditOpen(false)} />
            <Button
              label={t("buttons.save")}
              icon="pi pi-check"
              onClick={saveEdit}
              disabled={!canSave || (addressDirty && addressStatus !== "valid")}
            />

            {!canSave ? (
              <small className="p-error">{t("myArtpieces.fixErrorsToEnableSave")}</small>
            ) : addressDirty && addressStatus !== "valid" ? (
              <small className="p-error">{t("myArtpieces.provideValidAddress")}</small>
            ) : null}
          </div>
        </Dialog>
      </Card>
    </div>
  );
};