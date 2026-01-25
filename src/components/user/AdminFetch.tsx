import React, { useEffect, useRef, useState } from "react";

type CityAdminDto = {
  id: number;
  cityName: string;
  cityResidentsCount: number;
};

type UpdateCityDto = {
  cityName: string;
  cityResidentsCount: number;
};

const BASE = "http://localhost:8080";

export const AdminFetch: React.FC = () => {
  const [cities, setCities] = useState<CityAdminDto[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // --- EDIT STATE ---
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityAdminDto | null>(null);
  const [editForm, setEditForm] = useState<UpdateCityDto>({
    cityName: "",
    cityResidentsCount: 0,
  });

  const fetchCities = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const url = `${BASE}/admin/getAll/cities`;

    try {
      setLoading(true);
      console.log("➡️ Fetching:", url);

      const backendResponse = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        // credentials: "include",
        signal: controller.signal,
      });

      const rawResponse = await backendResponse.text();
      console.log("STATUS:", backendResponse.status);
      console.log("RAW:", rawResponse);

      if (!backendResponse.ok) {
        throw new Error(`HTTP ${backendResponse.status}. Body: ${rawResponse.slice(0, 200)}`);
      }

      const responseData = rawResponse.trim() ? (JSON.parse(rawResponse) as CityAdminDto[]) : [];
      setCities(responseData);
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("❌ Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCity = async (id: number) => {
    const url = `${BASE}/remove/cities/${id}`; // <- upewnij się, że backend ma taki endpoint

    try {
      console.log("🗑️ Deleting:", url);

      const backendResponse = await fetch(url, {
        method: "DELETE",
        headers: { Accept: "application/json" },
        // credentials: "include",
      });

      const rawResponse = await backendResponse.text().catch(() => "");
      console.log("DELETE STATUS:", backendResponse.status);
      console.log("DELETE RAW:", rawResponse);

      if (!backendResponse.ok) {
        throw new Error(`DELETE failed. HTTP ${backendResponse.status}. Body: ${rawResponse.slice(0, 200)}`);
      }

      setCities((prev) => prev.filter((city) => city.id !== id));
    } catch (error) {
      console.error("❌ Delete error:", error);
      alert("Nie udało się usunąć miasta.");
    }
  };

  // --- OPEN EDIT ---
  const openEdit = (city: CityAdminDto) => {
    setSelectedCity(city);
    setEditForm({
      cityName: city.cityName,
      cityResidentsCount: city.cityResidentsCount,
    });
    setEditOpen(true);
  };

  const updateCity = async (id: number, body: UpdateCityDto) => {
    const url = `${BASE}/updateAdminCity/city/${id}`; // <- upewnij się, że backend ma PUT /admin/cities/{id}

    const backendResponse = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        Accept: "application/json",
      },
      // credentials: "include",
      body: JSON.stringify(body),
    });

    const rawResponse = await backendResponse.text().catch(() => "");
    console.log("PUT STATUS:", backendResponse.status);
    console.log("PUT RAW:", rawResponse);

    if (!backendResponse.ok) {
      throw new Error(`PUT failed. HTTP ${backendResponse.status}. Body: ${rawResponse.slice(0, 200)}`);
    }

    return rawResponse.trim() ? (JSON.parse(rawResponse) as CityAdminDto) : null;
  };

  const onSaveEdit = async () => {
    if (!selectedCity) return;

    try {
      const updated = await updateCity(selectedCity.id, editForm);

      if (updated) {
        setCities((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        await fetchCities();
      }

      setEditOpen(false);
      setSelectedCity(null);
    } catch (error) {
      console.error("❌ Update error:", error);
      alert("Nie udało się zaktualizować miasta.");
    }
  };

  useEffect(() => {
    fetchCities();
    return () => abortRef.current?.abort();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>AdminFetch test (GET + DELETE + PUT)</h2>

      <button onClick={fetchCities} disabled={loading}>
        {loading ? "Ładowanie..." : "Odśwież"}
      </button>

      <ul style={{ marginTop: 16 }}>
        {cities.map((city) => (
          <li key={city.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>
              #{city.id} — {city.cityName} ({city.cityResidentsCount})
            </span>

            <button onClick={() => openEdit(city)}>Edytuj</button>
            <button onClick={() => deleteCity(city.id)}>Usuń</button>
          </li>
        ))}
      </ul>

      {/* PROSTE OKNO EDYCJI */}
      {editOpen && selectedCity && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ccc", maxWidth: 360 }}>
          <h3>Edycja miasta #{selectedCity.id}</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label>
              Nazwa:
              <input
                value={editForm.cityName}
                onChange={(e) => setEditForm((p) => ({ ...p, cityName: e.target.value }))}
                style={{ width: "100%" }}
              />
            </label>

            <label>
              Liczba mieszkańców:
              <input
                type="number"
                value={editForm.cityResidentsCount}
                onChange={(e) => setEditForm((p) => ({ ...p, cityResidentsCount: Number(e.target.value) }))}
                style={{ width: "100%" }}
              />
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onSaveEdit}>Zapisz</button>
              <button
                onClick={() => {
                  setEditOpen(false);
                  setSelectedCity(null);
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

export default AdminFetch;