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

import { ART_TYPE_OPTIONS, ART_STYLE_OPTIONS, LANGUAGE_OPTIONS } from "../constants/Options";
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

export const AdminPage: React.FC = () => {
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
        if (e.name !== "AbortError") setError(e.message ?? "Fetch error");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  // ----------------- TILES -----------------
  const topTiles = useMemo(
    () =>
      (["Users", "ArtPieces"] as AdminEntityType[]).map((t) => ({
        type: t,
        count: data[t].length,
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
        summary: "Usunięto ✅",
        detail: `${selectedType === "Users" ? "User" : "ArtPiece"} został usunięty`,
        life: 2000,
      });

      setData((prev) => ({
        ...prev,
        [selectedType]: prev[selectedType].filter((x) => x.id !== selectedItem.id),
      }));

      // usuń też z mapy artPiecesById jeśli kasujesz artPiece
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
  }, [selectedItem, selectedType]);

  // ----------------- PUT -----------------
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
  
  type UserDetailsDto = {
  id: number;
  appUserName: string;
  appUserEmail: string;
  appUserLanguagesSpoken: string[];
  appUserNationality?: string;
  appUserCity?: string;
  appUserLiveInDistrict?: string;
};

const fetchUserDetails = async (id: string) => {
  const res = await fetch(`${BASE}/getAll/appUsers/${id}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  const raw = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`GET /getAll/appUsers/${id} failed: ${res.status}. ${raw.slice(0, 200)}`);
  return raw.trim() ? JSON.parse(raw) : null;
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

    setEditOpen(true);
    opRef.current?.hide();
    return;
  } catch (e: any) {
    console.error(e);
    alert(e?.message ?? "Nie udało się pobrać szczegółów usera");
    return;
  }
}


  if (activeType === "ArtPieces") {
    try {
      const d = await fetchArtPieceDetails(selectedItem.id);

      setApName(d.artPieceName ?? "");
      setApAddress(d.artPieceAddress ?? "");
      setApUserDescription(d.artPieceUserDescription ?? "");
      setApPosition(d.artPiecePosition ?? "");

      const contains = !!d.artPieceContainsText;
      setApContainsText(contains);
      setContainsTextTouched(false);

      setApTypes(asStringArray(d.artPieceTypes));
      setApStyles(asStringArray(d.artPieceStyles));
      setApLangs(contains ? asStringArray(d.artPieceTextLanguages) : []);

      setEditOpen(true);
      opRef.current?.hide();
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Nie udało się pobrać szczegółów artpiece");
    }
  }
}, [activeType, selectedItem]);

  // ----------------- MENU -----------------
  const menuModel = useMemo(
    () => [
      {
        label: "Opcje",
        items: [
          { label: "Edytuj", icon: "pi pi-pencil", command: openEditDialog },
          { label: "Usuń", icon: "pi pi-trash", command: onDelete },
        ],
      },
    ],
    [openEditDialog, onDelete]
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

    try {
      // ---- USERS ----
      if (activeType === "Users") {
        if (!targetAppUserEmail.trim()) {
          throw new Error("Brak targetAppUserEmail (email do identyfikacji).");
        }

        const body: any = {
          ...(appUserName.trim() ? { appUserName: appUserName.trim() } : {}),
          ...(appUserEmail.trim() ? { appUserEmail: appUserEmail.trim() } : {}),
          ...(appUserLanguagesSpoken.length ? { appUserLanguagesSpoken } : {}),
          ...(appUserPassword.trim() ? { appUserPassword: appUserPassword } : {}),
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
          summary: "Zapisano ✅",
          detail: "Zaktualizowano użytkownika",
          life: 2000,
        });

        setEditOpen(false);
        return;
      }

      // ---- ARTPIECES ----
      if (activeType === "ArtPieces") {
        const body: any = {
          ...(true ? { artPieceCity: "Poznań" } : {}),
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

        // update listy
        setData((prev) => ({
          ...prev,
          ArtPieces: prev.ArtPieces.map((x) =>
            x.id === selectedItem.id ? { ...x, name: artPieceName || x.name, subtitle: artPieceAddress || x.subtitle } : x
          ),
        }));

        setSelectedItem((p) =>
          p ? { ...p, name: artPieceName || p.name, subtitle: artPieceAddress || p.subtitle } : p
        );

        // update mapy (żeby następny edit miał nowe dane)
        setArtPiecesById((prev) => ({
          ...prev,
          [selectedItem.id]: {
            ...prev[selectedItem.id],
            artPieceName,
            artPieceAddress,
            artPieceUserDescription,
            // jeśli masz te pola w DTO, usuń "as any" wyżej w openEditDialog
            artPiecePosition,
            artPieceContainsText,
            artPieceTypes,
            artPieceStyles,
            artPieceTextLanguages,
          } as any,
        }));

        toast.current?.show({
          severity: "success",
          summary: "Zapisano ✅",
          detail: "Zaktualizowano ArtPiece",
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
  ]);

  // ----------------- RENDER -----------------
  return (
    <div className={styles.pageCenter}>
      <Toast ref={toast} position="top-right" />

      <Card title="Admin Page" className={styles.cardShell}>
        {error ? <div className={styles.adminError}>Error: {error}</div> : null}

        <AdminTiles tiles={topTiles} activeType={activeType} loading={loading} onPick={setActiveType} />

        <Divider className={styles.dividerSoft} />

        <div className={styles.tilesGrid2}>
          {(Object.keys(data) as AdminEntityType[]).map((t) => (
            <AdminEntityPanel
              key={t}
              title={t}
              rows={data[t]}
              loading={loading}
              onRowClick={(e) => {
                setActiveType(t);
                onRowClick(t, e);
              }}
            />
          ))}
        </div>

        <OverlayPanel ref={opRef} dismissable>
          <Menu model={menuModel} />
        </OverlayPanel>

        <Dialog
          header={`Edytuj: ${activeType}`}
          visible={editOpen}
          className={styles.dialogNarrow}
          onHide={() => setEditOpen(false)}
        >
          {activeType === "Users" && (
            <div className={styles.dialogGrid14}>
              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>Email</small>
                <InputText value={appUserEmail} onChange={(e) => setUserEmail(e.target.value)} className={styles.fullWidth} />
              </div>

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>Name</small>
                <InputText value={appUserName} onChange={(e) => setUserName(e.target.value)} className={styles.fullWidth} />
              </div>

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>Languages spoken</small>
                <MultiSelect
                  value={appUserLanguagesSpoken}
                  onChange={(e) => setAppUserLanguagesSpoken(e.value)}
                  options={LANGUAGE_OPTIONS as any}
                  placeholder="Select languages"
                  className={styles.fullWidth}
                  display="chip"
                />
              </div>

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>Password</small>
                <InputText
                  type="password"
                  value={appUserPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className={styles.fullWidth}
                />
              </div>
            </div>
          )}

          {activeType === "ArtPieces" && (
            <div className={styles.dialogGrid14}>
              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>Name</small>
                <InputText value={artPieceName} onChange={(e) => setApName(e.target.value)} className={styles.fullWidth} />
              </div>

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>Address</small>
                <InputText value={artPieceAddress} onChange={(e) => setApAddress(e.target.value)} className={styles.fullWidth} />
              </div>

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>Description</small>
                <InputText
                  value={artPieceUserDescription}
                  onChange={(e) => setApUserDescription(e.target.value)}
                  className={styles.fullWidth}
                />
              </div>

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>Position</small>
                <InputText value={artPiecePosition} onChange={(e) => setApPosition(e.target.value)} className={styles.fullWidth} />
              </div>

              <div className={styles.fieldToggleStack}>
                <small className={styles.fieldLabelSmall}>Contains text</small>
                <ToggleButton
                  checked={artPieceContainsText}
                  onChange={(e) => {
                    setApContainsText(e.value);
                    setContainsTextTouched(true);
                    if (!e.value) setApLangs([]);
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
                    options={LANGUAGE_OPTIONS as any}
                    placeholder="Select languages"
                    className={styles.fullWidth}
                    display="chip"
                  />
                </div>
              )}

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>Types</small>
                <MultiSelect
                  value={artPieceTypes}
                  onChange={(e) => setApTypes(e.value)}
                  options={ART_TYPE_OPTIONS as any}
                  placeholder="Select types"
                  className={styles.fullWidth}
                  display="chip"
                />
              </div>

              <div className={styles.fieldBlock}>
                <small className={styles.fieldLabelSmall}>Styles</small>
                <MultiSelect
                  value={artPieceStyles}
                  onChange={(e) => setApStyles(e.value)}
                  options={ART_STYLE_OPTIONS as any}
                  placeholder="Select styles"
                  className={styles.fullWidth}
                  display="chip"
                />
              </div>
            </div>
          )}

          <div className={styles.dialogActions}>
            <Button label="Cancel" severity="secondary" onClick={() => setEditOpen(false)} />
            <Button label="Save" icon="pi pi-check" onClick={saveEdit} />
          </div>
        </Dialog>

        <div className={styles.actionsFooter}>
          <Button
            label="Leave Admin Page"
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
