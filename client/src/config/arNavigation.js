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

export const isMultisetConfigured = Boolean(
  MULTISET_MAP_ID &&
    MULTISET_AUTH_ENDPOINT &&
    MULTISET_QUERY_ENDPOINT &&
    MULTISET_MAP_DETAILS_ENDPOINT &&
    MULTISET_FILE_ENDPOINT,
);
