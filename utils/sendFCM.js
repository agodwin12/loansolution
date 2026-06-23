const axios = require("axios");

const sendPushNotification = async (fcmToken, title, body) => {
    try {
        const payload = {
            to: fcmToken,
            notification: {
                title,
                body,
            },
            data: {
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
        };

        await axios.post("https://fcm.googleapis.com/fcm/send", payload, {
            headers: {
                Authorization: `key=${process.env.FCM_SERVER_KEY}`,
                "Content-Type": "application/json",
            },
        });

        console.log(`✅ Notification sent to ${fcmToken}`);
    } catch (error) {
        console.error("❌ FCM Error:", error.response?.data || error.message);
    }
};

module.exports = { sendPushNotification };
