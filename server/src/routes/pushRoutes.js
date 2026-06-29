import { Router } from "express";

import { publicKey, subscribe, unsubscribe } from "../controllers/pushController.js";

const router = Router();

// All public: notifications are anonymous (everyone who opts in gets alerts).
router.get("/public-key", publicKey);
router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);

export default router;
