import React from "react";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Divider } from "primereact/divider";
import styles from "../../styles/pages.module.css";

type PhotoPanelProps = {
  onBack: () => void;
  uploadHandler?: () => void;
};

export const AddArtPiecePhotoPanel: React.FC<PhotoPanelProps> = ({ onBack, uploadHandler }) => {
  return (
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
        uploadHandler={uploadHandler ?? (() => {})}
      />

      <Divider style={{ opacity: 0.4 }} />

      <Button label="Back" icon="pi pi-arrow-left" severity="secondary" onClick={onBack} />
    </div>
  );
};
