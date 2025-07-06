const { Loan, User, Wallet, sequelize } = require('../models');

exports.requestLoan = async (req, res) => {
    try {
        const {
            user_id,
            wallet_id,
            amount,
            interest_amount,
            total_payable,
            reason,
            return_date,
        } = req.body;

        console.log('==== LOAN REQUEST ATTEMPT ====');
        console.log('Payload:', req.body);

        const loan = await Loan.create({
            user_id,
            wallet_id,
            amount,
            interest_amount,
            total_payable,
            reason,
            return_date,
            status: 'pending',
        });

        return res.status(201).json({
            message: 'Loan request submitted and pending approval.',
            loan,
        });

    } catch (error) {
        console.error('REQUEST LOAN ERROR:', error);
        return res.status(500).json({
            message: 'Loan request failed.',
            error: error.message,
        });
    }
};

exports.approveLoan = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { loanId } = req.params;

        console.log('==== APPROVE LOAN ====');
        console.log('Loan ID:', loanId);

        const loan = await Loan.findByPk(loanId, { transaction: t });
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found.' });
        }

        if (loan.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending loans can be approved.' });
        }

        // Find user wallet
        const wallet = await Wallet.findOne({
            where: { wallet_id: loan.wallet_id }
        });

        if (!wallet) {
            return res.status(404).json({ message: 'User wallet not found.' });
        }

        // Update loan
        loan.status = 'approved';
        await loan.save({ transaction: t });

        // Update wallet balance
        wallet.balance += loan.amount;
        await wallet.save({ transaction: t });

        await t.commit();

        console.log(`✅ Loan approved. New wallet balance: ${wallet.balance}`);

        return res.json({
            message: 'Loan approved and amount added to user wallet.',
            loan,
            wallet,
        });

    } catch (error) {
        await t.rollback();
        console.error('APPROVE LOAN ERROR:', error);
        return res.status(500).json({
            message: 'Failed to approve loan.',
            error: error.message,
        });
    }
};

exports.rejectLoan = async (req, res) => {
    try {
        const { loanId } = req.params;
        const { rejection_reason } = req.body;

        console.log('==== REJECT LOAN ====');
        console.log('Loan ID:', loanId, 'Reason:', rejection_reason);

        const loan = await Loan.findByPk(loanId);
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found.' });
        }

        if (loan.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending loans can be rejected.' });
        }

        loan.status = 'rejected';
        loan.rejection_reason = rejection_reason;
        await loan.save();

        console.log('✅ Loan rejected.');

        return res.json({
            message: 'Loan rejected successfully.',
            loan,
        });

    } catch (error) {
        console.error('REJECT LOAN ERROR:', error);
        return res.status(500).json({
            message: 'Failed to reject loan.',
            error: error.message,
        });
    }
};

exports.getUserLoans = async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('==== GET USER LOANS ====');
        console.log('User ID:', userId);

        const loans = await Loan.findAll({
            where: { user_id: userId },
            order: [['createdAt', 'DESC']],
        });

        return res.json({
            message: 'Loans fetched successfully.',
            loans,
        });

    } catch (error) {
        console.error('GET USER LOANS ERROR:', error);
        return res.status(500).json({
            message: 'Failed to fetch loans.',
            error: error.message,
        });
    }
};

exports.getUserRecentLoans = async (req, res) => {
    try {
        const userId = req.params.userId;

        const loans = await Loan.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit: 5,
            attributes: [
                'id',
                'wallet_id',
                'amount',
                'interest_amount',
                'total_payable',
                'reason',
                'return_date',
                'status',
                'created_at'
            ]
        });

        return res.status(200).json({
            success: true,
            loans,
        });
    } catch (error) {
        console.error('❌ Failed to fetch loans:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong.',
        });
    }
};
