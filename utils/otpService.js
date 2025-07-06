const { Otp } = require('../models');
const { sendSMS, sendEmail } = require('./clicksend');

function generateOtp() {
    return (Math.floor(100000 + Math.random() * 900000)).toString();
}

async function createAndSendOtp(user, type, transaction) {
    const code = generateOtp();

    await Otp.create({
        user_id: user.id,
        code,
        expires_at: new Date(Date.now() + 5 * 60 * 1000), // expires in 5 minutes
        type,
        verified: false,
    }, { transaction });

    // TODO: actually send SMS or email via ClickSend
    console.log(`Mock sending OTP ${code} to user ${user.phone}`);

    return code;
}

async function verifyOtp(userId, type, code) {
    const otp = await Otp.findOne({
        where: {
            user_id: userId,
            type,
            code,
            verified: false
        }
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

module.exports = { createAndSendOtp, verifyOtp };
