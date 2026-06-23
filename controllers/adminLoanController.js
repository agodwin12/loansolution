const { Loan, User, Wallet } = require('../models');
const bcrypt = require("bcryptjs");
const { sendPushNotification } = require('../utils/sendFCM');

exports.getPendingLoans = async (req, res) => {
    try {
        console.log("🔎 Fetching pending loans...");

        const loans = await Loan.findAll({
            where: {
                status: "pending",
            },
            attributes: [
                "id",
                "amount",
                "total_payable",
                "reason",
                "return_date",
                "status",
                "wallet_id",
                "user_id",
            ],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name", "phone", "profile_image_url"],

                },
            ],
        });

        console.log("✅ Pending loans fetched:", loans.map(l => l.toJSON()));

        res.json({ loans });
    } catch (e) {
        console.error("❌ Error fetching pending loans:", e);
        res.status(500).json({
            message: "Failed to fetch pending loans.",
        });
    }
};





exports.approveLoan = async (req, res) => {
    try {
        const loanId = req.params.id;
        console.log(`🔎 Approving loan with ID: ${loanId}`);

        const loan = await Loan.findByPk(loanId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'fcm_token'],
                },
                {
                    model: Wallet,
                    as: 'wallet',
                },
            ],
        });

        if (!loan) {
            console.log("⚠️ Loan not found.");
            return res.status(404).json({ message: "Loan not found." });
        }

        console.log("✅ Loan found:", loan.toJSON());

        if (loan.status !== 'pending' && loan.status !== 'processing') {
            console.log(`⚠️ Loan status is ${loan.status}. Cannot approve.`);
            return res.status(400).json({ message: "Loan is not pending or processing." });
        }

        // Update loan status
        loan.status = 'approved';
        await loan.save();
        console.log("✅ Loan status updated to approved.");

        // Update wallet balance
        const wallet = loan.wallet;
        wallet.balance += loan.amount;
        await wallet.save();
        console.log(`✅ Wallet balance updated. New balance: ${wallet.balance}`);

        // Send push notification
        const user = loan.user;
        if (user?.fcm_token) {
            console.log(`📲 Sending notification to user ID ${user.id} with token: ${user.fcm_token}`);

            await sendPushNotification(
                user.fcm_token,
                'Loan Approved ✅',
                `Your loan of ${loan.amount} has been approved and credited to your wallet.`
            );

            console.log("✅ Push notification sent.");
        } else {
            console.log("⚠️ User has no FCM token. Notification not sent.");
        }

        return res.json({
            message: "Loan approved successfully.",
            wallet,
            loan,
        });

    } catch (e) {
        console.error("❌ Error approving loan:", e);
        return res.status(500).json({ message: "Failed to approve loan.", error: e.message });
    }
};


exports.rejectLoan = async (req, res) => {
    try {
        const loanId = req.params.id;
        const { rejection_reason } = req.body;

        console.log(`🔎 Rejecting loan with ID: ${loanId}`);
        console.log("Rejection reason:", rejection_reason);

        const loan = await Loan.findByPk(loanId);
        console.log("✅ Loan found:", loan?.toJSON());

        if (!loan) {
            console.log("⚠️ Loan not found.");
            return res.status(404).json({ message: "Loan not found." });
        }

        loan.status = 'rejected';
        loan.rejection_reason = rejection_reason || null;
        await loan.save();

        console.log("✅ Loan rejected successfully.");

        res.json({ message: "Loan rejected successfully." });
    } catch (e) {
        console.error("❌ Error rejecting loan:", e);
        res.status(500).json({ message: "Failed to reject loan." });
    }
};

exports.processingLoan = async (req, res) => {
    try {
        const loanId = req.params.id;
        console.log(`🔎 Marking loan as processing. Loan ID: ${loanId}`);

        const loan = await Loan.findByPk(loanId);
        console.log("✅ Loan found:", loan?.toJSON());

        if (!loan) {
            console.log("⚠️ Loan not found.");
            return res.status(404).json({ message: "Loan not found." });
        }

        loan.status = 'processing';
        await loan.save();

        console.log("✅ Loan marked as processing.");

        res.json({ message: "Loan marked as processing." });
    } catch (e) {
        console.error("❌ Error marking loan as processing:", e);
        res.status(500).json({ message: "Failed to mark loan as processing." });
    }
};


