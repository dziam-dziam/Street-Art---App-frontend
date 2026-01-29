export const LANGUAGE_OPTIONS = [
  { label: "Polish", value: "Polish" },
  { label: "English", value: "English" },
  { label: "German", value: "German" },
  { label: "Spanish", value: "Spanish" },
  { label: "French", value: "French" },
] as const;

export const ART_TYPE_OPTIONS = [
  { label: "Graffiti tag", value: "GRAFFITI_TAG" },
  { label: "Graffiti piece", value: "GRAFFITI_PIECE" },
  { label: "Stencil", value: "STENCIL" },
  { label: "Wheat paste poster", value: "WHEAT_PASTE_POSTER" },
  { label: "Sticker", value: "STICKER" },
  { label: "Mural", value: "MURAL" },
  { label: "3D installation", value: "INSTALLATION_3D" },
] as const;

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

export const DISTRICT_OPTIONS = [
  { label: "Jeżyce", value: "Jeżyce" },
  { label: "Grunwald", value: "Grunwald" },
  { label: "Stare Miasto", value: "Stare Miasto" },
  { label: "Nowe Miasto", value: "Nowe Miasto" },
  { label: "Wilda", value: "Wilda" },
] as const;

export const NATIONALITY_OPTIONS = [
  { label: "Polish", value: "Polish" },
  { label: "German", value: "German" },
  { label: "Spanish", value: "Spanish" },
  { label: "French", value: "French" },
  { label: "English", value: "English" },
  { label: "Ukrainian", value: "Ukrainian" },
  { label: "Other", value: "Other" },
] as const;

export const HOUR_OPTIONS = [
  ...Array.from({ length: 24 }, (_, h) => ({
    label: `${String(h).padStart(2, "0")}:00`,
    value: h,
  })),
] as const;

export const TRANSPORT_OPTIONS = [
  { label: "Walk", value: "WALK" },
  { label: "Bike", value: "BIKE" },
  { label: "Car", value: "CAR" },
  { label: "Tram", value: "TRAM" },
  { label: "Bus", value: "BUS" },
  { label: "Train", value: "TRAIN" }
] as const;