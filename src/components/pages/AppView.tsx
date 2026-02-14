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
import { useTranslation } from "react-i18next";

import { DISTRICT_OPTIONS } from "../constants/Options";
import type { DistrictName } from "../constants/Options";

import poz from "../assets/poznan.json";
import type { ArtPieceMapPointDto } from "../dto/artpiece/ArtPieceMapPointDto";

// ✅ widgety mapy
import { MapWidget, FloatingActions, UserSidebar } from "../../widgets/map/MapWidgets";
import type { ArtPoint } from "../../widgets/map/MapWidgets";

import { LanguageSwitch } from "../../widgets/LanguageSwitch";

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
  const { t } = useTranslation();

  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string>("Użytkownik");
  const [userEmail, setUserEmail] = useState<string>("user@email.com");
  const [userLanguages, setUserLanguages] = useState<string[]>([]);

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
          title: d.title ?? t("appView.noTitle"),
          address: d.address ?? "",
          district: normalizeDistrict(d.district),
          lat: d.lat,
          lng: d.lng,
        }));

      setPoints(mapped);
    } catch (e: any) {
      setPointsError(e?.message ?? t("common.unknownError"));
    } finally {
      setLoadingPoints(false);
    }
  }, [filterDistrict, t]);

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
        const langsFromApi: string[] = Array.isArray(data?.languagesSpoken)
          ? data.languagesSpoken.map(String)
          : [];
        const roles: string[] = data?.roles ?? [];
        const adminFlag = roles.includes("ROLE_ADMIN");

        const nameFromApi = data?.name ?? data?.username ?? data?.fullName ?? t("appView.user");
        const emailFromApi = data?.email ?? data?.userEmail ?? "user@email.com";

        if (!cancelled) {
          setIsAdmin(adminFlag);
          setUserName(nameFromApi);
          setUserEmail(emailFromApi);
          setUserLanguages(langsFromApi);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [t]);

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
        alert(`${t("appView.logoutFailed")}: ${res.status} ${body}`);
        return;
      }

      setSidebarVisible(false);
      navigate("/login", { replace: true });
    } catch (e) {
      console.error(e);
      alert(t("appView.logoutError"));
    }
  }, [navigate, t]);

  const menuItems = useMemo(
    () => [
      { label: t("appView.myProfile"), icon: "pi pi-user", command: () => navigate("/profile") },
      { label: t("appView.myArtpieces"), icon: "pi pi-images", command: () => navigate("/my-artpieces") },
      { separator: true },
      { label: t("appView.logout"), icon: "pi pi-sign-out", command: onLogout },
    ],
    [onLogout, navigate, t]
  );

  return (
    <div className={styles.pageCenter}>
      <Toast ref={toast} position="center" />

      {/* przełącznik w prawym górnym rogu strony */}
      <LanguageSwitch />

      <Card title={t("appView.title")} className={styles.appCardWide}>
        {pointsError ? (
          <div style={{ marginBottom: 10, color: "#ffd1d1", fontWeight: 700 }}>
            {t("common.error")}: {pointsError}
          </div>
        ) : null}

        <div className={styles.appLayout}>
          <div className={styles.iconRail}>
            <Button
              icon="pi pi-bars"
              rounded
              text
              aria-label={t("appView.menu")}
              onClick={() => setSidebarVisible(true)}
              style={{ color: "white" }}
            />
            <Button
              icon="pi pi-filter"
              rounded
              text
              aria-label={t("appView.filters")}
              onClick={() => setFiltersVisible(true)}
              style={{ color: "white" }}
            />
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

            <FloatingActions
              isAdmin={isAdmin}
              onGoAdmin={() => navigate("/admin")}
              onAddNew={() => navigate("/artpieces/add")}
            />
          </div>
        </div>
      </Card>

      <UserSidebar
        visible={sidebarVisible}
        onHide={() => setSidebarVisible(false)}
        menuModel={menuItems}
        userName={userName}
        userEmail={userEmail}
      />

      {/* ✅ tylko district */}
      <Sidebar
        visible={filtersVisible}
        position="right"
        onHide={() => setFiltersVisible(false)}
        style={{ width: "min(360px, 92vw)" }}
      >
        <h3 style={{ marginTop: 0 }}>{t("appView.filtersTitle")}</h3>
        <Divider />

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={{ marginBottom: 6 }}>{t("appView.district")}</div>
            <Dropdown
              value={filterDistrict}
              options={[...DISTRICT_OPTIONS]}
              optionLabel="label"
              optionValue="value"
              placeholder={t("appView.any")}
              showClear
              onChange={(e) => setFilterDistrict(e.value ?? null)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Button
              label={t("appView.apply")}
              icon="pi pi-check"
              onClick={() => {
                void loadPoints();
                setFiltersVisible(false);
              }}
            />
            <Button
              label={t("appView.reset")}
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
        header={details?.artPieceName ?? selected?.title ?? t("appView.details")}
        visible={!!selected}
        style={{ width: "min(720px, 94vw)" }}
        onHide={() => {
          setSelected(null);
          setDetails(null);
          setDetailsError(null);
        }}
      >
        {loadingDetails ? <div>{t("common.loading")}</div> : null}
        {detailsError ? <div style={{ color: "#ffd1d1", fontWeight: 700 }}>{t("common.error")}: {detailsError}</div> : null}

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
              <div style={{ opacity: 0.85 }}>{t("appView.noPhotos")}</div>
            )}

            {/* Main info */}
            <div className={styles.detailsGrid}>
              <div>
                <b>{t("appView.name")}:</b> {details.artPieceName}
              </div>
              <div>
                <b>{t("appView.address")}:</b> {details.artPieceAddress}
              </div>
              <div>
                <b>{t("appView.district")}:</b> {details.districtName ?? selected?.district}
              </div>
              <div>
                <b>{t("appView.city")}:</b> {details.cityName ?? "Poznań"}
              </div>
              <div>
                <b>{t("appView.position")}:</b> {details.artPiecePosition || "-"}
              </div>
              <div>
                <b>{t("appView.containsText")}:</b> {details.artPieceContainsText ? t("common.yes") : t("common.no")}
              </div>
            </div>

            {/* Types */}
            <div>
              <b>{t("appView.types")}:</b>{" "}
              {details.artPieceTypes?.length ? (
                <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                  {details.artPieceTypes.map((x) => (
                    <Chip key={x} label={x} />
                  ))}
                </span>
              ) : (
                <span> -</span>
              )}
            </div>

            {/* Styles */}
            <div>
              <b>{t("appView.styles")}:</b>{" "}
              {details.artPieceStyles?.length ? (
                <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                  {details.artPieceStyles.map((x) => (
                    <Chip key={x} label={x} />
                  ))}
                </span>
              ) : (
                <span> -</span>
              )}
            </div>

            {/* Text languages */}
            <div>
              <b>{t("appView.textLanguages")}:</b>{" "}
              {details.artPieceContainsText && details.artPieceTextLanguages?.length ? (
                <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                  {details.artPieceTextLanguages.map((x) => (
                    <Chip key={x} label={x} />
                  ))}
                </span>
              ) : (
                <span> -</span>
              )}
            </div>

            {/* Description */}
            <div>
              <b>{t("appView.description")}:</b>
              <div style={{ marginTop: 6, opacity: 0.95 }}>{details.artPieceUserDescription || "-"}</div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};