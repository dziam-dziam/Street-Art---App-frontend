import React, { useMemo, useRef } from "react";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Divider } from "primereact/divider";
import styles from "../../styles/pages.module.css";

import { useTranslation } from "react-i18next";

type PhotoPanelProps = {
  onBack: () => void;
  previewUrls: string[];
  onFilesSelected: (files: File[]) => void;
  onRemoveAt: (index: number) => void;
  onClearAll: () => void;
};

export const AddArtPiecePhotoPanel: React.FC<PhotoPanelProps> = ({
  onBack,
  previewUrls,
  onFilesSelected,
  onRemoveAt,
  onClearAll,
}) => {
  const { t } = useTranslation();
  const fuRef = useRef<FileUpload>(null);

  // ✅ show last added
  const mainUrl = useMemo(() => {
    return previewUrls.length ? previewUrls[previewUrls.length - 1] : null;
  }, [previewUrls]);

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>{t("addArtpiecePhotos.title")}</div>

      {/* ✅ dropZone “locks” image so it doesn't overlap UI */}
      <div className={styles.dropZone} style={{ position: "relative", overflow: "hidden" }}>
        {mainUrl ? (
          <img
            src={mainUrl}
            alt={t("addArtpiecePhotos.previewAlt")}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 12,
              display: "block",
            }}
          />
        ) : (
          <div style={{ textAlign: "center", opacity: 0.9 }}>
            <div style={{ fontWeight: 700 }}>{t("addArtpiecePhotos.dropTitle")}</div>
            <small>{t("addArtpiecePhotos.dropSubtitle")}</small>
          </div>
        )}
      </div>

      {/* thumbs + delete */}
      {previewUrls.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          {previewUrls.map((u, idx) => {
            const isMain = idx === previewUrls.length - 1;
            return (
              <div
                key={`${u}-${idx}`}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: isMain ? "2px solid rgba(126,224,129,0.95)" : "1px solid rgba(255,255,255,0.22)",
                  position: "relative",
                }}
                title={isMain ? t("addArtpiecePhotos.lastAddedTitle") : ""}
              >
                <img src={u} alt={`${t("addArtpiecePhotos.thumbAlt")}-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <Button
                  type="button"
                  icon="pi pi-trash"
                  severity="danger"
                  rounded
                  text
                  onClick={() => onRemoveAt(idx)}
                  style={{
                    position: "absolute",
                    right: -6,
                    top: -6,
                    background: "rgba(0,0,0,0.35)",
                  }}
                  aria-label={t("addArtpiecePhotos.remove")}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 2 }}>
        <FileUpload
          ref={fuRef}
          mode="basic"
          name="file"
          accept="image/*"
          maxFileSize={10_000_000}
          chooseLabel={previewUrls.length ? t("addArtpiecePhotos.addMore") : t("addArtpiecePhotos.choose")}
          auto={false}
          customUpload
          multiple
          uploadHandler={() => {}}
          onSelect={(e) => {
            const files = (e.files as File[]) ?? [];
            if (files.length) onFilesSelected(files);

            // reset input (without onClear)
            fuRef.current?.clear();
          }}
        />

        <Button
          type="button"
          label={t("addArtpiecePhotos.clear")}
          icon="pi pi-times"
          severity="secondary"
          onClick={() => {
            onClearAll();
            fuRef.current?.clear();
          }}
          disabled={!previewUrls.length}
        />
      </div>

      <Divider style={{ opacity: 0.4 }} />

      <Button label={t("buttons.back")} icon="pi pi-arrow-left" severity="secondary" onClick={onBack} />
    </div>
  );
};
