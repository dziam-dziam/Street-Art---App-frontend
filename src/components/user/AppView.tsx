import React, { useMemo, useState, useEffect, useCallback  } from "react";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { Divider } from "primereact/divider";
import { Menu } from "primereact/menu";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import L from "leaflet";
import { GeoJSON, useMap } from "react-leaflet";
import poz from "../assets/poznan.json";


type DistrictName =
  | "Jeżyce"
  | "Stare Miasto"
  | "Grunwald"
  | "Wilda"
  | "Łazarz";

type ArtPoint = {
  id: string;
  title: string;
  address: string;
  district: DistrictName;
  lat: number;
  lng: number;
};

type Cluster = {
  id: string;
  count: number;
  lat: number;
  lng: number;
  district?: DistrictName;
  points?: ArtPoint[];
};

type ArtPieceMapPointDto = {
  id: number;
  title: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
};

const BASE_URL = "http://localhost:8080";

function projectToCanvas(lat: number, lng: number, width: number, height: number) {
  const latMin = 52.385,
    latMax = 52.425;
  const lngMin = 16.885,
    lngMax = 16.975;

  const x = ((lng - lngMin) / (lngMax - lngMin)) * width;
  const y = (1 - (lat - latMin) / (latMax - latMin)) * height;
  return { x, y };
}




function normalizeDistrict(d: string): DistrictName {
  const x = (d ?? "").trim().toLowerCase();

  if (x === "jeżyce" || x === "jezyce") return "Jeżyce";
  if (x === "stare miasto" || x === "staremiasto") return "Stare Miasto";
  if (x === "grunwald") return "Grunwald";
  if (x === "wilda") return "Wilda";
  if (x === "łazarz") return "Łazarz";
  return "Jeżyce";
}

function FitAndLockToGeoJson({ data }: { data: any }) {
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

function pickPoznanBoundary(fc: any) {
  if (!fc || fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) return fc;

  const boundary = fc.features.find((f: any) => {
    const t = f?.geometry?.type;
    const name = (f?.properties?.name ?? "").toString().toLowerCase();
    const isPoly = t === "Polygon" || t === "MultiPolygon";
    return isPoly && name.includes("pozna");
  });

  if (!boundary) return fc;

  return { type: "FeatureCollection", features: [boundary] };
}

export const AppView: React.FC = () => {

  const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  let cancelled = false;

  (async () => {
    try {
      const res = await fetch("http://localhost:8080/auth/me", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) return;

      const data = await res.json().catch(() => null);
      const roles: string[] = data?.roles ?? [];
      const admin = roles.includes("ROLE_ADMIN");

      if (!cancelled) setIsAdmin(admin);
    } catch {
      // ignore
    }
  })();

  return () => { cancelled = true; };
}, []);


  const pozBoundary = useMemo(() => pickPoznanBoundary(poz as any), []);

  const navigate = useNavigate();

  const onLogout = useCallback(async () => {
  try {
    const res = await fetch("http://localhost:8080/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      alert(`Logout failed: ${res.status} ${body}`);
      return;
    }

    setSidebarVisible(false);
    navigate("/login", { replace: true });
  } catch (e) {
    console.error(e);
    alert("Logout error");
  }
}, [navigate]);


  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [zoom, setZoom] = useState(3); // 1..5
  const [selected, setSelected] = useState<ArtPoint | null>(null);

  const [points, setPoints] = useState<ArtPoint[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [pointsError, setPointsError] = useState<string | null>(null);

const items = useMemo(
  () => [
    { label: "Mój profil", icon: "pi pi-user" },
    { label: "Moje dzieła", icon: "pi pi-images" },
    { label: "Ustawienia", icon: "pi pi-cog" },
    { separator: true },
    { label: "Wyloguj", icon: "pi pi-sign-out", command: onLogout },
  ],
  [onLogout]
);


  useEffect(() => {
    let cancelled = false;

    async function loadPoints() {
      setLoadingPoints(true);
      setPointsError(null);

      try {
        const res = await fetch(`${BASE_URL}/map/artPieces`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Jeśli masz JWT:
            // "Authorization": `Bearer ${localStorage.getItem("token") ?? ""}`,
          },
          credentials: "include", // jeśli cookies/session; nie szkodzi też przy permitAll
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`GET /map/artPieces failed: ${res.status}. ${body}`);
        }

        const data: ArtPieceMapPointDto[] = await res.json();

        const mapped: ArtPoint[] = (data ?? [])
          .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng))
          .map((d) => ({
            id: String(d.id),
            title: d.title ?? "(no title)",
            address: d.address ?? "",
            district: normalizeDistrict(d.district),
            lat: d.lat,
            lng: d.lng,
          }));

        if (!cancelled) setPoints(mapped);
      } catch (e: any) {
        if (!cancelled) setPointsError(e?.message ?? "Unknown error");
      } finally {
        if (!cancelled) setLoadingPoints(false);
      }
    }

    loadPoints();
    return () => {
      cancelled = true;
    };
  }, []);

  const onZoomIn = () => setZoom((z) => Math.min(5, z + 1));
  const onZoomOut = () => setZoom((z) => Math.max(1, z - 1));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#7b83cf",
        padding: 24,
        display: "grid",
        placeItems: "center",
      }}
    >
      <Card
        title="App View"
        style={{
          width: "min(1100px, 96vw)",
          background: "#4b55a3",
          color: "white",
          borderRadius: 16,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 14 }}>
          <div
  style={{
    background: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
  }}
>
  <Button
    icon="pi pi-bars"
    rounded
    text
    aria-label="menu"
    onClick={() => setSidebarVisible(true)}
    style={{ color: "white" }}
  />
</div>


          <div
            style={{
              position: "relative",
              background: "rgba(0,0,0,0.18)",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.22)",
              padding: 14,
              minHeight: 520,
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 8, zIndex: 5 }}>
              <Button icon="pi pi-minus" onClick={onZoomOut} rounded />
              <Button icon="pi pi-plus" onClick={onZoomIn} rounded />
              <Tag value={`Zoom: ${zoom}`} severity="info" />
              {loadingPoints && <Tag value="Loading points..." severity="warning" />}
              {pointsError && <Tag value={`Error: ${pointsError}`} severity="danger" />}
              {!loadingPoints && !pointsError && <Tag value={`${points.length} pts`} severity="success" />}
            </div>

            <div style={{ position: "relative", height: 480, borderRadius: 12, overflow: "hidden", zIndex: 1 }}>
              <MapContainer
  center={[52.4064, 16.9252] as [number, number]}
  zoom={12}
  style={{ height: "100%", width: "100%", borderRadius: 12 }}
  worldCopyJump={false}
>

                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                                <GeoJSON
data={pozBoundary as any}
                  style={() => ({
                    color: "#ffffff",
                    weight: 3,
                    fillOpacity: 0.08,
                  })}
                />

                <FitAndLockToGeoJson data={pozBoundary} />



                {points.map((p) => (
                  <CircleMarker
                    key={p.id}
                    center={[p.lat, p.lng]}
                    radius={7}
                    eventHandlers={{
                      click: () => setSelected(p),
                    }}
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


            <div
  style={{
    position: "absolute",
    right: 18,
    bottom: 18,
    zIndex: 9999,
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 14, // <- zwiększ odstęp (np. 14 / 18 / 24)
    alignItems: "flex-end",
  }}
>

{isAdmin && (
  <Button
    label="Admin Page"
    icon="pi pi-shield"
    severity="warning"
    onClick={() => navigate("/admin")}
    style={{ borderRadius: 12, fontWeight: 700 }}
  />
)}


              <Button
  label="Add New"
  icon="pi pi-plus"
  iconPos="right"
  onClick={() => navigate("/artpieces/add")}
  style={{
    borderRadius: 12,
    fontWeight: 700,
    boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
  }}
/>

            </div>
          </div>
        </div>
      </Card>

      <Sidebar
  visible={sidebarVisible}
  onHide={() => setSidebarVisible(false)}
  position="left"
  style={{ width: 320 }}
>
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <Avatar icon="pi pi-user" size="large" shape="circle" />
    <div>
      <div style={{ fontWeight: 800 }}>Użytkownik</div>
      <small style={{ opacity: 0.75 }}>user@email.com</small>
    </div>
  </div>

  <Divider />

  <Menu model={items} style={{ width: "100%" }} />
</Sidebar>


      <Dialog
        header={selected ? selected.title : "Details"}
        visible={!!selected}
        style={{ width: "min(520px, 92vw)" }}
        onHide={() => setSelected(null)}
      >
        {selected && (
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <b>District:</b> {selected.district}
            </div>
            <div>
              <b>Address:</b> {selected.address}
            </div>
            <div>
              <b>Lat/Lng:</b> {selected.lat.toFixed(4)} / {selected.lng.toFixed(4)}
            </div>
          
          </div>
        )}
      </Dialog>
    </div>
  );
};

function MarkerLayer(props: {
  zoom: number;
  items: (Cluster | ArtPoint)[];
  onClusterClick: () => void;
  onPointClick: (p: ArtPoint) => void;
}) {
  const { zoom, items, onClusterClick, onPointClick } = props;

  const W = 800;
  const H = 480;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {items.map((item) => {
        const isCluster = (item as any).count !== undefined;
        const lat = (item as any).lat as number;
        const lng = (item as any).lng as number;
        const { x, y } = projectToCanvas(lat, lng, W, H);

        if (isCluster) {
          const c = item as Cluster;
          const size = Math.min(54, 26 + c.count * 3);

          return (
            <button
              key={c.id}
              onClick={onClusterClick}
              style={{
                pointerEvents: "auto",
                position: "absolute",
                left: `${(x / W) * 100}%`,
                top: `${(y / H) * 100}%`,
                transform: "translate(-50%, -50%)",
                width: size,
                height: size,
                borderRadius: 999,
                border: "2px solid rgba(255,255,255,0.7)",
                background: "rgba(30, 144, 255, 0.85)",
                color: "white",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
              }}
              title="Kliknij aby przybliżyć"
            >
              {c.count}
            </button>
          );
        }

        const p = item as ArtPoint;
        const dotSize = zoom >= 5 ? 14 : 12;

        return (
          <button
            key={p.id}
            onClick={() => onPointClick(p)}
            style={{
              pointerEvents: "auto",
              position: "absolute",
              left: `${(x / W) * 100}%`,
              top: `${(y / H) * 100}%`,
              transform: "translate(-50%, -50%)",
              width: dotSize,
              height: dotSize,
              borderRadius: 999,
              border: "2px solid rgba(255,255,255,0.9)",
              background: "rgba(126, 224, 129, 0.95)",
              cursor: "pointer",
              boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
            }}
            title={p.title}
          />
        );
      })}
    </div>
      );

}
