import React, { useEffect, useRef, useState } from "react";

type ArtPieceAdminDto = {
  id: number;
  artPieceAddress: string;
  artPieceName: string;
  artPieceUserDescription: string;
};

type UpdateArtPieceDto = {
  artPieceAddress?: string;
  artPieceName?: string;
  artPieceContainsText?: boolean;
  artPiecePosition?: string;
  artPieceUserDescription?: string;
  artPieceDistrict?: string;
  artPieceCity?: string;
  artPieceTypes?: string[];
  artPieceStyles?: string[];
  artPieceTextLanguages?: string[];
};

const BASE = "http://localhost:8080";

export const AdminFetchArtPieces: React.FC = () => {
  const [items, setItems] = useState<ArtPieceAdminDto[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<ArtPieceAdminDto | null>(null);

  // Edytujemy tylko to, co pokazujesz w AdminDto (name/address/desc)
  // Resztę pól zostawiamy undefined -> backend ich nie powinien nadpisywać,
  // jeśli u Ciebie update działa "partial update".
  const [editForm, setEditForm] = useState<UpdateArtPieceDto>({
    artPieceAddress: "",
    artPieceName: "",
    artPieceUserDescription: "",
  });

  const fetchArtPieces = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const url = `${BASE}/getAll/artPieces`;

    try {
      setLoading(true);
      console.log("➡️ Fetching:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        // credentials: "include",
        signal: controller.signal,
      });

      const raw = await res.text();
      console.log("STATUS:", res.status);
      console.log("RAW:", raw);

      if (!res.ok) throw new Error(`HTTP ${res.status}. Body: ${raw.slice(0, 200)}`);

      const data = raw.trim() ? (JSON.parse(raw) as ArtPieceAdminDto[]) : [];
      setItems(data);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.error("❌ Fetch artpieces error:", e);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (ap: ArtPieceAdminDto) => {
    setSelected(ap);
    setEditForm({
      artPieceAddress: ap.artPieceAddress ?? "",
      artPieceName: ap.artPieceName ?? "",
      artPieceUserDescription: ap.artPieceUserDescription ?? "",
    });
    setEditOpen(true);
  };

  const updateArtPiece = async (id: number, body: UpdateArtPieceDto) => {
    const url = `${BASE}/updateArtPiece/artPiece/${id}`;

    console.log("✏️ Updating:", url, body);

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        Accept: "application/json",
      },
      // credentials: "include",
      body: JSON.stringify(body),
    });

    const raw = await res.text().catch(() => "");
    console.log("PUT STATUS:", res.status);
    console.log("PUT RAW:", raw);

    if (!res.ok) throw new Error(`PUT failed. HTTP ${res.status}. Body: ${raw.slice(0, 200)}`);

    // PUT zwraca ArtPieceDto (bez id) -> najbezpieczniej odświeżyć listę
    return raw.trim() ? JSON.parse(raw) : null;
  };

  const onSaveEdit = async () => {
    if (!selected) return;

    try {
      await updateArtPiece(selected.id, editForm);

      // bo PUT nie zwraca id -> refetch
      await fetchArtPieces();

      setEditOpen(false);
      setSelected(null);
    } catch (e) {
      console.error("❌ Update artpiece error:", e);
      alert("Nie udało się zaktualizować artpiece.");
    }
  };

  useEffect(() => {
    fetchArtPieces();
    return () => abortRef.current?.abort();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>AdminFetch ArtPieces (GET + PUT)</h2>

      <button onClick={fetchArtPieces} disabled={loading}>
        {loading ? "Ładowanie..." : "Odśwież"}
      </button>

      <ul style={{ marginTop: 16 }}>
        {items.map((ap) => (
          <li key={ap.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>
              #{ap.id} — {ap.artPieceName} | {ap.artPieceAddress}
            </span>

            <button onClick={() => openEdit(ap)}>Edytuj</button>
          </li>
        ))}
      </ul>

      {editOpen && selected && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ccc", maxWidth: 520 }}>
          <h3>Edycja artpiece #{selected.id}</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label>
              Nazwa:
              <input
                value={editForm.artPieceName ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, artPieceName: e.target.value }))}
                style={{ width: "100%" }}
              />
            </label>

            <label>
              Adres:
              <input
                value={editForm.artPieceAddress ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, artPieceAddress: e.target.value }))}
                style={{ width: "100%" }}
              />
            </label>

            <label>
              Opis:
              <textarea
                value={editForm.artPieceUserDescription ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, artPieceUserDescription: e.target.value }))}
                style={{ width: "100%", minHeight: 90 }}
              />
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onSaveEdit}>Zapisz</button>
              <button
                onClick={() => {
                  setEditOpen(false);
                  setSelected(null);
                }}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFetchArtPieces;
