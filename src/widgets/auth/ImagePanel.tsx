import React from "react";
import styles from "../../styles/pages.module.css";

type Props = {
  src: string;
  alt: string;
  imgClassName: string; // styles.imageFill420 / styles.imageFill460
  minHeight?: number;   // opcjonalnie, jak chcesz
};

export const AuthImagePanel: React.FC<Props> = ({ src, alt, imgClassName }) => {
  return (
    <div className={styles.imagePanel}>
      <img src={src} alt={alt} className={imgClassName} />
    </div>
  );
};
