export const MULTISET_MAP_ID = "MAP_GCEL3WD6ACQL";

export const MULTISET_AUTH_ENDPOINT =
  import.meta.env.VITE_MULTISET_AUTH_ENDPOINT || "/api/multiset/token";

export const MULTISET_QUERY_ENDPOINT =
  import.meta.env.VITE_MULTISET_QUERY_ENDPOINT || "/api/multiset/query-form";

export const MULTISET_MAP_DETAILS_ENDPOINT =
  import.meta.env.VITE_MULTISET_MAP_DETAILS_ENDPOINT || "/api/multiset/map/";

export const MULTISET_MAP_SET_DETAILS_ENDPOINT =
  import.meta.env.VITE_MULTISET_MAP_SET_DETAILS_ENDPOINT || "/api/multiset/map-set/";

export const MULTISET_FILE_ENDPOINT =
  import.meta.env.VITE_MULTISET_FILE_ENDPOINT || "/api/multiset/file";

export const MULTISET_BROWSER_CLIENT_ID =
  import.meta.env.VITE_MULTISET_BROWSER_CLIENT_ID || "bsu-visitor-browser";

// Real Multiset map-space coordinates copied from the MAP_GCEL3WD6ACQL map.
// Multiset stores coordinates in left-handed / Unity map space. NavAr converts
// X to Three.js right-handed space before applying worldFromMap.
export const AR_DESTINATIONS = [
  {
    id: "office-of-the-dean",
    name: "Office of the Dean",
    aliases: ["dean", "office dean", "office of dean", "office of the dean"],
    multiset: { x: -18.091, y: -0.488, z: 42.448 },
  },
  {
    id: "registrar",
    name: "Registrar",
    aliases: ["registrar"],
    multiset: { x: -1.434, y: 0.058, z: 9.761 },
  },
  {
    id: "cashier",
    name: "Cashier",
    aliases: ["cashier"],
    multiset: { x: 0.199, y: -0.008, z: 5.923 },
  },
  {
    id: "guard-house",
    name: "Guard House",
    aliases: ["guard", "guardhouse", "guard house"],
    multiset: { x: -33.592, y: -1.387, z: 52.567 },
  },
];

// Real Multiset map-space pathway coordinates copied from MAP_GCEL3WD6ACQL.
// NavAr renders these as a connected pathway polyline after VPS localization.
export const AR_PATHWAY_POINTS = [
  { x: -30.324, y: -1.695, z: 53.086 },
  { x: -27.176, y: -1.682, z: 46.393 },
  { x: -19.763, y: -1.678, z: 48.73 },
  { x: -17.83, y: -1.495, z: 44.073 },
  { x: -20.171, y: -1.473, z: 42.649 },
  { x: -10.905, y: -1.559, z: 17.304 },
  { x: -7.467, y: -1.456, z: 17.71 },
  { x: -6.327, y: -1.629, z: 14.775 },
  { x: -2.542, y: -1.706, z: 15.655 },
  { x: -0.957, y: -1.39, z: 12.661 },
  { x: -3.275, y: -1.389, z: 10.993 },
  { x: -0.84, y: -1.354, z: 2.772 },
];

export function normalizeDestinationName(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function findArDestination({ id, name } = {}) {
  const normalizedId = normalizeDestinationName(id);
  const normalizedName = normalizeDestinationName(name);

  return AR_DESTINATIONS.find((destination) => {
    const keys = [
      destination.id,
      destination.name,
      ...(destination.aliases || []),
    ].map(normalizeDestinationName);

    return keys.includes(normalizedId) || keys.includes(normalizedName);
  });
}

export const isMultisetConfigured = Boolean(
  MULTISET_MAP_ID &&
    MULTISET_AUTH_ENDPOINT &&
    MULTISET_QUERY_ENDPOINT &&
    MULTISET_MAP_DETAILS_ENDPOINT &&
    MULTISET_FILE_ENDPOINT,
);
