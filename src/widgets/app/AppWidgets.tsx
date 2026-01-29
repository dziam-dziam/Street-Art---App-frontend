import React, { useEffect } from "react";
import styles from "../../styles/pages.module.css";

import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap } from "react-leaflet";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { Avatar } from "primereact/avatar";
import { Divider } from "primereact/divider";
import { Menu } from "primereact/menu";

export type DistrictName = "Jeżyce" | "Stare Miasto" | "Grunwald" | "Wilda" | "Łazarz";

export type ArtPoint = {
  id: string;
  title: string;
  address: string;
  district: DistrictName;
  lat: number;
  lng: number;
};

export function FitAndLockToGeoJson({ data }: { data: any }) {
  const map = useMap();

  useEffect(() => {
    if (!data) return;

    try {
      const layer = L.geoJSON(data);
      const bounds = layer.getBounds();
      if (!bounds.isValid()) return;

      map.fitBounds(bounds, { padding: [20, 20] });

      const padded = bounds.pad(0.05);
      map.setMaxBounds(padded);
      (map as any).options.maxBoundsViscosity = 1.0;

      map.setMinZoom(11);
      map.setMaxZoom(18);
    } catch (e) {
      console.error("Error fitting/locking GeoJSON bounds:", e);
    }
  }, [data, map]);

  return null;
}

type MapWidgetProps = {
  boundary: any;
  points: ArtPoint[];
  loading?: boolean;
  onPickPoint: (p: ArtPoint) => void;
};

export const MapWidget: React.FC<MapWidgetProps> = ({ boundary, points, loading, onPickPoint }) => {
  return (
    <div className={styles.mapViewport}>
      <MapContainer center={[52.4064, 16.9252] as [number, number]} zoom={12} worldCopyJump={false}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <GeoJSON
          data={boundary as any}
          style={() => ({
            color: "#ffffff",
            weight: 3,
            fillOpacity: 0.08,
          })}
        />
        <FitAndLockToGeoJson data={boundary} />

        {!loading &&
          points.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={7}
              eventHandlers={{ click: () => onPickPoint(p) }}
            >
              <Popup>
                <b>{p.title}</b>
                <br />
                {p.address}
                <br />
                {p.district}
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
};

type FloatingActionsProps = {
  isAdmin: boolean;
  onGoAdmin: () => void;
  onAddNew: () => void;
};

export const FloatingActions: React.FC<FloatingActionsProps> = ({ isAdmin, onGoAdmin, onAddNew }) => {
  return (
    <div className={styles.floatingActions}>
      {isAdmin && (
        <Button
          label="Admin Page"
          icon="pi pi-shield"
          severity="warning"
          onClick={onGoAdmin}
          className={styles.btnRounded12Bold}
        />
      )}

      <Button
        label="Add New"
        icon="pi pi-plus"
        iconPos="right"
        onClick={onAddNew}
        className={`${styles.btnRounded12Bold} ${styles.btnShadow}`}
      />
    </div>
  );
};

type UserSidebarProps = {
  visible: boolean;
  onHide: () => void;
  menuModel: any[];
  userName?: string;
  userEmail?: string;
};

export const UserSidebar: React.FC<UserSidebarProps> = ({ visible, onHide, menuModel, userName, userEmail }) => {
  return (
    <Sidebar visible={visible} onHide={onHide} position="left" className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <Avatar icon="pi pi-user" size="large" shape="circle" />
        <div>
          <div className={styles.sidebarUserTitle}>{userName ?? "Użytkownik"}</div>
          <small className={styles.sidebarUserSubtitle}>{userEmail ?? "user@email.com"}</small>
        </div>
      </div>

      <Divider />

      <Menu model={menuModel} className={styles.fullWidth} />
    </Sidebar>
  );
};
