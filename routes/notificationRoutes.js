const express = require("express");
const router = express.Router();
const { saveFcmToken, sendPushNotification } = require("../controllers/pushNotifications");
const { protect } = require("../middleware/auth");

router.post("/save-token", protect, saveFcmToken);
router.post("/send", protect, sendPushNotification);

module.exports = router;
