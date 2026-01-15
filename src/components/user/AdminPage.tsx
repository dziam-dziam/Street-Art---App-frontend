import React, { useMemo, useRef, useState } from "react";
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

type AdminEntityType = "Users" | "Cities" | "Districts" | "ArtPieces";

type RowItem = {
  id: string;
  name: string;
  subtitle?: string;
};

const DEMO: Record<AdminEntityType, RowItem[]> = {
  Users: [
    { id: "u1", name: "camila@email.com", subtitle: "Camila" },
    { id: "u2", name: "antoine@email.com", subtitle: "Antoine" },
    { id: "u3", name: "admin@email.com", subtitle: "Admin" },
  ],
  Cities: [
    { id: "c1", name: "Poznań" },
    { id: "c2", name: "Berlin" },
    { id: "c3", name: "Paris" },
  ],
  Districts: [
    { id: "d1", name: "Jeżyce", subtitle: "Poznań" },
    { id: "d2", name: "Wilda", subtitle: "Poznań" },
    { id: "d3", name: "Grunwald", subtitle: "Poznań" },
    { id: "d4", name: "Stare Miasto", subtitle: "Poznań" },
  ],
  ArtPieces: [
    { id: "a1", name: "Mural - Jeżyce", subtitle: "Jeżyce 12" },
    { id: "a2", name: "Sticker Wall", subtitle: "Jeżyce 5" },
    { id: "a3", name: "Bridge Tags", subtitle: "Nowe Miasto 21" },
  ],
};

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeType, setActiveType] = useState<AdminEntityType>("Users");
  const [data, setData] = useState<Record<AdminEntityType, RowItem[]>>(DEMO);

  // kliknięty element (do opcji edycji/usuwania)
  const [selectedItem, setSelectedItem] = useState<RowItem | null>(null);

  // overlay menu
  const opRef = useRef<OverlayPanel>(null);

  // dialog edycji
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");

  const topTiles = useMemo(
    () =>
      (["Users", "Cities", "Districts", "ArtPieces"] as AdminEntityType[]).map((t) => ({
        type: t,
        count: data[t].length,
      })),
    [data]
  );

  const menuModel = useMemo(
    () => [
      {
        label: "Opcje",
        items: [
          {
            label: "Edytuj",
            icon: "pi pi-pencil",
            command: () => {
              if (!selectedItem) return;
              setEditName(selectedItem.name);
              setEditOpen(true);
              opRef.current?.hide();
            },
          },
          {
            label: "Usuń",
            icon: "pi pi-trash",
            command: () => {
              if (!selectedItem) return;
              setData((prev) => ({
                ...prev,
                [activeType]: prev[activeType].filter((x) => x.id !== selectedItem.id),
              }));
              setSelectedItem(null);
              opRef.current?.hide();
            },
          },
        ],
      },
    ],
    [activeType, selectedItem]
  );

  const onRowClick = (e: any) => {
    const item = e.data as RowItem;
    setSelectedItem(item);
    opRef.current?.toggle(e.originalEvent);
  };

  const saveEdit = () => {
    if (!selectedItem) return;

    setData((prev) => ({
      ...prev,
      [activeType]: prev[activeType].map((x) =>
        x.id === selectedItem.id ? { ...x, name: editName } : x
      ),
    }));

    setSelectedItem((p) => (p ? { ...p, name: editName } : p));
    setEditOpen(false);
  };

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
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#7b83cf",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <Card
        title="Admin Page"
        style={{
          width: "min(980px, 96vw)",
          background: "#4b55a3",
          color: "white",
          borderRadius: 16,
        }}
      >
        {/* TOP 4 TILES */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {topTiles.map((t) => (
            <div
              key={t.type}
              style={tileStyle(activeType === t.type)}
              onClick={() => setActiveType(t.type)}
              role="button"
            >
              <div style={{ fontSize: 14 }}>{t.type}</div>
              <div style={{ fontSize: 12, opacity: activeType === t.type ? 0.85 : 0.9 }}>
                {t.count} items
              </div>
            </div>
          ))}
        </div>

        <Divider style={{ opacity: 0.35 }} />

        {/* 4 COLUMNS WITH LISTS (like mock) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {(Object.keys(DEMO) as AdminEntityType[]).map((t) => (
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
                <Button
                  icon="pi pi-plus"
                  rounded
                  text
                  style={{ color: "white" }}
                  onClick={() => {
                    // placeholder: add
                    const id = `${t[0].toLowerCase()}_${Date.now()}`;
                    setData((prev) => ({
                      ...prev,
                      [t]: [{ id, name: `${t} new` }, ...prev[t]],
                    }));
                  }}
                  tooltip="Dodaj"
                />
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
                    onRowClick(e);
                  }}
                  style={{ background: "transparent" }}
                  emptyMessage="Brak danych"
                >
                  <Column
                    field="name"
                    header=""
                    body={(row: RowItem) => (
                      <div style={{ display: "grid", gap: 2 }}>
                        <div style={{ fontWeight: 700, color: "white" }}>{row.name}</div>
                        {row.subtitle ? (
                          <small style={{ opacity: 0.8 }}>{row.subtitle}</small>
                        ) : null}
                      </div>
                    )}
                  />
                </DataTable>
              </div>
            </div>
          ))}
        </div>

        {/* overlay menu for edit/delete */}
        <OverlayPanel ref={opRef} dismissable>
          <Menu model={menuModel} />
        </OverlayPanel>

        {/* Edit dialog */}
        <Dialog
          header={`Edytuj: ${activeType}`}
          visible={editOpen}
          style={{ width: "min(520px, 92vw)" }}
          onHide={() => setEditOpen(false)}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <span className="p-float-label">
              <InputText
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ width: "100%" }}
              />
              <label htmlFor="editName">Name</label>
            </span>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button label="Cancel" severity="secondary" onClick={() => setEditOpen(false)} />
              <Button label="Save" icon="pi pi-check" onClick={saveEdit} disabled={!editName.trim()} />
            </div>
          </div>
        </Dialog>

        {/* bottom leave button */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
          <Button
            label="Leave Admin Page"
            icon="pi pi-arrow-left"
            severity="secondary"
            onClick={() => navigate("/app")}
            style={{
              borderRadius: 12,
              fontWeight: 800,
              paddingInline: 24,
            }}
          />
        </div>
      </Card>
    </div>
  );
};
