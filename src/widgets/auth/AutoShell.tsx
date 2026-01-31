import React from "react";
import { Card } from "primereact/card";
import styles from "../../styles/pages.module.css";

type Props = {
  title?: string;
  cardClassName: string;  
  children: React.ReactNode;
};

export const AuthShell: React.FC<Props> = ({ title, cardClassName, children }) => {
  return (
    <div className={styles.authBg}>
      <Card title={title} className={cardClassName}>
        {children}
      </Card>
    </div>
  );
};