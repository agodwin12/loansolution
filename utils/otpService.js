const axios = require('axios');
const { Otp } = require('../models');
const logger = require('../utils/logger');

const OTP_EXPIRY_TIME = 5 * 60 * 1000;

const SMS_API_TOKEN = process.env.TECHSOFT_SMS_API_TOKEN;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'PROXYM';

if (!SMS_API_TOKEN) {
    throw new Error(
        '❌ FATAL: TECHSOFT_SMS_API_TOKEN is not set. Add it to your .env file.'
    );
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhoneForSMS(phone) {
    if (!phone) return null;
    return phone.trim().replace(/^\+/, '');
}

async function sendOtpViaTechsoft(phone, code, type) {
    const apiUrl = 'https://app.techsoft-sms.com/api/http/sms/send/';
    const phoneWithoutPlus = normalizePhoneForSMS(phone);

    if (!phoneWithoutPlus) {
        return {
            success: false,
            error: { message: 'User phone number is missing' },
        };
    }

    const payload = {
        api_token: SMS_API_TOKEN,
        recipient: phoneWithoutPlus,
        sender_id: SMS_SENDER_ID,
        type: 'plain',
        message: `Your PROXYM TRACKING OTP is: ${code}. Valid for 5 minutes.`,
    };

    logger.info(`📤 [OtpService] Sending ${type} OTP SMS to ${phoneWithoutPlus}`);

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            timeout: 15000,
            validateStatus: () => true,
        });

        if (response.status >= 200 && response.status < 300) {
            return {
                success: true,
                data: response.data,
            };
        }

        logger.error(`❌ [OtpService] SMS API error ${response.status}:`, response.data);

        return {
            success: false,
            error: {
                status: response.status,
                data: response.data,
            },
        };
    } catch (err) {
        logger.error('❌ [OtpService] SMS request failed:', err.message);

        return {
            success: false,
            error: {
                type: err.code,
                message: err.message,
            },
        };
    }
}

async function createAndSendOtp(user, type, transaction) {
    const code = generateOtp();

    await Otp.create(
        {
            user_id: user.id,
            code,
            expires_at: new Date(Date.now() + OTP_EXPIRY_TIME),
            type,
            verified: false,
        },
        { transaction }
    );

    const smsResult = await sendOtpViaTechsoft(user.phone, code, type);

    if (!smsResult.success) {
        throw new Error('Failed to send OTP SMS');
    }

    logger.info(`✅ [OtpService] OTP sent to user ${user.id}`);

    return code;
}

async function verifyOtp(userId, type, code) {
    const otp = await Otp.findOne({
        where: {
            user_id: userId,
            type,
            code,
            verified: false,
        },
    });

    if (!otp) {
        return false;
    }

    if (otp.expires_at < new Date()) {
        return false;
    }

    otp.verified = true;
    await otp.save();

    return true;
}

module.exports = {
    createAndSendOtp,
    verifyOtp,
};