// src/components/constants/Options.ts
// READY TO PASTE ✅
// Fix: nie używamy TFunction z typami i18next/react-i18next, tylko własny typ funkcji t()
// dzięki temu t(key, options) nie wali TS2554.

type TT = (key: string, options?: any) => string;

// ---------------- LANGUAGES ----------------
export const LANGUAGE_VALUES = ["Polish", "English", "German", "Spanish", "French",
   "Russian", "Italian", "Korean", "Chinese", "Japanese", "Hindi","Swedish","Turkish","Georgian",
  "Lithuanian","Belarusian","Other"] as const;
export type LanguageOption = (typeof LANGUAGE_VALUES)[number];

export const getLanguageOptions = (t: TT) =>
  LANGUAGE_VALUES.map((v) => ({
    value: v,
    label: t(`options.languages.${v}`, { defaultValue: v }),
  }));

// ---------------- ART TYPES ----------------
export const ART_TYPE_VALUES = [
  "GRAFFITI_TAG",
  "GRAFFITI_PIECE",
  "STENCIL",
  "WHEAT_PASTE_POSTER",
  "STICKER",
  "MURAL",
  "INSTALLATION_3D",
] as const;

export type ArtTypeOption = (typeof ART_TYPE_VALUES)[number];

export const getArtTypeOptions = (t: TT) =>
  ART_TYPE_VALUES.map((v) => ({
    value: v,
    label: t(`options.artTypes.${v}`, { defaultValue: v }),
  }));

// ---------------- ART STYLES ----------------
export const ART_STYLE_VALUES = [
  "POLITICAL",
  "RELIGIOUS",
  "SOCIAL_COMMENTARY",
  "HUMOR",
  "LOVE_ROMANCE",
  "HOMESICKNESS",
  "PHILOSOPHICAL",
  "ACTIVISM",
  "ANTI_CONSUMERISM",
  "COMMERCIAL",
] as const;

export type ArtStyleOption = (typeof ART_STYLE_VALUES)[number];

export const getArtStyleOptions = (t: TT) =>
  ART_STYLE_VALUES.map((v) => ({
    value: v,
    label: t(`options.artStyles.${v}`, { defaultValue: v }),
  }));

// ---------------- DISTRICTS ----------------
export const DISTRICT_OPTIONS = [
  { label: "Jeżyce", value: "Jeżyce" },
  { label: "Grunwald", value: "Grunwald" },
  { label: "Stare Miasto", value: "Stare Miasto" },
  { label: "Nowe Miasto", value: "Nowe Miasto" },
  { label: "Wilda", value: "Wilda" },
  { label: "Łazarz", value: "Łazarz" },
  { label: "Ławica", value: "Ławica" },
  { label: "Rataje", value: "Rataje" },
  { label: "Winogrady", value: "Winogrady" },
  { label: "Ostrów Tumski", value: "Ostrów Tumski" },
  { label: "Sołacz", value: "Sołacz" },
  { label: "Podolany", value: "Podolany" },
  { label: "Umultowo", value: "Umultowo" },
  { label: "Ogrody", value: "Ogrody" },
  { label: "Antoninek", value: "Antoninek" },
  { label: "Chartowo", value: "Chartowo" },
  { label: "Żegrze", value: "Żegrze" },
  { label: "Wola", value: "Wola" },
  { label: "Piątkowo", value: "Piątkowo" },
  { label: "Łacina", value: "Łacina" },
  { label: "Miłostowo", value: "Miłostowo" },
  { label: "Świerczewo", value: "Świerczewo" },
  { label: "Malta", value: "Malta" },
  { label: "Junikowo", value: "Junikowo" },
  { label: "Naramowice", value: "Naramowice" },
  { label: "Dębiec", value: "Dębiec" },
  { label: "Górczyn", value: "Górczyn" },
  { label: "Strzeszyn", value: "Strzeszyn" },
] as const;

export type DistrictName = (typeof DISTRICT_OPTIONS)[number]["value"];
export const DISTRICT_VALUES: DistrictName[] = DISTRICT_OPTIONS.map((o) => o.value);

export const getDistrictOptions = (_t: TT) =>
  DISTRICT_VALUES.map((v) => ({
    value: v,
    label: v, // dzielnice zostają "na sztywno" (nazwy własne)
  }));

// ---------------- NATIONALITIES ----------------
export const NATIONALITY_VALUES = ["Polish", "German", "Spanish", "French", "English", "Ukrainian", "Russian", 
  "Italian", "Korean","Chinese","Japanese", "Indian","Georgian","Lithuanian","Belarusian","Other"] as const;

export type NationalityOption = (typeof NATIONALITY_VALUES)[number];

export const getNationalityOptions = (t: TT) =>
  NATIONALITY_VALUES.map((v) => ({
    value: v,
    label: t(`options.nationalities.${v}`, { defaultValue: v }),
  }));

// ---------------- HOURS ----------------
// Godziny: TS nie utrzyma literalnego union 0..23 z Array.from, ale to i tak OK
export const HOUR_OPTIONS = [
  ...Array.from({ length: 24 }, (_, h) => ({
    label: `${String(h).padStart(2, "0")}:00`,
    value: h,
  })),
] as const;

export type HourOption = (typeof HOUR_OPTIONS)[number]["value"]; // number

// ---------------- TRANSPORT ----------------
export const TRANSPORT_OPTIONS = [
  { label: "Walk", value: "WALK" },
  { label: "Bike", value: "BIKE" },
  { label: "Car", value: "CAR" },
  { label: "Tram", value: "TRAM" },
  { label: "Bus", value: "BUS" },
  { label: "Train", value: "TRAIN" },
] as const;

export type MeansOfTransport = (typeof TRANSPORT_OPTIONS)[number]["value"];
export const TRANSPORT_VALUES: MeansOfTransport[] = TRANSPORT_OPTIONS.map((o) => o.value);

export const getTransportOptions = (t: TT) =>
  TRANSPORT_VALUES.map((v) => ({
    value: v,
    label: t(`options.transport.${v}`, { defaultValue: v }),
  }));