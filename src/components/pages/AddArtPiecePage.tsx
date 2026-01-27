import React, { useMemo, useRef, useState } from "react";
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
import { Toast } from "primereact/toast";
import styles from "../../styles/pages.module.css";


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
  const toast = useRef<Toast>(null);


  const [addArtPieceForm, setForm] = useState<AddArtPieceDto>({
    artPieceAddress: "",
    artPieceName: "Anonymous",
    artPieceContainsText: false,
    artPiecePosition: "",
    artPieceUserDescription: "",
    artPieceDistrict: "",
    artPieceCity: "Poznań",
    artPieceTypes: [],
    artPieceStyles: [],
    artPieceTextLanguages: [],
  });

  const districtOptions = useMemo(
    () => [
      { label: "Jeżyce", value: "Jeżyce" },
      { label: "Stare Miasto", value: "Stare Miasto" },
      { label: "Grunwald", value: "Grunwald" },
      { label: "Wilda", value: "Wilda" },
      { label: "Łazarz", value: "Łazarz" },
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
        throw new Error ("Failed to add art piece");
      }
    const data = await res.json().catch(() => null);
    console.log("Response from server:\n", data); 
        toast.current?.show({
          severity: "success",
          summary: "Sukces ✅",
          detail: "ArtPiece has been added",
          life: 2000,
        });
        setTimeout(() => {
          navigate("/app", { replace: true });
        }, 990);
   }
    catch (error) {
    console.error("Error during adding art piece:", error);
  };
}

return (
  <div className={styles.pageCenter}>
    <Toast ref={toast} position="center" />

    <Card title="Add Art Piece" className={styles.cardShell}>
      <div className={styles.twoColGrid}>
        {/* LEFT: Add Photo panel */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Add Photo</div>

          <div className={styles.dropZone}>
            <div style={{ textAlign: "center", opacity: 0.9 }}>
              <div style={{ fontWeight: 700 }}>Drop photo here</div>
              <small>lub wybierz plik</small>
            </div>
          </div>

          <FileUpload
            mode="basic"
            name="file"
            accept="image/*"
            maxFileSize={10_000_000}
            chooseLabel="Choose photo"
            auto={false}
            customUpload
            uploadHandler={() => {
              // TODO: upload
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
        <form onSubmit={onSubmit} className={styles.formPanel}>
          <InputText
            value={addArtPieceForm.artPieceName}
            onChange={(e) => setForm((p) => ({ ...p, artPieceName: e.target.value }))}
            placeholder="Art piece name"
            className={`${styles.fullWidth} ${styles.radius10}`}
          />

          <div className={styles.row}>
            <div className={styles.labelStrong}>Contains text?</div>

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

          <InputText
            value={addArtPieceForm.artPieceAddress}
            onChange={(e) => setForm((p) => ({ ...p, artPieceAddress: e.target.value }))}
            placeholder="Address"
            className={`${styles.fullWidth} ${styles.radius10}`}
          />

          <InputText
            value={addArtPieceForm.artPiecePosition}
            onChange={(e) => setForm((p) => ({ ...p, artPiecePosition: e.target.value }))}
            placeholder="Position (e.g. wall, tunnel, under bridge)"
            className={`${styles.fullWidth} ${styles.radius10}`}
          />

          <div className={styles.grid2}>
            <Dropdown
              value={addArtPieceForm.artPieceDistrict}
              options={districtOptions}
              onChange={(e) => setForm((p) => ({ ...p, artPieceDistrict: e.value }))}
              placeholder="District"
              className={styles.fullWidth}
            />

            <InputText
              value={addArtPieceForm.artPieceCity}
              disabled
              placeholder="City"
              className={`${styles.fullWidth} ${styles.radius10}`}
              style={{ opacity: 0.9 }}
            />
          </div>

          <MultiSelect
            value={addArtPieceForm.artPieceTypes}
            options={typeOptions}
            onChange={(e) => setForm((p) => ({ ...p, artPieceTypes: e.value }))}
            placeholder="Art piece types"
            display="chip"
            className={styles.fullWidth}
          />

          <MultiSelect
            value={addArtPieceForm.artPieceStyles}
            options={styleOptions}
            onChange={(e) => setForm((p) => ({ ...p, artPieceStyles: e.value }))}
            placeholder="Art piece styles"
            display="chip"
            className={styles.fullWidth}
          />

          <MultiSelect
            value={addArtPieceForm.artPieceTextLanguages}
            options={languageOptions}
            onChange={(e) => setForm((p) => ({ ...p, artPieceTextLanguages: e.value }))}
            placeholder="Text languages"
            display="chip"
            disabled={!addArtPieceForm.artPieceContainsText}
            className={styles.fullWidth}
          />

          <InputTextarea
            value={addArtPieceForm.artPieceUserDescription}
            onChange={(e) => setForm((p) => ({ ...p, artPieceUserDescription: e.target.value }))}
            rows={4}
            placeholder="User description"
            className={styles.fullWidth}
          />

          <div className={styles.actionsRight}>
            <Button type="button" label="Cancel" severity="secondary" onClick={() => navigate(-1)} />
            <Button type="submit" label="Save" icon="pi pi-check" disabled={!isValid} />
          </div>
        </form>
      </div>
    </Card>
  </div>
);
};
