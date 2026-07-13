const express = require("express");
const router = express.Router();
const { saveFcmToken, sendPushNotification } = require("../controllers/pushNotifications");
const { protect, requireAdmin } = require("../middleware/auth");

router.post("/save-token", protect, saveFcmToken);
router.post("/send", protect, requireAdmin, sendPushNotification);

module.exports = router;
