import React from "react";
import styles from "../../styles/pages.module.css";

type Props = {
  src: string;
  alt: string;
  imgClassName: string;
  minHeight?: number;  
};

export const AuthImagePanel: React.FC<Props> = ({ src, alt, imgClassName }) => {
  return (
    <div className={styles.imagePanel}>
      <img src={src} alt={alt} className={imgClassName} />
    </div>
  );
};