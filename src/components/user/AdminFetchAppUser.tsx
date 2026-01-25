import React, { useEffect, useRef, useState } from "react";

type AppUserAdminDto = {
  id: number;
  appUserName: string;
  appUserEmail: string;
};

type UpdateAppUserDto = {
  appUserName?: string;
  appUserEmail?: string;
  appUserPassword?: string;
  appUserLanguagesSpoken?: string[];
  appUserCity?: string;
  appUserLiveInDistrict?: string;
  appUserCommuteDtos?: any[];
};

const BASE = "http://localhost:8080";

export const AdminFetchUsers: React.FC = () => {
  const [users, setUsers] = useState<AppUserAdminDto[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<AppUserAdminDto | null>(null);
  const [editForm, setEditForm] = useState<UpdateAppUserDto>({
    appUserName: "",
    appUserEmail: "",
  });

  const fetchUsers = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const url = `${BASE}/getAll/appUsers`;

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

      const data = raw.trim() ? (JSON.parse(raw) as AppUserAdminDto[]) : [];
      setUsers(data);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.error("❌ Fetch users error:", e);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (u: AppUserAdminDto) => {
    setSelected(u);
    setEditForm({
      appUserName: u.appUserName ?? "",
      appUserEmail: u.appUserEmail ?? "",
    });
    setEditOpen(true);
  };

  const updateUser = async (appUserEmail: string, body: UpdateAppUserDto) => {
    const url = new URL(`${BASE}/updateAppUser/user`);
    url.searchParams.set("appUserEmail", appUserEmail);

    console.log("✏️ Updating:", url.toString(), body);

    const res = await fetch(url.toString(), {
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

    return raw.trim() ? (JSON.parse(raw) as AppUserAdminDto) : null;
  };

  const onSaveEdit = async () => {
    if (!selected) return;

    try {
      const updated = await updateUser(selected.appUserEmail, editForm);

      // jeśli backend zwróci pełnego usera (z id) -> podmień w state,
      // jeśli nie -> refetch
      if (updated?.id != null) {
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        await fetchUsers();
      }

      setEditOpen(false);
      setSelected(null);
    } catch (e) {
      console.error("❌ Update user error:", e);
      alert("Nie udało się zaktualizować usera.");
    }
  };

  useEffect(() => {
    fetchUsers();
    return () => abortRef.current?.abort();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>AdminFetch Users (GET + PUT)</h2>

      <button onClick={fetchUsers} disabled={loading}>
        {loading ? "Ładowanie..." : "Odśwież"}
      </button>

      <ul style={{ marginTop: 16 }}>
        {users.map((u) => (
          <li key={u.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>
              #{u.id} — {u.appUserName} ({u.appUserEmail})
            </span>

            <button onClick={() => openEdit(u)}>Edytuj</button>
          </li>
        ))}
      </ul>

      {editOpen && selected && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ccc", maxWidth: 420 }}>
          <h3>Edycja usera #{selected.id}</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label>
              Nazwa:
              <input
                value={editForm.appUserName ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, appUserName: e.target.value }))}
                style={{ width: "100%" }}
              />
            </label>

            <label>
              Email:
              <input
                value={editForm.appUserEmail ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, appUserEmail: e.target.value }))}
                style={{ width: "100%" }}
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

export default AdminFetchUsers;
