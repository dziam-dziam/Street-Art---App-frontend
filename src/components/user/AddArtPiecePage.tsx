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

  const [addArtPieceForm, setForm] = useState<AddArtPieceDto>({
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
    { label: "Graffiti tag", value: "GRAFFITI_TAG" },
    { label: "Graffiti piece", value: "GRAFFITI_PIECE" },
    { label: "Stencil", value: "STENCIL" },
    { label: "Wheat paste poster", value: "WHEAT_PASTE_POSTER" },
    { label: "Sticker", value: "STICKER" },
    { label: "Mural", value: "MURAL" },
    { label: "3D installation", value: "INSTALLATION_3D" },
  ],
  []
);


const styleOptions = useMemo(
  () => [
    { label: "Political", value: "POLITICAL" },
    { label: "Religious", value: "RELIGIOUS" },
    { label: "Social commentary", value: "SOCIAL_COMMENTARY" },
    { label: "Humor", value: "HUMOR" },
    { label: "Love / romance", value: "LOVE_ROMANCE" },
    { label: "Homesickness", value: "HOMESICKNESS" },
    { label: "Philosophical", value: "PHILOSOPHICAL" },
    { label: "Activism", value: "ACTIVISM" },
    { label: "Anti-consumerism", value: "ANTI_CONSUMERISM" },
    { label: "Commercial", value: "COMMERCIAL" },
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
    addArtPieceForm.artPieceName.trim() &&
    addArtPieceForm.artPieceAddress.trim() &&
    addArtPieceForm.artPieceDistrict.trim() &&
    addArtPieceForm.artPieceCity.trim();

  const onSubmit = async (e: React.FormEvent) => {
    console.log("ADD ART PIECE BODY (JSON):\n", JSON.stringify(addArtPieceForm, null, 2));
    e.preventDefault();
    const url = new URL("http://localhost:8080/addNew/addArtPiece")
    try{
      const res = await fetch (url.toString(), {
        method: "POST",
        headers: {"Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(addArtPieceForm),
        credentials: "include",
      });
      if (!res.ok){
        alert ("Failed to add art piece");
        throw new Error ("Failed to add art piece");
      }
    const data = await res.json().catch(() => null);
    console.log("Response from server:\n", data); 
      navigate("/app", { replace: true });
    alert("Art piece added successfully!");
   }
    catch (error) {
    console.error("Error during adding art piece:", error);
  };
}

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
              value={addArtPieceForm.artPieceName}
              onChange={(e) => setForm((p) => ({ ...p, artPieceName: e.target.value }))}
              placeholder="Art piece name"
              style={{ width: "100%", borderRadius: 10 }}
            />

            {/* Tak/Nie boolean */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 700, minWidth: 170 }}>Contains text?</div>

              <ToggleButton
                checked={addArtPieceForm.artPieceContainsText}
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
              value={addArtPieceForm.artPieceAddress}
              onChange={(e) => setForm((p) => ({ ...p, artPieceAddress: e.target.value }))}
              placeholder="Address (for geocoding)"
              style={{ width: "100%", borderRadius: 10 }}
            />

            {/* Position */}
            <InputText
              value={addArtPieceForm.artPiecePosition}
              onChange={(e) => setForm((p) => ({ ...p, artPiecePosition: e.target.value }))}
              placeholder="Position (e.g. wall, tunnel, under bridge)"
              style={{ width: "100%", borderRadius: 10 }}
            />

            {/* District + City */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Dropdown
                value={addArtPieceForm.artPieceDistrict}
                options={districtOptions}
                onChange={(e) => setForm((p) => ({ ...p, artPieceDistrict: e.value }))}
                placeholder="District"
                style={{ width: "100%" }}
              />
              <InputText
                value={addArtPieceForm.artPieceCity}
                onChange={(e) => setForm((p) => ({ ...p, artPieceCity: e.target.value }))}
                placeholder="City"
                style={{ width: "100%", borderRadius: 10 }}
              />
            </div>

            {/* Types */}
            <MultiSelect
              value={addArtPieceForm.artPieceTypes}
              options={typeOptions}
              onChange={(e) => setForm((p) => ({ ...p, artPieceTypes: e.value }))}
              placeholder="Art piece types"
              display="chip"
              style={{ width: "100%" }}
            />

            {/* Styles */}
            <MultiSelect
              value={addArtPieceForm.artPieceStyles}
              options={styleOptions}
              onChange={(e) => setForm((p) => ({ ...p, artPieceStyles: e.value }))}
              placeholder="Art piece styles"
              display="chip"
              style={{ width: "100%" }}
            />

            {/* Languages of text (only relevant if containsText = true) */}
            <MultiSelect
              value={addArtPieceForm.artPieceTextLanguages}
              options={languageOptions}
              onChange={(e) => setForm((p) => ({ ...p, artPieceTextLanguages: e.value }))}
              placeholder="Text languages"
              display="chip"
              disabled={!addArtPieceForm.artPieceContainsText}
              style={{ width: "100%" }}
            />

            {/* User description */}
            <InputTextarea
              value={addArtPieceForm.artPieceUserDescription}
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
