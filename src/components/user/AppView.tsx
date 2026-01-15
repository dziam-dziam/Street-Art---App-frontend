import React, { useMemo, useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { Divider } from "primereact/divider";
import { Menu } from "primereact/menu";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { useNavigate } from "react-router-dom";

/**
 * W tej wersji:
 * - mapa to placeholder (SVG) dzielnic
 * - punkty/klastry są liczone "na sucho" po zoomie
 * - klik w klaster -> zoom in
 * - klik w punkt -> pokazuje szczegóły
 */


type DistrictName =
  | "Jeżyce"
  | "Stare Miasto"
  | "Grunwald"
  | "Wilda"
  | "Nowe Miasto";

type ArtPoint = {
  id: string;
  title: string;
  address: string;
  district: DistrictName;
  lat: number; // docelowo z geokodowania
  lng: number;
};

type Cluster = {
  id: string;
  count: number;
  lat: number;
  lng: number;
  district?: DistrictName;
  points?: ArtPoint[]; // opcjonalnie
};

const POZNAN_CENTER = { lat: 52.4064, lng: 16.9252 };

// DEMO dane (zastąpisz backendem)
const DEMO_POINTS: ArtPoint[] = [
  { id: "a1", title: "Mural 1", address: "Jeżyce 12", district: "Jeżyce", lat: 52.412, lng: 16.915 },
  { id: "a2", title: "Sticker wall", address: "Jeżyce 5", district: "Jeżyce", lat: 52.409, lng: 16.912 },
  { id: "a3", title: "Mural Wilda", address: "Wilda 33", district: "Wilda", lat: 52.397, lng: 16.928 },
  { id: "a4", title: "Graffiti spot", address: "Grunwald 7", district: "Grunwald", lat: 52.392, lng: 16.899 },
  { id: "a5", title: "Old Town piece", address: "Stare Miasto 1", district: "Stare Miasto", lat: 52.409, lng: 16.934 },
  { id: "a6", title: "Bridge tags", address: "Nowe Miasto 21", district: "Nowe Miasto", lat: 52.405, lng: 16.955 },
  { id: "a7", title: "Corner mural", address: "Nowe Miasto 9", district: "Nowe Miasto", lat: 52.401, lng: 16.948 },
];

// mała funkcja do "mapowania" lat/lng -> pozycja na canvasie (placeholder)
function projectToCanvas(lat: number, lng: number, width: number, height: number) {
  // tylko symulacja: weźmy prosty bounding box wokół Poznania
  const latMin = 52.385, latMax = 52.425;
  const lngMin = 16.885, lngMax = 16.975;

  const x = ((lng - lngMin) / (lngMax - lngMin)) * width;
  const y = (1 - (lat - latMin) / (latMax - latMin)) * height;
  return { x, y };
}

// InPost-style: im mniejszy zoom, tym większe grupowanie
function clusterPoints(points: ArtPoint[], zoom: number): (Cluster | ArtPoint)[] {
  // zoom: 1..5 (1 = daleko, 5 = blisko)
  // cellSize rośnie gdy zoom jest mniejszy => więcej punktów w klastrze
  const cellSize = zoom <= 2 ? 0.02 : zoom === 3 ? 0.012 : zoom === 4 ? 0.007 : 0.004;

  const grid = new Map<string, ArtPoint[]>();

  for (const p of points) {
    const gx = Math.floor(p.lng / cellSize);
    const gy = Math.floor(p.lat / cellSize);
    const key = `${gx}_${gy}`;
    const bucket = grid.get(key) ?? [];
    bucket.push(p);
    grid.set(key, bucket);
  }

  const out: (Cluster | ArtPoint)[] = [];
  for (const [key, bucket] of grid.entries()) {
    if (bucket.length === 1 && zoom >= 4) {
      out.push(bucket[0]);
      continue;
    }

    // centroid
const lat = bucket.reduce<number>((s, b) => s + b.lat, 0) / bucket.length;
const lng = bucket.reduce<number>((s, b) => s + b.lng, 0) / bucket.length;


    out.push({
      id: `c_${key}`,
      count: bucket.length,
      lat,
      lng,
      points: bucket,
    });
  }

  // gdy zoom jest duży, pokazuj więcej “pojedynczych”
  if (zoom >= 5) return points;
  return out;
}

export const AppView: React.FC = () => {
    const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [zoom, setZoom] = useState(3); // 1..5
  const [selected, setSelected] = useState<ArtPoint | null>(null);
  


  const items = useMemo(
    () => [
      { label: "Mój profil", icon: "pi pi-user" },
      { label: "Moje dzieła", icon: "pi pi-images" },
      { label: "Ustawienia", icon: "pi pi-cog" },
      { separator: true },
      { label: "Wyloguj", icon: "pi pi-sign-out" },
    ],
    []
  );

  const clustered = useMemo(() => clusterPoints(DEMO_POINTS, zoom), [zoom]);

  const onZoomIn = () => setZoom((z) => Math.min(5, z + 1));
  const onZoomOut = () => setZoom((z) => Math.max(1, z - 1));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#7b83cf", // jaśniejsze tło niż okno
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
          {/* LEFT MINI SIDEBAR (ikonki) */}
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "center",
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
            <Button icon="pi pi-user" rounded text style={{ color: "white" }} />
            <Button icon="pi pi-images" rounded text style={{ color: "white" }} />
            <Button icon="pi pi-cog" rounded text style={{ color: "white" }} />
            <Divider style={{ width: "100%", opacity: 0.35 }} />
            <Button icon="pi pi-sign-out" rounded text style={{ color: "white" }} />
          </div>
                
          {/* MAP AREA */}
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
            {/* ZOOM CONTROLS */}
            <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 8, zIndex: 5 }}>
              <Button icon="pi pi-minus" onClick={onZoomOut} rounded />
              <Button icon="pi pi-plus" onClick={onZoomIn} rounded />
              <Tag value={`Zoom: ${zoom}`} severity="info" />
            </div>

            {/* MAP PLACEHOLDER (dzielnice) */}
            <div style={{ position: "relative", height: 480, borderRadius: 12 }}>
              <svg width="100%" height="100%" viewBox="0 0 800 480" style={{ borderRadius: 12, background: "rgba(255,255,255,0.08)" }}>
                {/* prosta "mapa" dzielnic: placeholder shapes */}
                <path d="M120 120 L260 90 L300 170 L210 230 L120 200 Z" fill="#d6f1ff" opacity="0.95" />
                <text x="170" y="160" fill="#1b1b1b" fontSize="16" fontWeight="700">JEŻYCE</text>

                <path d="M280 70 L420 70 L450 160 L330 190 Z" fill="#ffe4e9" opacity="0.95" />
                <text x="320" y="120" fill="#1b1b1b" fontSize="16" fontWeight="700">STARE MIASTO</text>

                <path d="M240 210 L360 200 L420 290 L290 340 L220 280 Z" fill="#fff2c9" opacity="0.95" />
                <text x="260" y="280" fill="#1b1b1b" fontSize="16" fontWeight="700">WILDA</text>

                <path d="M120 240 L210 220 L240 330 L140 360 L90 300 Z" fill="#e6ffe6" opacity="0.95" />
                <text x="120" y="300" fill="#1b1b1b" fontSize="16" fontWeight="700">GRUNWALD</text>

                <path d="M460 160 L720 150 L740 360 L520 410 L430 280 Z" fill="#e9edff" opacity="0.95" />
                <text x="560" y="260" fill="#1b1b1b" fontSize="16" fontWeight="700">NOWE MIASTO</text>
              </svg>

              {/* MARKERS / CLUSTERS overlay */}
              <MarkerLayer
                zoom={zoom}
                items={clustered}
                onClusterClick={() => onZoomIn()}
                onPointClick={(p) => setSelected(p)}
              />
            </div>

            {/* ADD NEW BUTTON bottom-right like mock */}
            <div style={{ position: "absolute", right: 18, bottom: 18 }}>
              <Button
                label="Add New"
                icon="pi pi-plus"
                iconPos="right"
                onClick={() => navigate("/artpieces/add")}
                style={{ borderRadius: 12, fontWeight: 700 }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* FULL SIDEBAR */}
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

      {/* DETAILS DIALOG */}
      <Dialog
        header={selected ? selected.title : "Details"}
        visible={!!selected}
        style={{ width: "min(520px, 92vw)" }}
        onHide={() => setSelected(null)}
      >
        {selected && (
          <div style={{ display: "grid", gap: 10 }}>
            <div><b>District:</b> {selected.district}</div>
            <div><b>Address:</b> {selected.address}</div>
            <div><b>Lat/Lng:</b> {selected.lat.toFixed(4)} / {selected.lng.toFixed(4)}</div>
            <small style={{ opacity: 0.8 }}>
              Docelowo tu pokażesz zdjęcia dzieła + opis, a marker będzie z backendu (geokodowany adres).
            </small>
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

  // marker area size — dopasowane do svg viewBox 800x480
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
