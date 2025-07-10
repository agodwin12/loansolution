const { Wallet } = require('../models');

exports.getWalletById = async (req, res) => {
    try {
        const { walletId } = req.params;

        const wallet = await Wallet.findOne({
            where: { wallet_id: walletId }
        });

        if (!wallet) {
            return res.status(404).json({
                message: 'Wallet not found.'
            });
        }

        return res.json({
            success: true,
            wallet,
        });
    } catch (error) {
        console.error('❌ GET WALLET ERROR:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching wallet.',
            error: error.message,
        });
    }
};
