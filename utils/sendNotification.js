const admin = require("../config/firebase");

const sendNotification = async (token, title, body) => {
    if (!token) throw new Error("FCM token is required");

    const message = {
        notification: { title, body },
        token,
    };

    const response = await admin.messaging().send(message);
    console.log("Notification sent:", response);
    return response;
};

module.exports = sendNotification;