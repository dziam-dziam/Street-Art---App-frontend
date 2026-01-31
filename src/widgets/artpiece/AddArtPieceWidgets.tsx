import React, { useMemo, useRef } from "react";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Divider } from "primereact/divider";
import styles from "../../styles/pages.module.css";

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
  const fuRef = useRef<FileUpload>(null);

  // ✅ pokaż ostatnio dodane
  const mainUrl = useMemo(() => {
    return previewUrls.length ? previewUrls[previewUrls.length - 1] : null;
  }, [previewUrls]);

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Add Photo</div>

      {/* ✅ dropZone “zamyka” obrazek, żeby nie nachodził na UI */}
      <div className={styles.dropZone} style={{ position: "relative", overflow: "hidden" }}>
        {mainUrl ? (
          <img
            src={mainUrl}
            alt="preview"
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
            <div style={{ fontWeight: 700 }}>Drop photo here</div>
            <small>lub wybierz plik</small>
          </div>
        )}
      </div>

      {/* miniatury + usuwanie */}
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
                  border: isMain
                    ? "2px solid rgba(126,224,129,0.95)"
                    : "1px solid rgba(255,255,255,0.22)",
                  position: "relative",
                }}
                title={isMain ? "Last added (shown)" : ""}
              >
                <img src={u} alt={`thumb-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ controls zawsze POD dropZone */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 2 }}>
        <FileUpload
          ref={fuRef}
          mode="basic"
          name="file"
          accept="image/*"
          maxFileSize={10_000_000}
          chooseLabel={previewUrls.length ? "Add more photos" : "Choose photo"}
          auto={false}
          customUpload
          multiple
          uploadHandler={() => {}}
          onSelect={(e) => {
            const files = (e.files as File[]) ?? [];
            if (files.length) onFilesSelected(files);

            // reset input – bez onClear (żeby nie robić pętli)
            fuRef.current?.clear();
          }}
        />

        <Button
          type="button"
          label="Clear"
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

      <Button label="Back" icon="pi pi-arrow-left" severity="secondary" onClick={onBack} />
    </div>
  );
};