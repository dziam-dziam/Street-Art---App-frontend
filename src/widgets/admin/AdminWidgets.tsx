// src/widgets/admin/AdminWidgets.tsx
import React from "react";
import styles from "../../styles/pages.module.css";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

export type AdminEntityType = "Users" | "ArtPieces";

export type RowItem = {
  id: string;
  name: string;
  subtitle?: string;
};

type TilesProps = {
  tiles: { type: AdminEntityType; count: number }[];
  activeType: AdminEntityType;
  loading?: boolean;
  onPick: (t: AdminEntityType) => void;
};

export const AdminTiles: React.FC<TilesProps> = ({ tiles, activeType, loading, onPick }) => {
  const tileClass = (isActive: boolean) =>
    [styles.tile, isActive ? styles.tileActive : styles.tileInactive, loading ? styles.tileLoading : ""]
      .filter(Boolean)
      .join(" ");

  return (
    <div className={styles.tilesGrid2}>
      {tiles.map((t) => (
        <div key={t.type} className={tileClass(activeType === t.type)} onClick={() => onPick(t.type)} role="button">
          <div className={styles.tileTitle}>{t.type}</div>
          <div className={`${styles.tileCount} ${activeType === t.type ? styles.tileCountActive : styles.tileCountInactive}`}>
            {t.count} items {loading ? "(loading...)" : ""}
          </div>
        </div>
      ))}
    </div>
  );
};

type EntityPanelProps = {
  title: AdminEntityType;
  rows: RowItem[];
  loading?: boolean;
  onRowClick: (e: any) => void;
};

export const AdminEntityPanel: React.FC<EntityPanelProps> = ({ title, rows, loading, onRowClick }) => {
  return (
    <div className={styles.listPanel}>
      <div className={styles.listHeader}>
        <div className={styles.adminListTitle}>{title}</div>
        <Button icon="pi pi-plus" rounded text className={styles.iconWhite} onClick={() => {}} tooltip="Dodaj (TODO)" disabled />
      </div>

      <div className={styles.mt8}>
        <DataTable
          value={rows}
          size="small"
          scrollable
          scrollHeight="260px"
          selectionMode="single"
          onRowClick={onRowClick}
          className={styles.adminTable}
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
  );
};
