import React, { useMemo, useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { ToggleButton } from "primereact/togglebutton";
import { FileUpload } from "primereact/fileupload";
import { Divider } from "primereact/divider";
import { useNavigate } from "react-router-dom";

type ArtPieceTypes = "MURAL" | "GRAFFITI" | "STICKER" | "PASTE_UP" | "TAG";
type ArtPieceStyles = "REALISM" | "ABSTRACT" | "TYPOGRAPHY" | "CHARACTER" | "OTHER";

type AddArtPieceDto = {
  artPieceAddress: string;
  artPieceName: string;
  artPieceContainsText: boolean;
  artPiecePosition: string;
  artPieceUserDescription: string;
  artPieceDistrict: string;
  artPieceCity: string;
  artPieceTypes: ArtPieceTypes[];
  artPieceStyles: ArtPieceStyles[];
  artPieceTextLanguages: string[];
};

export const AddArtPiecePage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<AddArtPieceDto>({
    artPieceAddress: "",
    artPieceName: "",
    artPieceContainsText: false,
    artPiecePosition: "",
    artPieceUserDescription: "",
    artPieceDistrict: "",
    artPieceCity: "Poznań",
    artPieceTypes: [],
    artPieceStyles: [],
    artPieceTextLanguages: [],
  });

  // Opcje (placeholdery — dopasujesz do enumów z backendu)
  const districtOptions = useMemo(
    () => [
      { label: "Jeżyce", value: "Jeżyce" },
      { label: "Stare Miasto", value: "Stare Miasto" },
      { label: "Grunwald", value: "Grunwald" },
      { label: "Wilda", value: "Wilda" },
      { label: "Nowe Miasto", value: "Nowe Miasto" },
    ],
    []
  );

  const typeOptions = useMemo(
    () => [
      { label: "Mural", value: "MURAL" },
      { label: "Graffiti", value: "GRAFFITI" },
      { label: "Sticker", value: "STICKER" },
      { label: "Paste-up", value: "PASTE_UP" },
      { label: "Tag", value: "TAG" },
    ],
    []
  );

  const styleOptions = useMemo(
    () => [
      { label: "Realism", value: "REALISM" },
      { label: "Abstract", value: "ABSTRACT" },
      { label: "Typography", value: "TYPOGRAPHY" },
      { label: "Character", value: "CHARACTER" },
      { label: "Other", value: "OTHER" },
    ],
    []
  );

  const languageOptions = useMemo(
    () => [
      { label: "Polish", value: "Polish" },
      { label: "English", value: "English" },
      { label: "German", value: "German" },
      { label: "Spanish", value: "Spanish" },
      { label: "French", value: "French" },
    ],
    []
  );

  const isValid =
    form.artPieceName.trim() &&
    form.artPieceAddress.trim() &&
    form.artPieceDistrict.trim() &&
    form.artPieceCity.trim();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Body które wyślesz do backendu:
    console.log("ADD ART PIECE BODY (JSON):\n", JSON.stringify(form, null, 2));

    // TODO: POST do backendu
    // navigate("/app"); // np. powrót na mapę
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#7b83cf",
      }}
    >
      <Card
        title="Add Art Piece"
        style={{
          width: "min(980px, 96vw)",
          background: "#4b55a3",
          color: "white",
          borderRadius: 16,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 16 }}>
          {/* LEFT: Add Photo panel */}
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: 14,
              minHeight: 520,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Add Photo</div>

            <div
              style={{
                height: 360,
                borderRadius: 12,
                background: "rgba(0,0,0,0.18)",
                border: "1px dashed rgba(255,255,255,0.35)",
                display: "grid",
                placeItems: "center",
                marginBottom: 12,
              }}
            >
              <div style={{ textAlign: "center", opacity: 0.9 }}>
                <div style={{ fontWeight: 700 }}>Drop photo here</div>
                <small>lub wybierz plik</small>
              </div>
            </div>

            {/* PrimeReact upload (na razie bez url; możesz dodać później) */}
            <FileUpload
              mode="basic"
              name="file"
              accept="image/*"
              maxFileSize={10_000_000}
              chooseLabel="Choose photo"
              auto={false}
              customUpload
              uploadHandler={() => {
                // tu docelowo wrzucisz upload do backendu
              }}
            />

            <Divider style={{ opacity: 0.4 }} />

            <Button
              label="Back"
              icon="pi pi-arrow-left"
              severity="secondary"
              onClick={() => navigate(-1)}
            />
          </div>

          {/* RIGHT: form */}
          <form
            onSubmit={onSubmit}
            style={{
              background: "rgba(255,255,255,0.10)",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.22)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minHeight: 520,
            }}
          >
            {/* Name */}
            <InputText
              value={form.artPieceName}
              onChange={(e) => setForm((p) => ({ ...p, artPieceName: e.target.value }))}
              placeholder="Art piece name"
              style={{ width: "100%", borderRadius: 10 }}
            />

            {/* Tak/Nie boolean */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 700, minWidth: 170 }}>Contains text?</div>

              <ToggleButton
                checked={form.artPieceContainsText}
                onChange={(e) => setForm((p) => ({ ...p, artPieceContainsText: e.value }))}
                onLabel="Tak"
                offLabel="Nie"
                onIcon="pi pi-check"
                offIcon="pi pi-times"
                style={{ width: 160 }}
              />
            </div>

            {/* Address */}
            <InputText
              value={form.artPieceAddress}
              onChange={(e) => setForm((p) => ({ ...p, artPieceAddress: e.target.value }))}
              placeholder="Address (for geocoding)"
              style={{ width: "100%", borderRadius: 10 }}
            />

            {/* Position */}
            <InputText
              value={form.artPiecePosition}
              onChange={(e) => setForm((p) => ({ ...p, artPiecePosition: e.target.value }))}
              placeholder="Position (e.g. wall, tunnel, under bridge)"
              style={{ width: "100%", borderRadius: 10 }}
            />

            {/* District + City */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Dropdown
                value={form.artPieceDistrict}
                options={districtOptions}
                onChange={(e) => setForm((p) => ({ ...p, artPieceDistrict: e.value }))}
                placeholder="District"
                style={{ width: "100%" }}
              />
              <InputText
                value={form.artPieceCity}
                onChange={(e) => setForm((p) => ({ ...p, artPieceCity: e.target.value }))}
                placeholder="City"
                style={{ width: "100%", borderRadius: 10 }}
              />
            </div>

            {/* Types */}
            <MultiSelect
              value={form.artPieceTypes}
              options={typeOptions}
              onChange={(e) => setForm((p) => ({ ...p, artPieceTypes: e.value }))}
              placeholder="Art piece types"
              display="chip"
              style={{ width: "100%" }}
            />

            {/* Styles */}
            <MultiSelect
              value={form.artPieceStyles}
              options={styleOptions}
              onChange={(e) => setForm((p) => ({ ...p, artPieceStyles: e.value }))}
              placeholder="Art piece styles"
              display="chip"
              style={{ width: "100%" }}
            />

            {/* Languages of text (only relevant if containsText = true) */}
            <MultiSelect
              value={form.artPieceTextLanguages}
              options={languageOptions}
              onChange={(e) => setForm((p) => ({ ...p, artPieceTextLanguages: e.value }))}
              placeholder="Text languages"
              display="chip"
              disabled={!form.artPieceContainsText}
              style={{ width: "100%" }}
            />

            {/* User description */}
            <InputTextarea
              value={form.artPieceUserDescription}
              onChange={(e) => setForm((p) => ({ ...p, artPieceUserDescription: e.target.value }))}
              rows={4}
              placeholder="User description"
              style={{ width: "100%" }}
            />

            {/* submit */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: "auto" }}>
              <Button
                type="button"
                label="Cancel"
                severity="secondary"
                onClick={() => navigate(-1)}
              />
              <Button type="submit" label="Save" icon="pi pi-check" disabled={!isValid} />
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
