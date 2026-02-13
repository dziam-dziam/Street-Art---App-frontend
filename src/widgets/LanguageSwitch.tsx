import React from "react";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import styles from "../styles/LanguageSwitch.module.css"

type Props = {
  /** jeśli chcesz czasem wyłączyć pozycjonowanie fixed */
  fixedTopRight?: boolean;
};

export const LanguageSwitch: React.FC<Props> = ({ fixedTopRight = true }) => {
  const { t } = useTranslation();

  const current = i18n.language?.startsWith("pl") ? "pl" : "en";

  const setLang = (lng: "pl" | "en") => {
    if (lng !== current) i18n.changeLanguage(lng);
  };

  return (
    <div className={`${styles.wrapper} ${fixedTopRight ? styles.fixedTopRight : ""}`}>
      <div className={styles.switch} role="tablist" aria-label={t("common.language")}>
        <div
          className={`${styles.thumb} ${current === "en" ? styles.thumbRight : styles.thumbLeft}`}
          aria-hidden="true"
        />
        <button
          type="button"
          className={`${styles.btn} ${current === "pl" ? styles.active : ""}`}
          onClick={() => setLang("pl")}
          aria-pressed={current === "pl"}
        >
          {t("common.pl")}
        </button>
        <button
          type="button"
          className={`${styles.btn} ${current === "en" ? styles.active : ""}`}
          onClick={() => setLang("en")}
          aria-pressed={current === "en"}
        >
          {t("common.en")}
        </button>
      </div>
    </div>
  );
};