import { Router } from "express";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const MULTISET_BASE_URL = "https://api.multiset.ai/v1";
const MULTISET_AUTH_URL = `${MULTISET_BASE_URL}/m2m/token`;
const MULTISET_QUERY_URL = `${MULTISET_BASE_URL}/vps/map/query-form`;
const MULTISET_MAP_DETAILS_URL = `${MULTISET_BASE_URL}/vps/map`;
const MULTISET_MAP_SET_DETAILS_URL = `${MULTISET_BASE_URL}/vps/map-set`;
const MULTISET_FILE_URL = `${MULTISET_BASE_URL}/file`;

function getServerCredentials() {
  return {
    clientId: process.env.MULTISET_CLIENT_ID,
    clientSecret: process.env.MULTISET_CLIENT_SECRET,
  };
}

function getBearerHeader(req) {
  const header = req.get("authorization");
  if (!header) return null;
  return header;
}

function forwardStatus(res, response, fallbackMessage) {
  return res.status(response.status).json({
    message: fallbackMessage,
  });
}

router.post("/token", async (req, res, next) => {
  try {
    const { clientId, clientSecret } = getServerCredentials();

    if (!clientId || !clientSecret) {
      return res.status(503).json({
        message: "Multiset credentials are not configured on the server.",
      });
    }

    const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(MULTISET_AUTH_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicToken}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      return forwardStatus(res, response, "Multiset authorization failed.");
    }

    const token = body.token || body.access_token;
    if (!token) {
      return res.status(502).json({
        message: "Multiset authorization returned no token.",
      });
    }

    return res.json({ token });
  } catch (error) {
    return next(error);
  }
});

router.post("/query-form", upload.single("queryImage"), async (req, res, next) => {
  try {
    const authorization = getBearerHeader(req);
    if (!authorization) {
      return res.status(401).json({ message: "Missing Multiset access token." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Missing queryImage file." });
    }

    const formData = new FormData();
    Object.entries(req.body || {}).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, String(item)));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const blob = new Blob([req.file.buffer], {
      type: req.file.mimetype || "image/jpeg",
    });
    formData.append("queryImage", blob, req.file.originalname || "query.jpg");

    const response = await fetch(MULTISET_QUERY_URL, {
      method: "POST",
      headers: { authorization },
      body: formData,
    });

    const body = await response.json().catch(() => ({}));
    return res.status(response.status).json(body);
  } catch (error) {
    return next(error);
  }
});

router.get("/map/:mapId", async (req, res, next) => {
  try {
    const authorization = getBearerHeader(req);
    if (!authorization) {
      return res.status(401).json({ message: "Missing Multiset access token." });
    }

    const response = await fetch(
      `${MULTISET_MAP_DETAILS_URL}/${encodeURIComponent(req.params.mapId)}`,
      { headers: { authorization } },
    );
    const body = await response.json().catch(() => ({}));
    return res.status(response.status).json(body);
  } catch (error) {
    return next(error);
  }
});

router.get("/map-set/:mapSetId", async (req, res, next) => {
  try {
    const authorization = getBearerHeader(req);
    if (!authorization) {
      return res.status(401).json({ message: "Missing Multiset access token." });
    }

    const response = await fetch(
      `${MULTISET_MAP_SET_DETAILS_URL}/${encodeURIComponent(req.params.mapSetId)}`,
      { headers: { authorization } },
    );
    const body = await response.json().catch(() => ({}));
    return res.status(response.status).json(body);
  } catch (error) {
    return next(error);
  }
});

router.get("/file", async (req, res, next) => {
  try {
    const authorization = getBearerHeader(req);
    const key = req.query.key;

    if (!authorization) {
      return res.status(401).json({ message: "Missing Multiset access token." });
    }
    if (!key) {
      return res.status(400).json({ message: "Missing file key." });
    }

    const response = await fetch(
      `${MULTISET_FILE_URL}?key=${encodeURIComponent(String(key))}`,
      { headers: { authorization } },
    );
    const body = await response.json().catch(() => ({}));
    return res.status(response.status).json(body);
  } catch (error) {
    return next(error);
  }
});

export default router;
