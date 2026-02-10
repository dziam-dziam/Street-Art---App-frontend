import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../../styles/pages.module.css";

import { Carousel } from "primereact/carousel";
import { Chip } from "primereact/chip";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "primereact/sidebar";
import { Dropdown } from "primereact/dropdown";
import { Divider } from "primereact/divider";

import { DISTRICT_OPTIONS } from "../constants/Options";
import type { DistrictName } from "../constants/Options";

import poz from "../assets/poznan.json";
import type { ArtPieceMapPointDto } from "../dto/artpiece/ArtPieceMapPointDto";

// ✅ widgety mapy
import { MapWidget, FloatingActions, UserSidebar } from "../../widgets/map/MapWidgets";
import type { ArtPoint } from "../../widgets/map/MapWidgets";

type PhotoResponseDto = {
  id?: number;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
  downloadUrl?: string;
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

  photos: PhotoResponseDto[];
};

const BASE_URL = "http://localhost:8080";

function normalizeDistrict(d: string): DistrictName {
  const x = (d ?? "").trim().toLowerCase();

  if (x === "jeżyce" || x === "jezyce") return "Jeżyce";
  if (x === "stare miasto" || x === "staremiasto") return "Stare Miasto";
  if (x === "grunwald") return "Grunwald";
  if (x === "wilda") return "Wilda";
  if (x === "łazarz") return "Łazarz";
  return "Jeżyce";
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
  const [userName, setUserName] = useState<string>("Użytkownik");
  const [userEmail, setUserEmail] = useState<string>("user@email.com");


  const [details, setDetails] = useState<ArtPieceDetailsDto | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [filtersVisible, setFiltersVisible] = useState(false);

  // ✅ tylko district
  const [filterDistrict, setFilterDistrict] = useState<DistrictName | null>(null);

  const loadDetails = useCallback(async (id: string) => {
    setLoadingDetails(true);
    setDetailsError(null);
    setDetails(null);

    try {
      const res = await fetch(`${BASE_URL}/map/artPieces/${id}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`GET /map/artPieces/${id} failed: ${res.status}. ${body}`);
      }

      const dto = (await res.json()) as ArtPieceDetailsDto;
      setDetails(dto);
    } catch (e: any) {
      setDetailsError(e?.message ?? "Unknown error");
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const [points, setPoints] = useState<ArtPoint[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [pointsError, setPointsError] = useState<string | null>(null);

  const loadPoints = useCallback(async () => {
    setLoadingPoints(true);
    setPointsError(null);

    try {
      const params = new URLSearchParams();

      // ✅ tylko district jako query param
      if (filterDistrict) params.set("district", filterDistrict);

      const url = `${BASE_URL}/map/artPieces${params.toString() ? `?${params.toString()}` : ""}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`GET ${url} failed: ${res.status}. ${body}`);
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

      setPoints(mapped);
    } catch (e: any) {
      setPointsError(e?.message ?? "Unknown error");
    } finally {
      setLoadingPoints(false);
    }
  }, [filterDistrict]);

  useEffect(() => {
    void loadPoints();
  }, [loadPoints]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) return;

        const data = await res.json().catch(() => null);
        const roles: string[] = data?.roles ?? [];
        const adminFlag = roles.includes("ROLE_ADMIN");

        if (!cancelled) setIsAdmin(adminFlag);
      } catch (err) {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const pozBoundary = useMemo(() => pickPoznanBoundary(poz as any), []);

  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [selected, setSelected] = useState<ArtPoint | null>(null);

  const onLogout = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/logout`, {
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

  const menuItems = useMemo(
    () => [
      { label: "Mój profil", icon: "pi pi-user" },
      { label: "Moje dzieła", icon: "pi pi-images" },
      { label: "Ustawienia", icon: "pi pi-cog" },
      { separator: true },
      { label: "Wyloguj", icon: "pi pi-sign-out", command: onLogout },
    ],
    [onLogout]
  );

  return (
    <div className={styles.pageCenter}>
      <Toast ref={toast} position="center" />

      <Card title="App View" className={styles.appCardWide}>
        {pointsError ? (
          <div style={{ marginBottom: 10, color: "#ffd1d1", fontWeight: 700 }}>
            Error: {pointsError}
          </div>
        ) : null}

        <div className={styles.appLayout}>
          <div className={styles.iconRail}>
            <Button icon="pi pi-bars" rounded text aria-label="menu" onClick={() => setSidebarVisible(true)} style={{ color: "white" }} />
            <Button icon="pi pi-filter" rounded text aria-label="filters" onClick={() => setFiltersVisible(true)} style={{ color: "white" }} />
          </div>

          <div className={styles.mapShell}>
            <MapWidget
              boundary={pozBoundary as any}
              points={points}
              loading={loadingPoints}
              onPickPoint={(p) => {
                setSelected(p);
                void loadDetails(p.id);
              }}
            />

            <FloatingActions isAdmin={isAdmin} onGoAdmin={() => navigate("/admin")} onAddNew={() => navigate("/artpieces/add")} />
          </div>
        </div>
      </Card>

      <UserSidebar
        visible={sidebarVisible}
        onHide={() => setSidebarVisible(false)}
        menuModel={menuItems}
        userName="Użytkownik"
        userEmail="user@email.com"
      />

      {/* ✅ tylko district */}
      <Sidebar
        visible={filtersVisible}
        position="right"
        onHide={() => setFiltersVisible(false)}
        style={{ width: "min(360px, 92vw)" }}
      >
        <h3 style={{ marginTop: 0 }}>Filtry 🧩</h3>
        <Divider />

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={{ marginBottom: 6 }}>District</div>
            <Dropdown
              value={filterDistrict}
              options={[...DISTRICT_OPTIONS]}
              optionLabel="label"
              optionValue="value"
              placeholder="Any"
              showClear
              onChange={(e) => setFilterDistrict(e.value ?? null)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Button
              label="Apply"
              icon="pi pi-check"
              onClick={() => {
                void loadPoints();
                setFiltersVisible(false);
              }}
            />
            <Button
              label="Reset"
              icon="pi pi-refresh"
              outlined
              onClick={() => {
                setFilterDistrict(null);
                setTimeout(() => void loadPoints(), 0);
              }}
            />
          </div>
        </div>
      </Sidebar>

      <Dialog
        header={details?.artPieceName ?? selected?.title ?? "Details"}
        visible={!!selected}
        style={{ width: "min(720px, 94vw)" }}
        onHide={() => {
          setSelected(null);
          setDetails(null);
          setDetailsError(null);
        }}
      >
        {loadingDetails ? <div>Loading...</div> : null}
        {detailsError ? <div style={{ color: "#ffd1d1", fontWeight: 700 }}>Error: {detailsError}</div> : null}

        {details && (
          <div style={{ display: "grid", gap: 14 }}>
            {/* Photos carousel */}
            {details.photos?.length ? (
              <Carousel
                value={details.photos}
                numVisible={1}
                numScroll={1}
                circular
                showIndicators={details.photos.length > 1}
                showNavigators={details.photos.length > 1}
                itemTemplate={(p) => {
                  const src = p.downloadUrl?.startsWith("http") ? p.downloadUrl : `${BASE_URL}${p.downloadUrl ?? ""}`;

                  return (
                    <div
                      style={{
                        width: "100%",
                        height: 360,
                        borderRadius: 12,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <img
                        src={src}
                        alt={p.fileName ?? "photo"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    </div>
                  );
                }}
              />
            ) : (
              <div style={{ opacity: 0.85 }}>(no photos)</div>
            )}

            {/* Main info */}
            <div className={styles.detailsGrid}>
              <div>
                <b>Name:</b> {details.artPieceName}
              </div>
              <div>
                <b>Address:</b> {details.artPieceAddress}
              </div>
              <div>
                <b>District:</b> {details.districtName ?? selected?.district}
              </div>
              <div>
                <b>City:</b> {details.cityName ?? "Poznań"}
              </div>
              <div>
                <b>Position:</b> {details.artPiecePosition || "-"}
              </div>
              <div>
                <b>Contains text:</b> {details.artPieceContainsText ? "Yes" : "No"}
              </div>
            </div>

            {/* Types */}
            <div>
              <b>Types:</b>{" "}
              {details.artPieceTypes?.length ? (
                <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                  {details.artPieceTypes.map((t) => (
                    <Chip key={t} label={t} />
                  ))}
                </span>
              ) : (
                <span> -</span>
              )}
            </div>

            {/* Styles */}
            <div>
              <b>Styles:</b>{" "}
              {details.artPieceStyles?.length ? (
                <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                  {details.artPieceStyles.map((s) => (
                    <Chip key={s} label={s} />
                  ))}
                </span>
              ) : (
                <span> -</span>
              )}
            </div>

            {/* Text languages */}
            <div>
              <b>Text languages:</b>{" "}
              {details.artPieceContainsText && details.artPieceTextLanguages?.length ? (
                <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                  {details.artPieceTextLanguages.map((l) => (
                    <Chip key={l} label={l} />
                  ))}
                </span>
              ) : (
                <span> -</span>
              )}
            </div>

            {/* Description */}
            <div>
              <b>Description:</b>
              <div style={{ marginTop: 6, opacity: 0.95 }}>{details.artPieceUserDescription || "-"}</div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};