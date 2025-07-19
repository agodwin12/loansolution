const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Wallet, Otp, sequelize, Admin } = require('../models');
const { createAndSendOtp } = require('../utils/otpService');

function generateWalletId() {
    return 'DL-' + Math.floor(100000 + Math.random() * 900000);
}

exports.signup = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        console.log('==== SIGNUP ATTEMPT ====');
        console.log('Request Body:', req.body);
        console.log('Files:', req.files);

        const { name, email, phone, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed.');

        // Create the user
        const newUser = await User.create({
            name,
            email,
            phone,
            password_hash: hashedPassword,
            profile_image_url: req.files?.profile?.[0]?.filename || null,
            id_card_front_url: req.files?.id_front?.[0]?.filename || null,
            id_card_back_url: req.files?.id_back?.[0]?.filename || null,
        }, { transaction: t });

        console.log('New user created:', newUser.id);

        // Create a wallet for the user
        const walletId = generateWalletId();
        const newWallet = await Wallet.create({
            user_id: newUser.id,
            wallet_id: walletId,
            balance: 0.0,
        }, { transaction: t });

        console.log('Wallet created for user:', newWallet.wallet_id);

        // Send OTP
        const otpCode = await createAndSendOtp(newUser, 'phone', t);
        console.log(`OTP ${otpCode} sent to user phone ${phone}`);

        // All good → commit
        await t.commit();

        return res.status(201).json({
            message: 'User and wallet created successfully. OTP sent to phone.',
            user: newUser,
            wallet: newWallet
        });

    } catch (error) {
        console.error('SIGNUP ERROR:', error);
        await t.rollback();
        return res.status(500).json({ message: 'Signup failed', error: error.message });
    }
};

exports.login = async (req, res) => {
    const { loginType, emailOrPhone, password } = req.body;

    try {
        let foundUser = null;
        let userType = null;

        // First try finding as User
        if (loginType === "email") {
            foundUser = await User.findOne({
                where: { email: emailOrPhone },
            });
        } else {
            foundUser = await User.findOne({
                where: { phone: emailOrPhone },
            });
        }

        if (foundUser) {
            userType = "user";
        } else {
            // Try finding as Admin instead
            if (loginType === "email") {
                foundUser = await Admin.findOne({
                    where: { email: emailOrPhone },
                });
            } else {
                foundUser = await Admin.findOne({
                    where: { phone: emailOrPhone },
                });
            }

            if (foundUser) {
                userType = "admin";
            }
        }

        if (!foundUser) {
            return res.status(404).json({
                message: "No account found with these credentials.",
            });
        }

        const storedHash = foundUser.password_hash;

        if (!storedHash) {
            return res.status(500).json({
                message: "User record is missing password hash.",
            });
        }

        const isMatch = bcrypt.compareSync(password, storedHash);

        if (!isMatch) {
            return res.status(401).json({
                message: "Incorrect password.",
            });
        }

        const token = jwt.sign(
            { id: foundUser.id },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "7d" }
        );

        let wallet = null;
        if (userType === "user") {
            wallet = await Wallet.findOne({
                where: { user_id: foundUser.id },
            });
        }

        return res.json({
            message: "Login successful",
            token,
            user: foundUser,
            type: userType,
            wallet,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Server error during login.",
            error: e.message,
        });
    }
};



exports.verifyOtp = async (req, res) => {
    const { userId, type, code } = req.body;

    try {
        console.log('==== VERIFY OTP ATTEMPT ====');
        console.log('Payload:', req.body);

        const verified = await verifyOtp(userId, type, code);
        console.log('OTP verification result:', verified);

        if (!verified) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        res.json({ message: `${type} verified successfully.` });
    } catch (error) {
        console.error('VERIFY OTP ERROR:', error);
        res.status(500).json({ message: 'OTP verification failed.', error: error.message });
    }
};

exports.requestPasswordReset = async (req, res) => {
    const { emailOrPhone, loginType } = req.body;

    try {
        console.log('==== REQUEST PASSWORD RESET ====');
        console.log('Payload:', req.body);

        const user = await User.findOne({
            where:
                loginType === 'email'
                    ? { email: emailOrPhone }
                    : { phone: emailOrPhone },
        });

        if (!user) {
            console.log('User not found for password reset.');
            return res.status(404).json({ message: 'User not found' });
        }

        const otpCode = await createAndSendOtp(user, loginType);
        console.log(`Password reset OTP ${otpCode} sent to user.`);

        res.json({ message: 'OTP sent for password reset.' });
    } catch (error) {
        console.error('REQUEST PASSWORD RESET ERROR:', error);
        res.status(500).json({ message: 'Failed to send OTP.', error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { userId, code, type, newPassword } = req.body;

    try {
        console.log('==== RESET PASSWORD ====');
        console.log('Payload:', req.body);

        const isValid = await verifyOtp(userId, type, code);
        console.log('OTP verification result for password reset:', isValid);

        if (!isValid) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            console.log('User not found for password reset.');
            return res.status(404).json({ message: 'User not found.' });
        }

        user.password_hash = await bcrypt.hash(newPassword, 10);
        await user.save();

        console.log('Password updated successfully for user:', user.id);

        res.json({ message: 'Password reset successfully.' });
    } catch (error) {
        console.error('RESET PASSWORD ERROR:', error);
        res.status(500).json({ message: 'Reset failed.', error: error.message });
    }
};



exports.updateProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, phone } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.name = name || user.name;
        user.phone = phone || user.phone;

        if (req.file) {
            user.profile_image_url = req.file.filename;
        }

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            user,
        });
    } catch (error) {
        console.error("❌ Error updating profile:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



exports.getUserDocuments = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findByPk(userId, {
            attributes: ['id_card_front_url', 'id_card_back_url']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({
            id_card_front_url: user.id_card_front_url ? `/uploads/${user.id_card_front_url}` : null,
            id_card_back_url: user.id_card_back_url ? `/uploads/${user.id_card_back_url}` : null
        });
    } catch (error) {
        console.error("❌ Error fetching user documents:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
