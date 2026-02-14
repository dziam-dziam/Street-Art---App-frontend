import React from "react";
import styles from "../../styles/pages.module.css";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const tileClass = (isActive: boolean) =>
    [styles.tile, isActive ? styles.tileActive : styles.tileInactive, loading ? styles.tileLoading : ""]
      .filter(Boolean)
      .join(" ");

  const labelFor = (type: AdminEntityType) => (type === "Users" ? t("entities.users") : t("entities.artPieces"));

  return (
    <div className={styles.tilesGrid2}>
      {tiles.map((tt) => (
        <div key={tt.type} className={tileClass(activeType === tt.type)} onClick={() => onPick(tt.type)} role="button">
          <div className={styles.tileTitle}>{labelFor(tt.type)}</div>
          <div className={`${styles.tileCount} ${activeType === tt.type ? styles.tileCountActive : styles.tileCountInactive}`}>
            {tt.count} {loading ? `(${t("common.loading")})` : "items"}
          </div>
        </div>
      ))}
    </div>
  );
};

type EntityPanelProps = {
  title: AdminEntityType; // ✅ zostaje AdminEntityType (nie string)
  rows: RowItem[];
  loading?: boolean;
  onRowClick: (e: any) => void;
};

export const AdminEntityPanel: React.FC<EntityPanelProps> = ({ title, rows, loading, onRowClick }) => {
  const { t } = useTranslation();

  const headerTitle = title === "Users" ? t("entities.users") : t("entities.artPieces");

  return (
    <div className={styles.listPanel}>
      <div className={styles.listHeader}>
        <div className={styles.adminListTitle}>{headerTitle}</div>
        <Button
          icon="pi pi-plus"
          rounded
          text
          className={styles.iconWhite}
          onClick={() => {}}
          tooltip="Dodaj (TODO)"
          disabled
        />
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
          emptyMessage={loading ? t("common.loading") : "Brak danych"}
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