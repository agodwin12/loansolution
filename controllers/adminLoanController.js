const { Loan, User, Wallet } = require('../models');
const bcrypt = require("bcryptjs");


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

        const loan = await Loan.findByPk(loanId);
        console.log("✅ Loan found:", loan?.toJSON());

        if (!loan) {
            console.log("⚠️ Loan not found.");
            return res.status(404).json({ message: "Loan not found." });
        }

        if (loan.status !== 'pending' && loan.status !== 'processing') {
            console.log(`⚠️ Loan status is ${loan.status}. Cannot approve.`);
            return res.status(400).json({ message: "Loan is not pending or processing." });
        }

        loan.status = 'approved';
        await loan.save();
        console.log("✅ Loan status updated to approved.");

        const wallet = await loan.getWallet();
        console.log("✅ Wallet fetched:", wallet?.toJSON());

        wallet.balance += loan.amount;
        await wallet.save();
        console.log(`✅ Wallet balance updated. New balance: ${wallet.balance}`);

        res.json({
            message: "Loan approved successfully.",
            wallet,
            loan,
        });
    } catch (e) {
        console.error("❌ Error approving loan:", e);
        res.status(500).json({ message: "Failed to approve loan." });
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


