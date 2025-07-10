// controllers/withdrawalController.js
const { Wallet, Withdrawal, User } = require('../models');

exports.withdrawFromWallet = async (req, res) => {
    try {
        const { user_id, wallet_id, amount } = req.body;

        if (!user_id || !wallet_id || !amount) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Find wallet
        const wallet = await Wallet.findOne({ where: { wallet_id, user_id } });
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        if (wallet.balance < amount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // Simulate withdrawal: deduct from wallet
        wallet.balance -= amount;
        await wallet.save();

        // Log the withdrawal
        const withdrawal = await Withdrawal.create({
            user_id,
            wallet_id,
            amount,
            status: "processed",
        });

        return res.status(200).json({
            message: "Withdrawal successful",
            withdrawal,
            new_balance: wallet.balance,
        });
    } catch (error) {
        console.error("💥 Withdrawal error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
