import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../../styles/pages.module.css";

import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { Menu } from "primereact/menu";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Divider } from "primereact/divider";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { MultiSelect } from "primereact/multiselect";
import { ToggleButton } from "primereact/togglebutton";


import { useTranslation } from "react-i18next";

import { ART_TYPE_OPTIONS, ART_STYLE_OPTIONS, LANGUAGE_OPTIONS } from "../constants/Options";
import { EMAIL_REGEX, PASSWORD_REGEX } from "../constants/validators";
import type { UserEntity, ArtPieceEntity } from "../dto/admin/AdminDtos";

import { AdminTiles, AdminEntityPanel } from "../../widgets/admin/AdminWidgets";
import type { AdminEntityType, RowItem } from "../../widgets/admin/AdminWidgets";

const BASE = "http://localhost:8080";

const EMPTY: Record<AdminEntityType, RowItem[]> = {
  Users: [],
  ArtPieces: [],
};

// helper pod MultiSelect (zawsze zwraca string[])
const asStringArray = (v: any): string[] => (Array.isArray(v) ? v.map(String) : []);

const MAX_NAME = 50;
const MAX_POS = 50;
const MAX_DESC = 200;

export const AdminPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  const activeLang = (i18n.language || "pl").toLowerCase().startsWith("pl") ? "pl" : "en";
  const setLang = (lng: "pl" | "en") => void i18n.changeLanguage(lng);


  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  const [activeType, setActiveType] = useState<AdminEntityType>("Users");
  const [data, setData] = useState<Record<AdminEntityType, RowItem[]>>(EMPTY);

  const [artPiecesById, setArtPiecesById] = useState<Record<string, ArtPieceEntity>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<RowItem | null>(null);
  const [selectedType, setSelectedType] = useState<AdminEntityType | null>(null);

  const opRef = useRef<OverlayPanel>(null);
  const [editOpen, setEditOpen] = useState(false);

  // ---- Users form ----
  const [targetAppUserEmail, setTargetAppUserEmail] = useState("");
  const [appUserEmail, setUserEmail] = useState("");
  const [appUserName, setUserName] = useState("");
  const [appUserPassword, setUserPassword] = useState("");
  const [appUserLanguagesSpoken, setAppUserLanguagesSpoken] = useState<string[]>([]);

  // ---- ArtPieces form ----
  const [artPieceName, setApName] = useState("");
  const [artPieceAddress, setApAddress] = useState("");
  const [artPieceUserDescription, setApUserDescription] = useState("");

  const [artPiecePosition, setApPosition] = useState("");
  const [artPieceContainsText, setApContainsText] = useState(false);
  const [artPieceTypes, setApTypes] = useState<string[]>([]);
  const [artPieceStyles, setApStyles] = useState<string[]>([]);
  const [artPieceTextLanguages, setApLangs] = useState<string[]>([]);
  const [containsTextTouched, setContainsTextTouched] = useState(false);
  const [addressStatus, setAddressStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [addressHint, setAddressHint] = useState("");

  // ----------------- VALIDATION (Admin Edit) -----------------
  type UserEditErrors = {
    appUserEmail?: string;
    appUserName?: string;
    appUserPassword?: string;
    appUserLanguagesSpoken?: string;
  };

  type ArtPieceEditErrors = {
    artPieceName?: string;
    artPieceAddress?: string;
    artPiecePosition?: string;
    artPieceUserDescription?: string;
    artPieceTypes?: string;
    artPieceStyles?: string;
    artPieceTextLanguages?: string;
  };

  type UserTouched = Partial<Record<keyof UserEditErrors, boolean>>;
  type ArtPieceTouched = Partial<Record<keyof ArtPieceEditErrors, boolean>>;

  const [userTouched, setUserTouched] = useState<UserTouched>({});
  const [apTouched, setApTouched] = useState<ArtPieceTouched>({});

  const markUserTouched = (k: keyof UserEditErrors) => setUserTouched((p) => ({ ...p, [k]: true }));
  const markApTouched = (k: keyof ArtPieceEditErrors) => setApTouched((p) => ({ ...p, [k]: true }));

  const showUserErr = (k: keyof UserEditErrors, errors: UserEditErrors) => Boolean(userTouched[k] && errors[k]);
  const showApErr = (k: keyof ArtPieceEditErrors, errors: ArtPieceEditErrors) => Boolean(apTouched[k] && errors[k]);

  const validateUserEdit = (): UserEditErrors => {
    const e: UserEditErrors = {};

    const name = appUserName.trim();
    if (!name) e.appUserName = t("validation.nameRequired");
    else if (name.length < 5) e.appUserName = t("validation.nameMin");
    else if (name.length > 30) e.appUserName = t("validation.nameMax");

    const email = appUserEmail.trim();
    if (!email) e.appUserEmail = t("validation.emailRequired");
    else if (!EMAIL_REGEX.test(email)) e.appUserEmail = t("validation.emailInvalid");

    const pass = appUserPassword;
    if (pass.trim().length > 0 && !PASSWORD_REGEX.test(pass)) {
      e.appUserPassword = t("validation.passwordRules");
    }

    if (!appUserLanguagesSpoken || appUserLanguagesSpoken.length === 0) {
      e.appUserLanguagesSpoken = t("validation.selectAtLeastOne");
    }

    return e;
  };

  const validateArtPieceEdit = (): ArtPieceEditErrors => {
    const e: ArtPieceEditErrors = {};

    const name = artPieceName.trim();
    if (!name) e.artPieceName = t("validation.nameRequired");
    else if (name.length > MAX_NAME) e.artPieceName = t("validation.nameMax");

    const addr = artPieceAddress.trim();
    if (!addr) e.artPieceAddress = t("validation.addressRequired", { defaultValue: "Address is required." });

    const pos = artPiecePosition.trim();
    if (pos.length > MAX_POS) e.artPiecePosition = t("validation.positionMax", { defaultValue: `Position cannot exceed ${MAX_POS} characters.` });

    if (!artPieceTypes || artPieceTypes.length === 0) e.artPieceTypes = t("validation.selectAtLeastOne");
    if (!artPieceStyles || artPieceStyles.length === 0) e.artPieceStyles = t("validation.selectAtLeastOne");

    const desc = artPieceUserDescription.trim();
    if (desc.length > MAX_DESC) e.artPieceUserDescription = t("validation.descMax", { defaultValue: `Description cannot exceed ${MAX_DESC} characters.` });

    if (artPieceContainsText && (!artPieceTextLanguages || artPieceTextLanguages.length === 0)) {
      e.artPieceTextLanguages = t("validation.selectAtLeastOne");
    }

    return e;
  };

  const userErrors = useMemo(() => validateUserEdit(), [appUserName, appUserEmail, appUserPassword, appUserLanguagesSpoken, t]);

  const apErrors = useMemo(
    () => validateArtPieceEdit(),
    [artPieceName, artPieceAddress, artPiecePosition, artPieceUserDescription, artPieceTypes, artPieceStyles, artPieceContainsText, artPieceTextLanguages, t]
  );

  const canSaveUsers = Object.keys(userErrors).length === 0;
  const canSaveArtPieces = Object.keys(apErrors).length === 0;

  const shouldShowAddressHint = artPieceAddress.trim().length > 0;

  const validateAddressWithNominatim = useCallback(async () => {
    const addr = artPieceAddress.trim();

    if (!addr) {
      setAddressStatus("idle");
      setAddressHint("");
      return false;
    }

    setAddressStatus("checking");
    setAddressHint(t("common.loading"));

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
        setAddressHint(t("toasts.invalidAddressDetail"));
        return false;
      }

      const data = (await res.json()) as any[];
      if (!Array.isArray(data) || data.length === 0) {
        setAddressStatus("invalid");
        setAddressHint(t("toasts.invalidAddressDetail"));
        return false;
      }

      const display = String(data[0]?.display_name ?? "");
      const inPoznan = display.toLowerCase().includes("poznań") || display.toLowerCase().includes("poznan");
      if (!inPoznan) {
        setAddressStatus("invalid");
        setAddressHint(t("toasts.invalidAddressDetail"));
        return false;
      }

      setAddressStatus("valid");
      setAddressHint("✅");
      return true;
    } catch {
      setAddressStatus("invalid");
      setAddressHint(t("validation.networkError"));
      return false;
    }
  }, [artPieceAddress, t]);

  // ----------------- FETCH -----------------
  useEffect(() => {
    const controller = new AbortController();

    const fetchJson = async <T,>(url: string): Promise<T> => {
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
        signal: controller.signal,
      });

      const raw = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}. Body: ${raw.slice(0, 200)}`);

      return raw.trim() ? (JSON.parse(raw) as T) : (([] as unknown) as T);
    };

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [users, artPieces] = await Promise.all([
          fetchJson<UserEntity[]>(`${BASE}/getAll/appUsers`),
          fetchJson<ArtPieceEntity[]>(`${BASE}/getAll/artPieces`),
        ]);

        setArtPiecesById(Object.fromEntries(artPieces.map((a) => [String(a.id), a])));

        setData({
          Users: users.map((u) => ({
            id: String(u.id),
            name: u.appUserEmail,
            subtitle: u.appUserName,
          })),
          ArtPieces: artPieces.map((a) => ({
            id: String(a.id),
            name: a.artPieceName ?? "ArtPiece",
            subtitle: a.artPieceAddress ?? "",
          })),
        });
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message ?? t("common.unknownError"));
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [t]);

  // ----------------- TILES -----------------
  const topTiles = useMemo(
    () =>
      (["Users", "ArtPieces"] as AdminEntityType[]).map((tt) => ({
        type: tt,
        count: data[tt].length,
      })),
    [data]
  );

  // ----------------- DELETE -----------------
  const deleteEndpointFor = (type: AdminEntityType, id: string) => {
    switch (type) {
      case "Users":
        return `${BASE}/remove/appUser/${id}`;
      case "ArtPieces":
        return `${BASE}/remove/artPiece/${id}`;
      default:
        return null;
    }
  };

  const deleteItem = async (type: AdminEntityType, id: string) => {
    const url = deleteEndpointFor(type, id);
    if (!url) throw new Error(`Brak endpointu DELETE dla typu: ${type}`);

    const res = await fetch(url, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    });

    const raw = await res.text().catch(() => "");
    if (!res.ok) throw new Error(`DELETE failed: HTTP ${res.status}. Body: ${raw.slice(0, 200)}`);
    return raw;
  };

  const onDelete = useCallback(async () => {
    if (!selectedItem || !selectedType) return;

    if (!selectedItem.id || selectedItem.id === "undefined") {
      alert(`Brak poprawnego id w selectedItem: ${JSON.stringify(selectedItem)}`);
      return;
    }

    try {
      await deleteItem(selectedType, selectedItem.id);

      toast.current?.show({
        severity: "success",
        summary: t("toasts.deletedSummary"),
        detail: selectedType === "Users" ? t("toasts.deletedUserDetail") : t("toasts.deletedArtPieceDetail"),
        life: 2000,
      });

      setData((prev) => ({
        ...prev,
        [selectedType]: prev[selectedType].filter((x) => x.id !== selectedItem.id),
      }));

      if (selectedType === "ArtPieces") {
        setArtPiecesById((prev) => {
          const copy = { ...prev };
          delete copy[selectedItem.id];
          return copy;
        });
      }

      setSelectedItem(null);
      setSelectedType(null);
      opRef.current?.hide();
    } catch (e: any) {
      console.error(e);
      alert(e.message ?? "Delete error");
    }
  }, [selectedItem, selectedType, t]);

  // ----------------- PUT (ArtPieces) -----------------
  const putEndpointFor = useCallback((type: AdminEntityType, id: string) => {
    switch (type) {
      case "ArtPieces":
        return `${BASE}/updateArtPiece/artPiece/${id}`;
      default:
        return null;
    }
  }, []);

  const putItem = useCallback(
    async (type: AdminEntityType, id: string, body: any) => {
      const url = putEndpointFor(type, id);
      if (!url) throw new Error(`Brak endpointu PUT dla typu: ${type}`);

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const raw = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`PUT failed: HTTP ${res.status}. Body: ${raw.slice(0, 200)}`);
      return raw.trim() ? JSON.parse(raw) : null;
    },
    [putEndpointFor]
  );

  // ----------------- DETAILS FETCH -----------------
  type UserDetailsDto = {
    id: number;
    appUserName: string;
    appUserEmail: string;
    appUserLanguagesSpoken: string[];
    appUserNationality?: string;
    appUserCity?: string;
    appUserLiveInDistrict?: string;
  };

  const fetchUserDetails = async (id: string): Promise<UserDetailsDto> => {
    const res = await fetch(`${BASE}/getAll/appUsers/${id}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });

    const raw = await res.text().catch(() => "");
    if (!res.ok) throw new Error(`GET /getAll/appUsers/${id} failed: ${res.status}. ${raw.slice(0, 200)}`);
    return raw.trim() ? (JSON.parse(raw) as UserDetailsDto) : (null as any);
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
    photos: any[];
  };

  const fetchArtPieceDetails = async (id: string): Promise<ArtPieceDetailsDto> => {
    const res = await fetch(`${BASE}/map/artPieces/${id}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });

    const raw = await res.text().catch(() => "");
    if (!res.ok) throw new Error(`GET /map/artPieces/${id} failed: ${res.status}. ${raw.slice(0, 200)}`);
    return raw.trim() ? (JSON.parse(raw) as ArtPieceDetailsDto) : (null as any);
  };

  // ----------------- OPEN EDIT -----------------
  const openEditDialog = useCallback(async () => {
    if (!selectedItem) return;

    if (activeType === "Users") {
      try {
        const u = await fetchUserDetails(selectedItem.id);

        setTargetAppUserEmail(u.appUserEmail ?? "");
        setUserEmail(u.appUserEmail ?? "");
        setUserName(u.appUserName ?? "");
        setUserPassword(""); // hasła nie wypełniamy
        setAppUserLanguagesSpoken(asStringArray(u.appUserLanguagesSpoken));

        setUserTouched({});
        setEditOpen(true);
        opRef.current?.hide();
        return;
      } catch (e: any) {
        console.error(e);
        alert(e?.message ?? t("common.unknownError"));
        return;
      }
    }

    if (activeType === "ArtPieces") {
      try {
        const d = await fetchArtPieceDetails(selectedItem.id);

        setApName(d.artPieceName ?? "");
        setApAddress(d.artPieceAddress ?? "");
        setAddressStatus("idle");
        setAddressHint("");
        setApUserDescription(d.artPieceUserDescription ?? "");
        setApPosition(d.artPiecePosition ?? "");

        const contains = !!d.artPieceContainsText;
        setApContainsText(contains);
        setContainsTextTouched(false);

        setApTypes(asStringArray(d.artPieceTypes));
        setApStyles(asStringArray(d.artPieceStyles));
        setApLangs(contains ? asStringArray(d.artPieceTextLanguages) : []);

        setApTouched({});
        setEditOpen(true);
        opRef.current?.hide();
      } catch (e: any) {
        console.error(e);
        alert(e?.message ?? t("common.unknownError"));
      }
    }
  }, [activeType, selectedItem, t]);

  // ----------------- MENU -----------------
  const menuModel = useMemo(
    () => [
      {
        label: t("menu.title"),
        items: [
          { label: t("menu.edit"), icon: "pi pi-pencil", command: openEditDialog },
          { label: t("menu.delete"), icon: "pi pi-trash", command: onDelete },
        ],
      },
    ],
    [openEditDialog, onDelete, t]
  );

  const onRowClick = (type: AdminEntityType, e: any) => {
    const item = e.data as RowItem;
    setSelectedType(type);
    setSelectedItem(item);
    opRef.current?.toggle(e.originalEvent);
  };

  // ----------------- SAVE EDIT -----------------
  const saveEdit = useCallback(async () => {
    if (!selectedItem) return;

    if (activeType === "Users") {
      setUserTouched({
        appUserEmail: true,
        appUserName: true,
        appUserPassword: true,
        appUserLanguagesSpoken: true,
      });

      if (!canSaveUsers) {
        toast.current?.show({
          severity: "warn",
          summary: t("toasts.fixErrorsSummary"),
          detail: t("toasts.fixErrorsDetail"),
          life: 2200,
        });
        return;
      }
    }

    if (activeType === "ArtPieces") {
      setApTouched({
        artPieceName: true,
        artPieceAddress: true,
        artPiecePosition: true,
        artPieceUserDescription: true,
        artPieceTypes: true,
        artPieceStyles: true,
        artPieceTextLanguages: true,
      });

      const okAddr = await validateAddressWithNominatim();
      if (!okAddr) {
        toast.current?.show({
          severity: "warn",
          summary: t("toasts.invalidAddressSummary"),
          detail: t("toasts.invalidAddressDetail"),
          life: 2500,
        });
        return;
      }

      if (!canSaveArtPieces) {
        toast.current?.show({
          severity: "warn",
          summary: t("toasts.fixErrorsSummary"),
          detail: t("toasts.fixErrorsDetail"),
          life: 2200,
        });
        return;
      }
    }

    try {
      // ---- USERS ----
      if (activeType === "Users") {
        if (!targetAppUserEmail.trim()) {
          throw new Error("Brak targetAppUserEmail (email do identyfikacji).");
        }

        const body: any = {
          appUserName: appUserName.trim(),
          appUserEmail: appUserEmail.trim(),
          appUserLanguagesSpoken,
          ...(appUserPassword.trim() ? { appUserPassword } : {}),
        };

        const url = new URL(`${BASE}/updateAppUser/user`);
        url.searchParams.set("appUserEmail", targetAppUserEmail.trim());

        const res = await fetch(url.toString(), {
          method: "PUT",
          headers: { "Content-Type": "application/json; charset=UTF-8", Accept: "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });

        const raw = await res.text().catch(() => "");
        if (!res.ok) throw new Error(`PUT Users failed: HTTP ${res.status}. Body: ${raw.slice(0, 200)}`);

        setData((prev) => ({
          ...prev,
          Users: prev.Users.map((x) =>
            x.id === selectedItem.id ? { ...x, name: appUserEmail || x.name, subtitle: appUserName || x.subtitle } : x
          ),
        }));

        setSelectedItem((p) => (p ? { ...p, name: appUserEmail || p.name, subtitle: appUserName || p.subtitle } : p));

        toast.current?.show({
          severity: "success",
          summary: t("toasts.savedSummary"),
          detail: t("toasts.savedUserDetail"),
          life: 2000,
        });

        setEditOpen(false);
        return;
      }

      // ---- ARTPIECES ----
      if (activeType === "ArtPieces") {
        const body: any = {
          artPieceCity: "Poznań",
          ...(artPieceAddress.trim() ? { artPieceAddress: artPieceAddress.trim() } : {}),
          ...(artPieceName.trim() ? { artPieceName: artPieceName.trim() } : {}),
          ...(artPieceUserDescription.trim() ? { artPieceUserDescription: artPieceUserDescription.trim() } : {}),
          ...(artPiecePosition.trim() ? { artPiecePosition: artPiecePosition.trim() } : {}),
          ...(artPieceTypes.length ? { artPieceTypes } : {}),
          ...(artPieceStyles.length ? { artPieceStyles } : {}),
          ...(artPieceTextLanguages.length ? { artPieceTextLanguages } : {}),
          ...(containsTextTouched ? { artPieceContainsText } : {}),
        };

        await putItem("ArtPieces", selectedItem.id, body);

        setData((prev) => ({
          ...prev,
          ArtPieces: prev.ArtPieces.map((x) =>
            x.id === selectedItem.id ? { ...x, name: artPieceName || x.name, subtitle: artPieceAddress || x.subtitle } : x
          ),
        }));

        setSelectedItem((p) => (p ? { ...p, name: artPieceName || p.name, subtitle: artPieceAddress || p.subtitle } : p));

        setArtPiecesById((prev) => ({
          ...prev,
          [selectedItem.id]: {
            ...prev[selectedItem.id],
            artPieceName,
            artPieceAddress,
            artPieceUserDescription,
            artPiecePosition,
            artPieceContainsText,
            artPieceTypes,
            artPieceStyles,
            artPieceTextLanguages,
          } as any,
        }));

        toast.current?.show({
          severity: "success",
          summary: t("toasts.savedSummary"),
          detail: t("toasts.savedArtPieceDetail"),
          life: 2000,
        });

        setEditOpen(false);
        return;
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message ?? "Update error");
    }
  }, [
    activeType,
    selectedItem,
    putItem,
    targetAppUserEmail,
    appUserEmail,
    appUserName,
    appUserPassword,
    appUserLanguagesSpoken,
    artPieceName,
    artPieceAddress,
    artPieceUserDescription,
    artPiecePosition,
    artPieceTypes,
    artPieceStyles,
    artPieceTextLanguages,
    artPieceContainsText,
    containsTextTouched,
    canSaveUsers,
    canSaveArtPieces,
    validateAddressWithNominatim,
    t,
  ]);

  // ----------------- RENDER -----------------
  return (
    <div className={styles.pageCenter}>
      <div style={{ position: "absolute", top: 18, right: 18, display: "flex", gap: 8, zIndex: 5 }}>
        <Button
          label={t("common.pl")}
          size="small"
          outlined={activeLang !== "pl" }
          onClick={() => setLang("pl")}
            style={activeLang !== "pl" ? { color: "#000", borderColor: "rgba(0,0,0,0.35)" } : undefined}
        />
        <Button
          label={t("common.en")}
          size="small"
          outlined={activeLang !== "en"}
          onClick={() => setLang("en")}
            style={activeLang !== "en" ? { color: "#000", borderColor: "rgba(0,0,0,0.35)" } : undefined}
        />
      </div>
      <Toast ref={toast} position="top-right" />

      <Card title={t("admin.pageTitle")} className={styles.cardShell}>
        
        {error ? (
          <div className={styles.adminError}>
            {t("common.error")}: {error}
          </div>
        ) : null}

        <AdminTiles tiles={topTiles} activeType={activeType} loading={loading} onPick={setActiveType} />

        <Divider className={styles.dividerSoft} />

        {/* ✅ NIE ruszamy wrapperów layoutu */}
        <div className={styles.tilesGrid2}>
          {(Object.keys(data) as AdminEntityType[]).map((tKey) => (
            <AdminEntityPanel
              key={tKey}
              title={tKey} // ✅ MUST stay AdminEntityType, not translated string
              rows={data[tKey]}
              loading={loading}
              onRowClick={(e) => {
                setActiveType(tKey);
                onRowClick(tKey, e);
              }}
            />
          ))}
        </div>

        <OverlayPanel ref={opRef} dismissable>
          <Menu model={menuModel} />
        </OverlayPanel>

        <Dialog
          header={t("dialog.editHeader", {
            type: activeType === "Users" ? t("entities.users") : t("entities.artPieces"),
          })}
          visible={editOpen}
          className={styles.dialogNarrow}
          onHide={() => setEditOpen(false)}
        >
          {activeType === "Users" && (
            <div className={styles.dialogGrid14}>
              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>{t("fields.email")}</small>
                <InputText
                  value={appUserEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  onBlur={() => markUserTouched("appUserEmail")}
                  className={`${styles.fullWidth} ${showUserErr("appUserEmail", userErrors) ? "p-invalid" : ""}`}
                />
                {showUserErr("appUserEmail", userErrors) ? <small className="p-error">{userErrors.appUserEmail}</small> : null}
              </div>

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>{t("fields.name")}</small>
                <InputText
                  value={appUserName}
                  onChange={(e) => setUserName(e.target.value)}
                  onBlur={() => markUserTouched("appUserName")}
                  className={`${styles.fullWidth} ${showUserErr("appUserName", userErrors) ? "p-invalid" : ""}`}
                />
                {showUserErr("appUserName", userErrors) ? <small className="p-error">{userErrors.appUserName}</small> : null}
              </div>

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>{t("fields.languagesSpoken")}</small>
                <MultiSelect
                  value={appUserLanguagesSpoken}
                  onChange={(e) => setAppUserLanguagesSpoken(e.value)}
                  onBlur={() => markUserTouched("appUserLanguagesSpoken")}
                  options={LANGUAGE_OPTIONS as any}
                  placeholder={t("placeholders.selectLanguages")}
                  className={`${styles.fullWidth} ${showUserErr("appUserLanguagesSpoken", userErrors) ? "p-invalid" : ""}`}
                  display="chip"
                />
                {showUserErr("appUserLanguagesSpoken", userErrors) ? (
                  <small className="p-error">{userErrors.appUserLanguagesSpoken}</small>
                ) : null}
              </div>

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>{t("fields.password")}</small>
                <InputText
                  type="password"
                  value={appUserPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  onBlur={() => markUserTouched("appUserPassword")}
                  className={`${styles.fullWidth} ${showUserErr("appUserPassword", userErrors) ? "p-invalid" : ""}`}
                />
                {showUserErr("appUserPassword", userErrors) ? <small className="p-error">{userErrors.appUserPassword}</small> : null}
              </div>
            </div>
          )}

          {activeType === "ArtPieces" && (
            <div className={styles.dialogGrid14}>
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

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>{t("fields.address")}</small>
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
                    showApErr("artPieceAddress", apErrors) || (shouldShowAddressHint && addressStatus === "invalid") ? "p-invalid" : ""
                  }`}
                />

                {showApErr("artPieceAddress", apErrors) ? <small className="p-error">{apErrors.artPieceAddress}</small> : null}

                {shouldShowAddressHint && addressStatus === "checking" ? <small style={{ opacity: 0.9 }}>{addressHint}</small> : null}
                {shouldShowAddressHint && addressStatus === "valid" ? <small style={{ opacity: 0.95 }}>{addressHint}</small> : null}
                {shouldShowAddressHint && addressStatus === "invalid" ? <small className="p-error">{addressHint}</small> : null}
              </div>

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>{t("fields.description")}</small>
                <InputText
                  value={artPieceUserDescription}
                  onChange={(e) => setApUserDescription(e.target.value)}
                  onBlur={() => markApTouched("artPieceUserDescription")}
                  className={`${styles.fullWidth} ${showApErr("artPieceUserDescription", apErrors) ? "p-invalid" : ""}`}
                />
                {showApErr("artPieceUserDescription", apErrors) ? <small className="p-error">{apErrors.artPieceUserDescription}</small> : null}
                <small style={{ opacity: 0.85 }}>
                  {artPieceUserDescription.trim().length}/{MAX_DESC}
                </small>
              </div>

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

              <div className={styles.fieldToggleStack}>
                <small className={styles.fieldLabelSmall}>{t("fields.containsText")}</small>
                <ToggleButton
                  checked={artPieceContainsText}
                  onChange={(e) => {
                    setApContainsText(e.value);
                    setContainsTextTouched(true);
                    if (!e.value) setApLangs([]);
                    markApTouched("artPieceTextLanguages");
                  }}
                  onLabel={t("common.yes")}
                  offLabel={t("common.no")}
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
                    options={LANGUAGE_OPTIONS as any}
                    placeholder={t("placeholders.selectLanguages")}
                    className={`${styles.fullWidth} ${showApErr("artPieceTextLanguages", apErrors) ? "p-invalid" : ""}`}
                    display="chip"
                  />
                  {showApErr("artPieceTextLanguages", apErrors) ? <small className="p-error">{apErrors.artPieceTextLanguages}</small> : null}
                </div>
              )}

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>{t("fields.types")}</small>
                <MultiSelect
                  value={artPieceTypes}
                  onChange={(e) => setApTypes(e.value)}
                  onBlur={() => markApTouched("artPieceTypes")}
                  options={ART_TYPE_OPTIONS as any}
                  placeholder={t("placeholders.selectTypes")}
                  className={`${styles.fullWidth} ${showApErr("artPieceTypes", apErrors) ? "p-invalid" : ""}`}
                  display="chip"
                />
                {showApErr("artPieceTypes", apErrors) ? <small className="p-error">{apErrors.artPieceTypes}</small> : null}
              </div>

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>{t("fields.styles")}</small>
                <MultiSelect
                  value={artPieceStyles}
                  onChange={(e) => setApStyles(e.value)}
                  onBlur={() => markApTouched("artPieceStyles")}
                  options={ART_STYLE_OPTIONS as any}
                  placeholder={t("placeholders.selectStyles")}
                  className={`${styles.fullWidth} ${showApErr("artPieceStyles", apErrors) ? "p-invalid" : ""}`}
                  display="chip"
                />
                {showApErr("artPieceStyles", apErrors) ? <small className="p-error">{apErrors.artPieceStyles}</small> : null}
              </div>
            </div>
          )}

          <div className={styles.dialogActions}>
            <Button label={t("buttons.cancel")} severity="secondary" onClick={() => setEditOpen(false)} />
            <Button
              label={t("buttons.save")}
              icon="pi pi-check"
              onClick={saveEdit}
              disabled={
                activeType === "Users"
                  ? !canSaveUsers
                  : activeType === "ArtPieces"
                  ? !canSaveArtPieces || addressStatus !== "valid"
                  : false
              }
            />
          </div>
        </Dialog>

        <div className={styles.actionsFooter}>
          <Button
            label={t("buttons.leave")}
            icon="pi pi-arrow-left"
            severity="secondary"
            onClick={() => navigate("/app")}
            className={styles.btnEmphasis}
          />
        </div>
      </Card>
    </div>
  );
};