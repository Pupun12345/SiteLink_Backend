const express = require("express");
const router = express.Router();
const {
  saveFcmToken,
  sendPushNotification,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} = require("../controllers/pushNotifications");
const { protect, requireAdmin } = require("../middleware/auth");

router.post("/save-token", protect, saveFcmToken);
router.post("/send", protect, requireAdmin, sendPushNotification);

// In-app notification history
router.get("/", protect, getMyNotifications);
router.put("/read-all", protect, markAllNotificationsRead);
router.put("/:id/read", protect, markNotificationRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
