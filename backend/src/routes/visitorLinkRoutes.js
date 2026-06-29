import express from "express";
import VisitorLinkController from "../controllers/VisitorLinkController.js";

const router = express.Router();

router.get("/:token", VisitorLinkController.getByToken);
router.get("/", VisitorLinkController.getAll);

export default router;
