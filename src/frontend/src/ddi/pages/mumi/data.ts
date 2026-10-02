/**
 * The site's "mission data", in MUMI's slots (docs/pages/mumi.md). PLACEHOLDER. It lives with the page, not in
 * `content/`: it is page furniture, not site content.
 */
export const MISSION_DATA = {
  /** The memory unit: the home server the site is loaded from. */
  muId: { value: "HOMELAB-01", meaning: "Home server" },
  /** The MU ID after the load: the console the load opens. */
  loadedMuId: "ADMIN",
  /** The two ID fields: the two images the cluster runs. */
  idFields: [
    { value: "WEB", meaning: "Frontend image" },
    { value: "API", meaning: "API image" },
  ],
  /** MC (mission computer) is the site build; SMS (stores management) is the content database. */
  mc: { value: "WEB-26.10", meaning: "Site build" },
  sms: { value: "CDB-0042", meaning: "Content database schema" },
  /** The ERRORS list from the last load. A new load clears it. */
  errors: { value: "FONTS, CDN", meaning: "Fonts and the asset CDN" },
} as const;
