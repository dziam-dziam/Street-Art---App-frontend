import React, {  useRef, useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { ToggleButton } from "primereact/togglebutton";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";

import styles from "../../styles/pages.module.css";

import { AddArtPiecePhotoPanel } from "../../widgets/artpiece/AddArtPieceWidgets";
import { DISTRICT_OPTIONS, ART_TYPE_OPTIONS, ART_STYLE_OPTIONS, LANGUAGE_OPTIONS } from "../constants/options";

type ArtPieceTypes =
  | "GRAFFITI_TAG"
  | "GRAFFITI_PIECE"
  | "STENCIL"
  | "WHEAT_PASTE_POSTER"
  | "STICKER"
  | "MURAL"
  | "INSTALLATION_3D";

type ArtPieceStyles =
  | "POLITICAL"
  | "RELIGIOUS"
  | "SOCIAL_COMMENTARY"
  | "HUMOR"
  | "LOVE_ROMANCE"
  | "HOMESICKNESS"
  | "PHILOSOPHICAL"
  | "ACTIVISM"
  | "ANTI_CONSUMERISM"
  | "COMMERCIAL";

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

  const isValid =
    addArtPieceForm.artPieceName.trim() &&
    addArtPieceForm.artPieceAddress.trim() &&
    addArtPieceForm.artPieceDistrict.trim() &&
    addArtPieceForm.artPieceCity.trim();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("ADD ART PIECE BODY (JSON):\n", JSON.stringify(addArtPieceForm, null, 2));

    const url = new URL("http://localhost:8080/addNew/addArtPiece");
    try {
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(addArtPieceForm),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to add art piece");

      const data = await res.json().catch(() => null);
      console.log("Response from server:\n", data);

      toast.current?.show({
        severity: "success",
        summary: "Sukces ✅",
        detail: "ArtPiece has been added",
        life: 2000,
      });

      setTimeout(() => navigate("/app", { replace: true }), 990);
    } catch (error) {
      console.error("Error during adding art piece:", error);
      toast.current?.show({
        severity: "error",
        summary: "Błąd ❌",
        detail: "Nie udało się dodać ArtPiece",
        life: 2500,
      });
    }
  };

  return (
    <div className={styles.pageCenter}>
      <Toast ref={toast} position="center" />

      <Card title="Add Art Piece" className={styles.cardShell}>
        <div className={styles.twoColGrid}>
          <AddArtPiecePhotoPanel onBack={() => navigate(-1)} />

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
                onChange={(e) => {
                  setForm((p) => ({
                    ...p,
                    artPieceContainsText: e.value,
                    artPieceTextLanguages: e.value ? p.artPieceTextLanguages : [],
                  }));
                }}
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
                options={DISTRICT_OPTIONS as any}
                onChange={(e) => setForm((p) => ({ ...p, artPieceDistrict: e.value }))}
                placeholder="District"
                className={styles.fullWidth}
                filter
                showClear
              />

              <InputText value={addArtPieceForm.artPieceCity} disabled placeholder="City" className={`${styles.fullWidth} ${styles.radius10}`} />
            </div>

            <MultiSelect
              value={addArtPieceForm.artPieceTypes}
              options={ART_TYPE_OPTIONS as any}
              onChange={(e) => setForm((p) => ({ ...p, artPieceTypes: e.value }))}
              placeholder="Art piece types"
              display="chip"
              className={styles.fullWidth}
            />

            <MultiSelect
              value={addArtPieceForm.artPieceStyles}
              options={ART_STYLE_OPTIONS as any}
              onChange={(e) => setForm((p) => ({ ...p, artPieceStyles: e.value }))}
              placeholder="Art piece styles"
              display="chip"
              className={styles.fullWidth}
            />

            <MultiSelect
              value={addArtPieceForm.artPieceTextLanguages}
              options={LANGUAGE_OPTIONS as any}
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
