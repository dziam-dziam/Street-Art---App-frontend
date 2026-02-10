import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Chip } from "primereact/chip";
import { Carousel } from "primereact/carousel";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:8080";

type ArtPieceMapPointDto = {
  id: number;
  title: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
};

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

export const MyArtPiecesPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  const [items, setItems] = useState<ArtPieceMapPointDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [details, setDetails] = useState<ArtPieceDetailsDto | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const loadMy = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/my/artPieces`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const raw = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`GET /my/artPieces failed: ${res.status}. ${raw.slice(0, 200)}`);

      const data = raw.trim() ? (JSON.parse(raw) as ArtPieceMapPointDto[]) : [];
      setItems(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Fetch error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetails = useCallback(async (id: number) => {
    setLoadingDetails(true);
    setDetails(null);
    setDetailsError(null);

    try {
      const res = await fetch(`${BASE_URL}/map/artPieces/${id}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const raw = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`GET /map/artPieces/${id} failed: ${res.status}. ${raw.slice(0, 200)}`);

      setDetails(raw.trim() ? (JSON.parse(raw) as ArtPieceDetailsDto) : null);
    } catch (e: any) {
      setDetailsError(e?.message ?? "Details error");
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    void loadMy();
  }, [loadMy]);

  const selectedTitle = useMemo(() => {
    const it = items.find((x) => x.id === selectedId);
    return it?.title ?? "Details";
  }, [items, selectedId]);

  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      <Toast ref={toast} position="top-right" />

      <Card title="Moje dzieła">
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <Button label="Wróć" icon="pi pi-arrow-left" severity="secondary" onClick={() => navigate("/app")} />
          <Button label="Odśwież" icon="pi pi-refresh" onClick={() => void loadMy()} loading={loading} />
        </div>

        {error ? <div style={{ color: "#ffb3b3", fontWeight: 700 }}>{error}</div> : null}

        {loading ? <div>Loading...</div> : null}

        {!loading && items.length === 0 ? <div>(Brak dodanych artpieces)</div> : null}

        <div style={{ display: "grid", gap: 10 }}>
          {items.map((x) => (
            <div
              key={x.id}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: 12,
                display: "grid",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <b>{x.title}</b>
                  <div style={{ opacity: 0.85 }}>{x.address}</div>
                  <div style={{ opacity: 0.85 }}>District: {x.district}</div>
                </div>

                <Button
                  label="Otwórz"
                  icon="pi pi-external-link"
                  onClick={() => {
                    setSelectedId(x.id);
                    void loadDetails(x.id);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog
        header={details?.artPieceName ?? selectedTitle}
        visible={selectedId != null}
        style={{ width: "min(720px, 94vw)" }}
        onHide={() => {
          setSelectedId(null);
          setDetails(null);
          setDetailsError(null);
        }}
      >
        {loadingDetails ? <div>Loading...</div> : null}
        {detailsError ? <div style={{ color: "#ffb3b3", fontWeight: 700 }}>{detailsError}</div> : null}

        {details && (
          <div style={{ display: "grid", gap: 14 }}>
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
                    <div style={{ width: "100%", height: 360, borderRadius: 12, overflow: "hidden" }}>
                      <img src={src} alt={p.fileName ?? "photo"} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                  );
                }}
              />
            ) : (
              <div style={{ opacity: 0.85 }}>(no photos)</div>
            )}

            <div style={{ display: "grid", gap: 6 }}>
              <div><b>Name:</b> {details.artPieceName}</div>
              <div><b>Address:</b> {details.artPieceAddress}</div>
              <div><b>District:</b> {details.districtName ?? "-"}</div>
              <div><b>City:</b> {details.cityName ?? "Poznań"}</div>
              <div><b>Position:</b> {details.artPiecePosition || "-"}</div>
              <div><b>Contains text:</b> {details.artPieceContainsText ? "Yes" : "No"}</div>
            </div>

            <div>
              <b>Types:</b>{" "}
              {details.artPieceTypes?.length ? (
                <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                  {details.artPieceTypes.map((t) => <Chip key={t} label={t} />)}
                </span>
              ) : (
                <span> -</span>
              )}
            </div>

            <div>
              <b>Styles:</b>{" "}
              {details.artPieceStyles?.length ? (
                <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                  {details.artPieceStyles.map((s) => <Chip key={s} label={s} />)}
                </span>
              ) : (
                <span> -</span>
              )}
            </div>

            <div>
              <b>Text languages:</b>{" "}
              {details.artPieceContainsText && details.artPieceTextLanguages?.length ? (
                <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
                  {details.artPieceTextLanguages.map((l) => <Chip key={l} label={l} />)}
                </span>
              ) : (
                <span> -</span>
              )}
            </div>

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