const axios = require('axios');

exports.sendSMS = async (to, message) => {
    const username = process.env.CLICKSEND_USERNAME;
    const apiKey = process.env.CLICKSEND_API_KEY;

    const auth = Buffer.from(`${username}:${apiKey}`).toString('base64');

    const response = await axios.post(
        'https://rest.clicksend.com/v3/sms/send',
        {
            messages: [
                {
                    source: 'nodejs',
                    body: message,
                    to: to,
                }
            ]
        },
        {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data;
};
