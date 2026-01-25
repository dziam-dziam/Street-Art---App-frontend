import React, { useEffect, useRef, useState } from "react";

const BASE = "http://localhost:8080";

// ========= DTOs =========
type CityAdminDto = { id: number; cityName: string; cityResidentsCount: number };
type UpdateCityDto = { cityName: string; cityResidentsCount: number };

type DistrictAdminDto = {
  id: number;
  districtName: string;
  districtCityName: string;
  districtZipCode?: string;
  districtResidentsCount?: number;
};

type UpdateDistrictDto = {
  districtZipCode: string;
  districtName: string;
  districtCity: string;
  districtResidentsCount: number;
};

type AppUserAdminDto = { id: number; appUserName: string; appUserEmail: string };
type UpdateAppUserDto = {
  appUserName?: string;
  appUserEmail?: string;
  appUserPassword?: string;
  appUserLanguagesSpoken?: string[];
  appUserCity?: string;
  appUserLiveInDistrict?: string;
  appUserCommuteDtos?: any[];
};

type ArtPieceAdminDto = {
  id: number;
  artPieceAddress: string;
  artPieceName: string;
  artPieceUserDescription: string;
};

type UpdateArtPieceDto = {
  artPieceAddress?: string;
  artPieceName?: string;
  artPieceUserDescription?: string;
  // (reszta pól opcjonalnie jeśli chcesz później rozszerzyć)
};

// ========= helpers =========
const safeJson = <T,>(raw: string, fallback: T): T => {
  try {
    return raw.trim() ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const csvToStringArray = (csv: string): string[] =>
  csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

async function fetchTry<T>(urls: string[], signal?: AbortSignal): Promise<T> {
  let lastErr: any = null;

  for (const url of urls) {
    try {
      console.log("➡️ GET try:", url);
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
        // credentials: "include",
      });

      const raw = await res.text().catch(() => "");
      console.log("GET STATUS:", res.status, "URL:", url);
      if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}. Body: ${raw.slice(0, 200)}`);

      return safeJson<T>(raw, ([] as unknown) as T);
    } catch (e) {
      lastErr = e;
      console.warn("GET failed for", url, e);
    }
  }

  throw lastErr ?? new Error("GET failed (no urls)");
}

async function putJson<T>(url: string, body: any): Promise<T | null> {
  console.log("✏️ PUT:", url, body);

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    // credentials: "include",
  });

  const raw = await res.text().catch(() => "");
  console.log("PUT STATUS:", res.status);
  console.log("PUT RAW:", raw);

  if (!res.ok) throw new Error(`PUT failed. HTTP ${res.status}. Body: ${raw.slice(0, 200)}`);
  return raw.trim() ? (JSON.parse(raw) as T) : null;
}

async function deleteWithFallback(urls: string[]) {
  let lastErr: any = null;

  for (const url of urls) {
    try {
      console.log("🗑️ DELETE try:", url);
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Accept: "application/json" },
        // credentials: "include",
      });

      const raw = await res.text().catch(() => "");
      console.log("DELETE STATUS:", res.status, "URL:", url);
      console.log("DELETE RAW:", raw);

      if (!res.ok) throw new Error(`DELETE ${url} -> HTTP ${res.status}. Body: ${raw.slice(0, 200)}`);
      return; // sukces
    } catch (e) {
      lastErr = e;
      console.warn("DELETE failed for", url, e);
    }
  }

  throw lastErr ?? new Error("DELETE failed (no urls)");
}

// ========= Component =========
export const AllFetches: React.FC = () => {
  const abortRef = useRef<AbortController | null>(null);

  // ---- Cities ----
  const [cities, setCities] = useState<CityAdminDto[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityEditOpen, setCityEditOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityAdminDto | null>(null);
  const [cityForm, setCityForm] = useState<UpdateCityDto>({ cityName: "", cityResidentsCount: 0 });

  // ---- Districts ----
  const [districts, setDistricts] = useState<DistrictAdminDto[]>([]);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [districtEditOpen, setDistrictEditOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictAdminDto | null>(null);
  const [districtForm, setDistrictForm] = useState<UpdateDistrictDto>({
    districtZipCode: "",
    districtName: "",
    districtCity: "",
    districtResidentsCount: 0,
  });

  // ---- Users ----
  const [users, setUsers] = useState<AppUserAdminDto[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userEditOpen, setUserEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUserAdminDto | null>(null);
  const [targetUserEmail, setTargetUserEmail] = useState("");
  const [userForm, setUserForm] = useState<UpdateAppUserDto>({ appUserName: "", appUserEmail: "" });
  const [userLangsCsv, setUserLangsCsv] = useState("");

  // ---- ArtPieces ----
  const [artPieces, setArtPieces] = useState<ArtPieceAdminDto[]>([]);
  const [apLoading, setApLoading] = useState(false);
  const [apEditOpen, setApEditOpen] = useState(false);
  const [selectedAp, setSelectedAp] = useState<ArtPieceAdminDto | null>(null);
  const [apForm, setApForm] = useState<UpdateArtPieceDto>({ artPieceName: "", artPieceAddress: "", artPieceUserDescription: "" });

  // ========= FETCHES =========
  const fetchCities = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setCityLoading(true);
      const data = await fetchTry<CityAdminDto[]>(
        [
          `${BASE}/admin/getAll/cities`, // działało w Twoim City teście
          `${BASE}/getAll/cities`,       // fallback
        ],
        controller.signal
      );
      setCities(data);
    } finally {
      setCityLoading(false);
    }
  };

  const fetchDistricts = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setDistrictLoading(true);
      const data = await fetchTry<DistrictAdminDto[]>(
        [
          `${BASE}/admin/getAll/districts`,
          `${BASE}/getAll/districts`,
        ],
        controller.signal
      );
      setDistricts(data);
    } finally {
      setDistrictLoading(false);
    }
  };

  const fetchUsers = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setUserLoading(true);
      const data = await fetchTry<AppUserAdminDto[]>(
        [
          `${BASE}/getAll/appUsers`,
          `${BASE}/admin/getAll/appUsers`,
        ],
        controller.signal
      );
      setUsers(data);
    } finally {
      setUserLoading(false);
    }
  };

  const fetchArtPieces = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setApLoading(true);
      const data = await fetchTry<ArtPieceAdminDto[]>(
        [
          `${BASE}/getAll/artPieces`,
          `${BASE}/admin/getAll/artPieces`,
        ],
        controller.signal
      );
      setArtPieces(data);
    } finally {
      setApLoading(false);
    }
  };

  // ========= CITIES: PUT / DELETE =========
  const openEditCity = (c: CityAdminDto) => {
    setSelectedCity(c);
    setCityForm({ cityName: c.cityName, cityResidentsCount: c.cityResidentsCount });
    setCityEditOpen(true);
  };

  const saveCity = async () => {
    if (!selectedCity) return;

    const url = `${BASE}/updateAdminCity/city/${selectedCity.id}`;
    const updated = await putJson<CityAdminDto>(url, cityForm);

    if (updated?.id != null) {
      setCities((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } else {
      await fetchCities();
    }

    setCityEditOpen(false);
    setSelectedCity(null);
  };

  const deleteCity = async (id: number) => {
    // 🔥 tu jest "naprawa": próbujemy kilka możliwych endpointów
    // bo u Ciebie ewidentnie DELETE nie idzie tam gdzie PUT.
    const candidates = [
      `${BASE}/remove/cities/${id}`, // to miałeś
      `${BASE}/remove/city/${id}`,   // częsty wariant
      `${BASE}/remove/adminCity/${id}`, // awaryjnie (jeśli masz taki)
    ];

    await deleteWithFallback(candidates);
    setCities((prev) => prev.filter((c) => c.id !== id));
  };

  // ========= DISTRICTS: PUT / DELETE =========
  const openEditDistrict = (d: DistrictAdminDto) => {
    setSelectedDistrict(d);
    setDistrictForm({
      districtName: d.districtName ?? "",
      districtCity: d.districtCityName ?? "",
      districtZipCode: d.districtZipCode ?? "",
      districtResidentsCount: d.districtResidentsCount ?? 0,
    });
    setDistrictEditOpen(true);
  };

  const saveDistrict = async () => {
    if (!selectedDistrict) return;

    const url = `${BASE}/updateAdminDistrict/district/${selectedDistrict.id}`;
    await putJson<any>(url, districtForm);

    // District PUT zwykle zwraca DTO różne niż w liście -> safest refetch
    await fetchDistricts();

    setDistrictEditOpen(false);
    setSelectedDistrict(null);
  };

  const deleteDistrict = async (id: number) => {
    const candidates = [
      `${BASE}/remove/district/${id}`,
      `${BASE}/remove/districts/${id}`, // fallback
    ];

    await deleteWithFallback(candidates);
    setDistricts((prev) => prev.filter((d) => d.id !== id));
  };

  // ========= USERS: PUT =========
  const openEditUser = (u: AppUserAdminDto) => {
    setSelectedUser(u);
    setTargetUserEmail(u.appUserEmail); // ważne: identyfikujemy po STARYM emailu
    setUserForm({ appUserName: u.appUserName ?? "", appUserEmail: u.appUserEmail ?? "" });
    setUserLangsCsv("");
    setUserEditOpen(true);
  };

  const saveUser = async () => {
    if (!selectedUser) return;

    const url = new URL(`${BASE}/updateAppUser/user`);
    url.searchParams.set("appUserEmail", targetUserEmail);

    const body: UpdateAppUserDto = {
      ...(userForm.appUserName?.trim() ? { appUserName: userForm.appUserName.trim() } : {}),
      ...(userForm.appUserEmail?.trim() ? { appUserEmail: userForm.appUserEmail.trim() } : {}),
      ...(userLangsCsv.trim() ? { appUserLanguagesSpoken: csvToStringArray(userLangsCsv) } : {}),
      ...(userForm.appUserPassword?.trim() ? { appUserPassword: userForm.appUserPassword } : {}),
      ...(userForm.appUserCity?.trim() ? { appUserCity: userForm.appUserCity.trim() } : {}),
      ...(userForm.appUserLiveInDistrict?.trim() ? { appUserLiveInDistrict: userForm.appUserLiveInDistrict.trim() } : {}),
    };

    await putJson<any>(url.toString(), body);

    // najszybciej: odśwież listę z backendu
    await fetchUsers();

    setUserEditOpen(false);
    setSelectedUser(null);
  };

  // ========= ARTPIECES: PUT =========
  const openEditAp = (ap: ArtPieceAdminDto) => {
    setSelectedAp(ap);
    setApForm({
      artPieceName: ap.artPieceName ?? "",
      artPieceAddress: ap.artPieceAddress ?? "",
      artPieceUserDescription: ap.artPieceUserDescription ?? "",
    });
    setApEditOpen(true);
  };

  const saveAp = async () => {
    if (!selectedAp) return;

    const url = `${BASE}/updateArtPiece/artPiece/${selectedAp.id}`;
    await putJson<any>(url, apForm);

    await fetchArtPieces();

    setApEditOpen(false);
    setSelectedAp(null);
  };

  // ========= initial load =========
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([fetchCities(), fetchDistricts(), fetchUsers(), fetchArtPieces()]);
      } catch (e) {
        console.error("❌ Initial load error:", e);
      }
    })();

    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========= UI =========
  return (
    <div style={{ padding: 20, display: "grid", gap: 24 }}>
      <h2>AllFetches (Cities + Districts + Users + ArtPieces)</h2>

      {/* ===== CITIES ===== */}
      <section style={{ border: "1px solid #ddd", padding: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Cities</h3>
          <button onClick={fetchCities} disabled={cityLoading}>{cityLoading ? "Loading..." : "Refresh"}</button>
        </div>

        <ul style={{ marginTop: 12 }}>
          {cities.map((c) => (
            <li key={c.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span>#{c.id} — {c.cityName} ({c.cityResidentsCount})</span>
              <button onClick={() => openEditCity(c)}>Edit</button>
              <button onClick={() => deleteCity(c.id)}>Delete</button>
            </li>
          ))}
        </ul>

        {cityEditOpen && selectedCity && (
          <div style={{ marginTop: 12, padding: 12, border: "1px solid #ccc", maxWidth: 420 }}>
            <b>Edit City #{selectedCity.id}</b>
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              <label>
                Name:
                <input
                  value={cityForm.cityName}
                  onChange={(e) => setCityForm((p) => ({ ...p, cityName: e.target.value }))}
                  style={{ width: "100%" }}
                />
              </label>

              <label>
                Residents:
                <input
                  type="number"
                  value={cityForm.cityResidentsCount}
                  onChange={(e) => setCityForm((p) => ({ ...p, cityResidentsCount: Number(e.target.value) }))}
                  style={{ width: "100%" }}
                />
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveCity}>Save</button>
                <button onClick={() => { setCityEditOpen(false); setSelectedCity(null); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===== DISTRICTS ===== */}
      <section style={{ border: "1px solid #ddd", padding: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Districts</h3>
          <button onClick={fetchDistricts} disabled={districtLoading}>{districtLoading ? "Loading..." : "Refresh"}</button>
        </div>

        <ul style={{ marginTop: 12 }}>
          {districts.map((d) => (
            <li key={d.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span>#{d.id} — {d.districtName} | {d.districtCityName}</span>
              <button onClick={() => openEditDistrict(d)}>Edit</button>
              <button onClick={() => deleteDistrict(d.id)}>Delete</button>
            </li>
          ))}
        </ul>

        {districtEditOpen && selectedDistrict && (
          <div style={{ marginTop: 12, padding: 12, border: "1px solid #ccc", maxWidth: 520 }}>
            <b>Edit District #{selectedDistrict.id}</b>
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              <label>
                districtName:
                <input value={districtForm.districtName} onChange={(e) => setDistrictForm((p) => ({ ...p, districtName: e.target.value }))} style={{ width: "100%" }} />
              </label>

              <label>
                districtCity:
                <input value={districtForm.districtCity} onChange={(e) => setDistrictForm((p) => ({ ...p, districtCity: e.target.value }))} style={{ width: "100%" }} />
              </label>

              <label>
                districtZipCode:
                <input value={districtForm.districtZipCode} onChange={(e) => setDistrictForm((p) => ({ ...p, districtZipCode: e.target.value }))} style={{ width: "100%" }} />
              </label>

              <label>
                districtResidentsCount:
                <input
                  type="number"
                  value={districtForm.districtResidentsCount}
                  onChange={(e) => setDistrictForm((p) => ({ ...p, districtResidentsCount: Number(e.target.value) }))}
                  style={{ width: "100%" }}
                />
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveDistrict}>Save</button>
                <button onClick={() => { setDistrictEditOpen(false); setSelectedDistrict(null); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===== USERS ===== */}
      <section style={{ border: "1px solid #ddd", padding: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Users</h3>
          <button onClick={fetchUsers} disabled={userLoading}>{userLoading ? "Loading..." : "Refresh"}</button>
        </div>

        <ul style={{ marginTop: 12 }}>
          {users.map((u) => (
            <li key={u.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span>#{u.id} — {u.appUserName} ({u.appUserEmail})</span>
              <button onClick={() => openEditUser(u)}>Edit</button>
            </li>
          ))}
        </ul>

        {userEditOpen && selectedUser && (
          <div style={{ marginTop: 12, padding: 12, border: "1px solid #ccc", maxWidth: 520 }}>
            <b>Edit User #{selectedUser.id}</b>
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              <label>
                appUserEmail:
                <input value={userForm.appUserEmail ?? ""} onChange={(e) => setUserForm((p) => ({ ...p, appUserEmail: e.target.value }))} style={{ width: "100%" }} />
              </label>

              <label>
                appUserName:
                <input value={userForm.appUserName ?? ""} onChange={(e) => setUserForm((p) => ({ ...p, appUserName: e.target.value }))} style={{ width: "100%" }} />
              </label>

              <label>
                languages (csv):
                <input value={userLangsCsv} onChange={(e) => setUserLangsCsv(e.target.value)} style={{ width: "100%" }} />
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveUser}>Save</button>
                <button onClick={() => { setUserEditOpen(false); setSelectedUser(null); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===== ARTPIECES ===== */}
      <section style={{ border: "1px solid #ddd", padding: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>ArtPieces</h3>
          <button onClick={fetchArtPieces} disabled={apLoading}>{apLoading ? "Loading..." : "Refresh"}</button>
        </div>

        <ul style={{ marginTop: 12 }}>
          {artPieces.map((ap) => (
            <li key={ap.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span>#{ap.id} — {ap.artPieceName} | {ap.artPieceAddress}</span>
              <button onClick={() => openEditAp(ap)}>Edit</button>
            </li>
          ))}
        </ul>

        {apEditOpen && selectedAp && (
          <div style={{ marginTop: 12, padding: 12, border: "1px solid #ccc", maxWidth: 520 }}>
            <b>Edit ArtPiece #{selectedAp.id}</b>
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              <label>
                artPieceName:
                <input value={apForm.artPieceName ?? ""} onChange={(e) => setApForm((p) => ({ ...p, artPieceName: e.target.value }))} style={{ width: "100%" }} />
              </label>

              <label>
                artPieceAddress:
                <input value={apForm.artPieceAddress ?? ""} onChange={(e) => setApForm((p) => ({ ...p, artPieceAddress: e.target.value }))} style={{ width: "100%" }} />
              </label>

              <label>
                artPieceUserDescription:
                <textarea
                  value={apForm.artPieceUserDescription ?? ""}
                  onChange={(e) => setApForm((p) => ({ ...p, artPieceUserDescription: e.target.value }))}
                  style={{ width: "100%", minHeight: 80 }}
                />
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveAp}>Save</button>
                <button onClick={() => { setApEditOpen(false); setSelectedAp(null); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AllFetches;
export {}