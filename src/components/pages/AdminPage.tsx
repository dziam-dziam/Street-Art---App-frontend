import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import styles from "../../styles/pages.module.css";

import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";
import { Menu } from "primereact/menu";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Divider } from "primereact/divider";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { MultiSelect } from "primereact/multiselect";
import { ToggleButton } from "primereact/togglebutton";

type AdminEntityType = "Users" | "ArtPieces";

type RowItem = {
  id: string;
  name: string;
  subtitle?: string;
};

type UserEntity = { id: number; appUserName: string; appUserEmail: string };

type ArtPieceEntity = {
  id: number;
  artPieceAddress: string;
  artPieceName: string;
  artPieceUserDescription: string;
};

const BASE = "http://localhost:8080";

const EMPTY: Record<AdminEntityType, RowItem[]> = {
  Users: [],
  ArtPieces: [],
};

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  const typeOptions = useMemo(
    () => [
      { label: "Graffiti tag", value: "GRAFFITI_TAG" },
      { label: "Graffiti piece", value: "GRAFFITI_PIECE" },
      { label: "Stencil", value: "STENCIL" },
      { label: "Wheat paste poster", value: "WHEAT_PASTE_POSTER" },
      { label: "Sticker", value: "STICKER" },
      { label: "Mural", value: "MURAL" },
      { label: "3D installation", value: "INSTALLATION_3D" },
    ],
    []
  );

  const styleOptions = useMemo(
    () => [
      { label: "Political", value: "POLITICAL" },
      { label: "Religious", value: "RELIGIOUS" },
      { label: "Social commentary", value: "SOCIAL_COMMENTARY" },
      { label: "Humor", value: "HUMOR" },
      { label: "Love / romance", value: "LOVE_ROMANCE" },
      { label: "Homesickness", value: "HOMESICKNESS" },
      { label: "Philosophical", value: "PHILOSOPHICAL" },
      { label: "Activism", value: "ACTIVISM" },
      { label: "Anti-consumerism", value: "ANTI_CONSUMERISM" },
      { label: "Commercial", value: "COMMERCIAL" },
    ],
    []
  );

  const languageOptions = useMemo(
    () => [
      { label: "Polish", value: "Polish" },
      { label: "English", value: "English" },
      { label: "German", value: "German" },
      { label: "Spanish", value: "Spanish" },
      { label: "French", value: "French" },
    ],
    []
  );

  const [activeType, setActiveType] = useState<AdminEntityType>("Users");
  const [data, setData] = useState<Record<AdminEntityType, RowItem[]>>(EMPTY);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<RowItem | null>(null);
  const [selectedType, setSelectedType] = useState<AdminEntityType | null>(null);

  const opRef = useRef<OverlayPanel>(null);

  const [editOpen, setEditOpen] = useState(false);

  const [targetAppUserEmail, setTargetAppUserEmail] = useState("");
  const [appUserEmail, setUserEmail] = useState("");
  const [appUserName, setUserName] = useState("");
  const [appUserPassword, setUserPassword] = useState("");
  const [appUserLanguagesSpoken, setAppUserLanguagesSpoken] = useState<string[]>([]);

  const [artPieceName, setApName] = useState("");
  const [artPieceAddress, setApAddress] = useState("");
  const [artPieceUserDescription, setApUserDescription] = useState("");

  const [artPiecePosition, setApPosition] = useState("");
  const [artPieceContainsText, setApContainsText] = useState(false);
  const [artPieceTypes, setApTypes] = useState<string[]>([]);
  const [artPieceStyles, setApStyles] = useState<string[]>([]);
  const [artPieceTextLanguages, setApLangs] = useState<string[]>([]);

  const [containsTextTouched, setContainsTextTouched] = useState(false);

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

        setData({
          Users: users.map((u) => ({ id: String(u.id), name: u.appUserEmail, subtitle: u.appUserName })),
          ArtPieces: artPieces.map((a) => ({
            id: String(a.id),
            name: a.artPieceName ?? "ArtPiece",
            subtitle: a.artPieceAddress,
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

  const topTiles = useMemo(
    () =>
      (["Users", "ArtPieces"] as AdminEntityType[]).map((t) => ({
        type: t,
        count: data[t].length,
      })),
    [data]
  );

  const tileClass = (isActive: boolean) =>
    [styles.tile, isActive ? styles.tileActive : styles.tileInactive, loading ? styles.tileLoading : ""]
      .filter(Boolean)
      .join(" ");

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

      setSelectedItem(null);
      setSelectedType(null);
      opRef.current?.hide();
    } catch (e: any) {
      console.error(e);
      alert(e.message ?? "Delete error");
    }
  }, [selectedItem, selectedType]);

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

  const openEditDialog = useCallback(() => {
    if (!selectedItem) return;

    if (activeType === "Users") {
      setTargetAppUserEmail(selectedItem.name ?? "");
      setUserEmail(selectedItem.name ?? "");
      setUserName(selectedItem.subtitle ?? "");
      setUserPassword("");
      setAppUserLanguagesSpoken([]);
    }

    if (activeType === "ArtPieces") {
      setApName(selectedItem.name ?? "");
      setApAddress(selectedItem.subtitle ?? "");
      setApUserDescription("");
      setApPosition("");

      setApContainsText(false);
      setContainsTextTouched(false);

      setApTypes([]);
      setApStyles([]);
      setApLangs([]);
    }

    setEditOpen(true);
    opRef.current?.hide();
  }, [activeType, selectedItem]);

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

  const saveEdit = useCallback(async () => {
    if (!selectedItem) return;

    try {
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

      if (activeType === "ArtPieces") {
        const body: any = {
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

  return (
    <div className={styles.pageCenter}>
      <Toast ref={toast} position="top-right" />

      <Card title="Admin Page" className={styles.cardShell}>
        {error ? <div style={{ marginBottom: 10, color: "#ffd1d1", fontWeight: 700 }}>Error: {error}</div> : null}

        <div className={styles.tilesGrid2}>
          {topTiles.map((t) => (
            <div key={t.type} className={tileClass(activeType === t.type)} onClick={() => setActiveType(t.type)} role="button">
              <div style={{ fontSize: 14 }}>{t.type}</div>
              <div style={{ fontSize: 12, opacity: activeType === t.type ? 0.85 : 0.9 }}>
                {t.count} items {loading ? "(loading...)" : ""}
              </div>
            </div>
          ))}
        </div>

        <Divider style={{ opacity: 0.35 }} />

        <div className={styles.tilesGrid2}>
          {(Object.keys(data) as AdminEntityType[]).map((t) => (
            <div key={t} className={styles.listPanel}>
              <div className={styles.listHeader}>
                <div style={{ fontWeight: 800 }}>{t}</div>
                <Button icon="pi pi-plus" rounded text style={{ color: "white" }} onClick={() => {}} tooltip="Dodaj (TODO)" disabled />
              </div>

              <div style={{ marginTop: 8 }}>
                <DataTable
                  value={data[t]}
                  size="small"
                  scrollable
                  scrollHeight="260px"
                  selectionMode="single"
                  onRowClick={(e) => {
                    setActiveType(t);
                    onRowClick(t, e);
                  }}
                  style={{ background: "transparent" }}
                  emptyMessage={loading ? "Loading..." : "Brak danych"}
                >
                  <Column
                    field="name"
                    header=""
                    body={(row: RowItem) => (
                      <div className={styles.itemBody}>
                        <div className={styles.itemTitle}>{row.name}</div>
                        {row.subtitle ? <small className={styles.itemSubtitle}>{row.subtitle}</small> : null}
                      </div>
                    )}
                  />
                </DataTable>
              </div>
            </div>
          ))}
        </div>

        <OverlayPanel ref={opRef} dismissable>
          <Menu model={menuModel} />
        </OverlayPanel>

        <Dialog header={`Edytuj: ${activeType}`} visible={editOpen} style={{ width: "min(520px, 92vw)" }} onHide={() => setEditOpen(false)}>
          {activeType === "Users" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <small style={{ opacity: 0.85, fontWeight: 700 }}>Email</small>
                <InputText value={appUserEmail} onChange={(e) => setUserEmail(e.target.value)} className={styles.fullWidth} />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <small style={{ opacity: 0.85, fontWeight: 700 }}>Name</small>
                <InputText value={appUserName} onChange={(e) => setUserName(e.target.value)} className={styles.fullWidth} />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <small style={{ opacity: 0.85, fontWeight: 700 }}>Languages spoken</small>
                <MultiSelect
                  value={appUserLanguagesSpoken}
                  onChange={(e) => setAppUserLanguagesSpoken(e.value)}
                  options={languageOptions}
                  placeholder="Select languages"
                  className={styles.fullWidth}
                  display="chip"
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <small style={{ opacity: 0.85, fontWeight: 700 }}>Password</small>
                <InputText type="password" value={appUserPassword} onChange={(e) => setUserPassword(e.target.value)} className={styles.fullWidth} />
              </div>
            </div>
          )}

          {activeType === "ArtPieces" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <small style={{ opacity: 0.85, fontWeight: 700 }}>Name</small>
                <InputText value={artPieceName} onChange={(e) => setApName(e.target.value)} className={styles.fullWidth} />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <small style={{ opacity: 0.85, fontWeight: 700 }}>Address</small>
                <InputText value={artPieceAddress} onChange={(e) => setApAddress(e.target.value)} className={styles.fullWidth} />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <small style={{ opacity: 0.85, fontWeight: 700 }}>Description</small>
                <InputText value={artPieceUserDescription} onChange={(e) => setApUserDescription(e.target.value)} className={styles.fullWidth} />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <small style={{ opacity: 0.85, fontWeight: 700 }}>Position</small>
                <InputText value={artPiecePosition} onChange={(e) => setApPosition(e.target.value)} className={styles.fullWidth} />
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <small style={{ opacity: 0.85, fontWeight: 700 }}>Contains text</small>
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
                <div style={{ display: "grid", gap: 6 }}>
                  <small style={{ opacity: 0.85, fontWeight: 700 }}>Text languages</small>
                  <MultiSelect
                    value={artPieceTextLanguages}
                    onChange={(e) => setApLangs(e.value)}
                    options={languageOptions}
                    placeholder="Select languages"
                    className={styles.fullWidth}
                    display="chip"
                  />
                </div>
              )}

              <div style={{ display: "grid", gap: 6 }}>
                <small style={{ opacity: 0.85, fontWeight: 700 }}>Types</small>
                <MultiSelect
                  value={artPieceTypes}
                  onChange={(e) => setApTypes(e.value)}
                  options={typeOptions}
                  placeholder="Select types"
                  className={styles.fullWidth}
                  display="chip"
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <small style={{ opacity: 0.85, fontWeight: 700 }}>Styles</small>
                <MultiSelect
                  value={artPieceStyles}
                  onChange={(e) => setApStyles(e.value)}
                  options={styleOptions}
                  placeholder="Select styles"
                  className={styles.fullWidth}
                  display="chip"
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
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
