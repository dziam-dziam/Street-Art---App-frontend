export const LANGUAGE_OPTIONS = [
  { label: "Polish", value: "Polish" },
  { label: "English", value: "English" },
  { label: "German", value: "German" },
  { label: "Spanish", value: "Spanish" },
  { label: "French", value: "French" },
] as const;

export type LanguageOption = (typeof LANGUAGE_OPTIONS)[number]["value"];
export const LANGUAGE_VALUES: LanguageOption[] = LANGUAGE_OPTIONS.map((o) => o.value);

export const ART_TYPE_OPTIONS = [
  { label: "Graffiti tag", value: "GRAFFITI_TAG" },
  { label: "Graffiti piece", value: "GRAFFITI_PIECE" },
  { label: "Stencil", value: "STENCIL" },
  { label: "Wheat paste poster", value: "WHEAT_PASTE_POSTER" },
  { label: "Sticker", value: "STICKER" },
  { label: "Mural", value: "MURAL" },
  { label: "3D installation", value: "INSTALLATION_3D" },
] as const;

export type ArtTypeOption = (typeof ART_TYPE_OPTIONS)[number]["value"];
export const ART_TYPE_VALUES: ArtTypeOption[] = ART_TYPE_OPTIONS.map((o) => o.value);

export const ART_STYLE_OPTIONS = [
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
] as const;

export type ArtStyleOption = (typeof ART_STYLE_OPTIONS)[number]["value"];
export const ART_STYLE_VALUES: ArtStyleOption[] = ART_STYLE_OPTIONS.map((o) => o.value);

export const DISTRICT_OPTIONS = [
  { label: "Jeżyce", value: "Jeżyce" },
  { label: "Grunwald", value: "Grunwald" },
  { label: "Stare Miasto", value: "Stare Miasto" },
  { label: "Nowe Miasto", value: "Nowe Miasto" },
  { label: "Wilda", value: "Wilda" },
  { label: "Łazarz", value: "Łazarz" },
] as const;

export type DistrictName = (typeof DISTRICT_OPTIONS)[number]["value"];
export const DISTRICT_VALUES: DistrictName[] = DISTRICT_OPTIONS.map((o) => o.value);

export const NATIONALITY_OPTIONS = [
  { label: "Polish", value: "Polish" },
  { label: "German", value: "German" },
  { label: "Spanish", value: "Spanish" },
  { label: "French", value: "French" },
  { label: "English", value: "English" },
  { label: "Ukrainian", value: "Ukrainian" },
  { label: "Other", value: "Other" },
] as const;

export type NationalityOption = (typeof NATIONALITY_OPTIONS)[number]["value"];
export const NATIONALITY_VALUES: NationalityOption[] = NATIONALITY_OPTIONS.map((o) => o.value);

// Godziny: TS nie utrzyma literalnego union 0..23 z Array.from, ale to i tak OK
export const HOUR_OPTIONS = [
  ...Array.from({ length: 24 }, (_, h) => ({
    label: `${String(h).padStart(2, "0")}:00`,
    value: h,
  })),
] as const;

export type HourOption = (typeof HOUR_OPTIONS)[number]["value"]; // number

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