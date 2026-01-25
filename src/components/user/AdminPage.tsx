import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
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

type AdminEntityType = "Users" | "ArtPieces";

type RowItem = {
  id: string;
  name: string;
  subtitle?: string;
};

type UserEntity = { id: number; appUserName: string; appUserEmail: string };

// dopasowane do Twojego ArtPieceAdminDto
type ArtPieceEntity = { id: number; artPieceAddress: string; artPieceName: string; artPieceUserDescription: string };

const BASE = "http://localhost:8080";

const EMPTY: Record<AdminEntityType, RowItem[]> = {
  Users: [],
  ArtPieces: [],
};

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeType, setActiveType] = useState<AdminEntityType>("Users");
  const [data, setData] = useState<Record<AdminEntityType, RowItem[]>>(EMPTY);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<RowItem | null>(null);
  const [selectedType, setSelectedType] = useState<AdminEntityType | null>(null);

  const opRef = useRef<OverlayPanel>(null);

  // --- EDIT STATE ---
  const [editOpen, setEditOpen] = useState(false);

  // ===== USERS (UpdateAppUserDto) =====
  const [targetAppUserEmail, setTargetAppUserEmail] = useState(""); // email do identyfikacji (stary)
  const [appUserEmail, setUserEmail] = useState("");
  const [appUserName, setUserName] = useState("");
  const [appUserPassword, setUserPassword] = useState("");
  const [appUserLanguages, setUserLanguages] = useState<string>(""); // csv

  // ===== ARTPIECES (UpdateArtPieceDto) =====
  const [artPieceName, setApName] = useState("");
  const [artPieceAddress, setApAddress] = useState("");
  const [artPieceUserDescription, setApUserDescription] = useState("");

  // opcjonalne pola (zostawiamy, ale NIE wysyłamy jeśli puste)
  const [artPiecePosition, setApPosition] = useState("");
  const [artPieceContainsText, setApContainsText] = useState(false);
  const [artPieceTypesCsv, setApTypesCsv] = useState<string>("");
  const [artPieceStylesCsv, setApStylesCsv] = useState<string>("");
  const [artPieceTextLanguagesCsv, setApLangsCsv] = useState<string>("");

  // ========== GET ==========
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

  // ========== DELETE ==========
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
  }, [deleteItem, selectedItem, selectedType]);

  // ========== PUT (tylko ArtPieces - jak miałeś) ==========
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

  // helpers
  const csvToStringArray = (csv: string): string[] =>
    csv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const csvToEnumArray = (csv: string): string[] =>
    csv
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

  // ========== MENU (Edytuj/Usuń) ==========
  const openEditDialog = useCallback(() => {
    if (!selectedItem) return;

    if (activeType === "Users") {
      setTargetAppUserEmail(selectedItem.name ?? ""); // identyfikacja po STARYM emailu
      setUserEmail(selectedItem.name ?? "");
      setUserName(selectedItem.subtitle ?? "");
      setUserPassword("");
      setUserLanguages("");
    }

    if (activeType === "ArtPieces") {
      setApName(selectedItem.name ?? "");
      setApAddress(selectedItem.subtitle ?? "");
      setApUserDescription("");
      setApPosition("");
      setApContainsText(false);
      setApTypesCsv("");
      setApStylesCsv("");
      setApLangsCsv("");
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

  // ========== SAVE EDIT ==========
  const saveEdit = useCallback(async () => {
    if (!selectedItem) return;

    try {
      // ===== USERS: PUT /updateAppUser/user?appUserEmail=OLD_EMAIL =====
      if (activeType === "Users") {
        if (!targetAppUserEmail.trim()) {
          throw new Error("Brak targetAppUserEmail (email do identyfikacji).");
        }

        const body: any = {
          ...(appUserName.trim() ? { appUserName: appUserName.trim() } : {}),
          ...(appUserEmail.trim() ? { appUserEmail: appUserEmail.trim() } : {}),
          ...(appUserLanguages.trim() ? { appUserLanguagesSpoken: csvToStringArray(appUserLanguages) } : {}),
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

        // UI: name=email, subtitle=name
        setData((prev) => ({
          ...prev,
          Users: prev.Users.map((x) =>
            x.id === selectedItem.id ? { ...x, name: appUserEmail || x.name, subtitle: appUserName || x.subtitle } : x
          ),
        }));

        setSelectedItem((p) => (p ? { ...p, name: appUserEmail || p.name, subtitle: appUserName || p.subtitle } : p));

        setEditOpen(false);
        return;
      }

      // ===== ARTPIECES: PUT /updateArtPiece/artPiece/{id} =====
      if (activeType === "ArtPieces") {
        const body: any = {
          ...(artPieceAddress.trim() ? { artPieceAddress: artPieceAddress.trim() } : {}),
          ...(artPieceName.trim() ? { artPieceName: artPieceName.trim() } : {}),
          ...(artPieceUserDescription.trim() ? { artPieceUserDescription: artPieceUserDescription.trim() } : {}),
          ...(artPiecePosition.trim() ? { artPiecePosition: artPiecePosition.trim() } : {}),
          // UWAGA: to jest ryzykowne bez prefill -> tylko jeśli użytkownik wpisze CSV:
          ...(artPieceTypesCsv.trim() ? { artPieceTypes: csvToEnumArray(artPieceTypesCsv) } : {}),
          ...(artPieceStylesCsv.trim() ? { artPieceStyles: csvToEnumArray(artPieceStylesCsv) } : {}),
          ...(artPieceTextLanguagesCsv.trim()
            ? { artPieceTextLanguages: csvToStringArray(artPieceTextLanguagesCsv) }
            : {}),
          // NIE wysyłam artPieceContainsText “zawsze”, bo nie masz wartości z GET i nadpiszesz DB
          // jeśli chcesz, dodamy "touched" flagę i wtedy wyślemy.
        };

        await putItem("ArtPieces", selectedItem.id, body);

        setData((prev) => ({
          ...prev,
          ArtPieces: prev.ArtPieces.map((x) =>
            x.id === selectedItem.id ? { ...x, name: artPieceName || x.name, subtitle: artPieceAddress || x.subtitle } : x
          ),
        }));

        setSelectedItem((p) => (p ? { ...p, name: artPieceName || p.name, subtitle: artPieceAddress || p.subtitle } : p));

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
    // users
    targetAppUserEmail,
    appUserEmail,
    appUserName,
    appUserPassword,
    appUserLanguages,
    // artpieces
    artPieceName,
    artPieceAddress,
    artPieceUserDescription,
    artPiecePosition,
    artPieceTypesCsv,
    artPieceStylesCsv,
    artPieceTextLanguagesCsv,
  ]);

  const tileStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? "rgba(126,224,129,0.95)" : "rgba(255,255,255,0.18)",
    color: isActive ? "#1b1b1b" : "white",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.22)",
    userSelect: "none",
    textAlign: "center",
    fontWeight: 800,
    opacity: loading ? 0.85 : 1,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#7b83cf", display: "grid", placeItems: "center", padding: 24 }}>
      <Card
        title="Admin Page"
        style={{ width: "min(980px, 96vw)", background: "#4b55a3", color: "white", borderRadius: 16 }}
      >
        {error ? <div style={{ marginBottom: 10, color: "#ffd1d1", fontWeight: 700 }}>Error: {error}</div> : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {topTiles.map((t) => (
            <div
              key={t.type}
              style={tileStyle(activeType === t.type)}
              onClick={() => setActiveType(t.type)}
              role="button"
            >
              <div style={{ fontSize: 14 }}>{t.type}</div>
              <div style={{ fontSize: 12, opacity: activeType === t.type ? 0.85 : 0.9 }}>
                {t.count} items {loading ? "(loading...)" : ""}
              </div>
            </div>
          ))}
        </div>

        <Divider style={{ opacity: 0.35 }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {(Object.keys(data) as AdminEntityType[]).map((t) => (
            <div
              key={t}
              style={{
                background: "rgba(0,0,0,0.14)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 14,
                padding: 10,
                minHeight: 320,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                      <div style={{ display: "grid", gap: 2 }}>
                        <div style={{ fontWeight: 700, color: "white" }}>{row.name}</div>
                        {row.subtitle ? <small style={{ opacity: 0.8 }}>{row.subtitle}</small> : null}
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

        <Dialog
          header={`Edytuj: ${activeType}`}
          visible={editOpen}
          style={{ width: "min(520px, 92vw)" }}
          onHide={() => setEditOpen(false)}
        >
          <div style={{ display: "grid", gap: 12 }}>
            {activeType === "Users" && (
              <>
                <span className="p-float-label">
                  <InputText id="uEmail" value={appUserEmail} onChange={(e) => setUserEmail(e.target.value)} style={{ width: "100%" }} />
                  <label htmlFor="uEmail">appUserEmail</label>
                </span>

                <span className="p-float-label">
                  <InputText id="uName" value={appUserName} onChange={(e) => setUserName(e.target.value)} style={{ width: "100%" }} />
                  <label htmlFor="uName">appUserName</label>
                </span>

                <span className="p-float-label">
                  <InputText
                    id="uLangs"
                    value={appUserLanguages}
                    onChange={(e) => setUserLanguages(e.target.value)}
                    style={{ width: "100%" }}
                  />
                  <label htmlFor="uLangs">appUserLanguagesSpoken (csv, np: en,pl,de)</label>
                </span>

                <span className="p-float-label">
                  <InputText
                    id="uPass"
                    value={appUserPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    style={{ width: "100%" }}
                  />
                  <label htmlFor="uPass">appUserPassword (opcjonalnie)</label>
                </span>
              </>
            )}

            {activeType === "ArtPieces" && (
              <>
                <span className="p-float-label">
                  <InputText id="apName" value={artPieceName} onChange={(e) => setApName(e.target.value)} style={{ width: "100%" }} />
                  <label htmlFor="apName">artPieceName</label>
                </span>

                <span className="p-float-label">
                  <InputText
                    id="apAddress"
                    value={artPieceAddress}
                    onChange={(e) => setApAddress(e.target.value)}
                    style={{ width: "100%" }}
                  />
                  <label htmlFor="apAddress">artPieceAddress</label>
                </span>

                <span className="p-float-label">
                  <InputText
                    id="apDesc"
                    value={artPieceUserDescription}
                    onChange={(e) => setApUserDescription(e.target.value)}
                    style={{ width: "100%" }}
                  />
                  <label htmlFor="apDesc">artPieceUserDescription</label>
                </span>

                {/* opcjonalne pola */}
                <span className="p-float-label">
                  <InputText id="apPos" value={artPiecePosition} onChange={(e) => setApPosition(e.target.value)} style={{ width: "100%" }} />
                  <label htmlFor="apPos">artPiecePosition (opcjonalnie)</label>
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    id="apContainsText"
                    type="checkbox"
                    checked={artPieceContainsText}
                    onChange={(e) => setApContainsText(e.target.checked)}
                  />
                  <label htmlFor="apContainsText" style={{ cursor: "pointer" }}>
                    artPieceContainsText (UWAGA: nie wysyłam tego w PUT w tej wersji)
                  </label>
                </div>

                <span className="p-float-label">
                  <InputText id="apTypes" value={artPieceTypesCsv} onChange={(e) => setApTypesCsv(e.target.value)} style={{ width: "100%" }} />
                  <label htmlFor="apTypes">artPieceTypes (csv enum, np: MURAL,STICKER)</label>
                </span>

                <span className="p-float-label">
                  <InputText id="apStyles" value={artPieceStylesCsv} onChange={(e) => setApStylesCsv(e.target.value)} style={{ width: "100%" }} />
                  <label htmlFor="apStyles">artPieceStyles (csv enum, np: REALISM,ABSTRACT)</label>
                </span>

                <span className="p-float-label">
                  <InputText id="apLangs" value={artPieceTextLanguagesCsv} onChange={(e) => setApLangsCsv(e.target.value)} style={{ width: "100%" }} />
                  <label htmlFor="apLangs">artPieceTextLanguages (csv, np: en,pl)</label>
                </span>
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
              <Button label="Cancel" severity="secondary" onClick={() => setEditOpen(false)} />
              <Button label="Save" icon="pi pi-check" onClick={saveEdit} />
            </div>
          </div>
        </Dialog>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
          <Button
            label="Leave Admin Page"
            icon="pi pi-arrow-left"
            severity="secondary"
            onClick={() => navigate("/app")}
            style={{ borderRadius: 12, fontWeight: 800, paddingInline: 24 }}
          />
        </div>
      </Card>
    </div>
  );
};
