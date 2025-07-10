const { Loan, User, Wallet, LoanPayment,sequelize } = require('../models');

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



exports.payLoan = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { loanId } = req.params;
        const { user_id, wallet_id, amount } = req.body;

        console.log('==== PAY LOAN ====');
        console.log('Loan ID:', loanId);
        console.log('Amount:', amount);

        // Fetch loan
        const loan = await Loan.findByPk(loanId, { transaction: t });
        if (!loan) {
            await t.rollback();
            return res.status(404).json({ message: 'Loan not found.' });
        }

        if (loan.user_id !== parseInt(user_id)) {
            await t.rollback();
            return res.status(403).json({ message: 'User not authorized for this loan.' });
        }

        if (loan.status !== 'approved') {
            await t.rollback();
            return res.status(400).json({ message: 'Only approved loans can be paid.' });
        }

        if (loan.total_payable <= 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Loan already fully paid.' });
        }

        // Fetch wallet
        const wallet = await Wallet.findOne({
            where: { wallet_id, user_id },
            transaction: t,
        });

        if (!wallet) {
            await t.rollback();
            return res.status(404).json({ message: 'Wallet not found.' });
        }

        if (wallet.balance < amount) {
            await t.rollback();
            return res.status(400).json({
                message: 'Insufficient wallet balance.'
            });
        }

        // Deduct from wallet
        wallet.balance -= amount;
        await wallet.save({ transaction: t });

        // Reduce total_payable
        loan.total_payable -= amount;
        if (loan.total_payable <= 0) {
            loan.total_payable = 0;
            loan.status = 'paid';
        }
        await loan.save({ transaction: t });

        // Record payment
        await LoanPayment.create({
            loan_id: loan.id,
            amount_paid: amount,
            payment_date: new Date(),
        }, { transaction: t });

        await t.commit();

        console.log(`✅ Loan payment processed. New wallet balance: ${wallet.balance}`);

        return res.json({
            message: 'Loan payment successful.',
            loan,
            wallet,
        });

    } catch (error) {
        await t.rollback();
        console.error('PAY LOAN ERROR:', error);
        return res.status(500).json({
            message: 'Failed to pay loan.',
            error: error.message,
        });
    }
};



exports.getUserApprovedLoans = async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('==== GET USER APPROVED LOANS ====');
        console.log('User ID:', userId);

        const loans = await Loan.findAll({
            where: {
                user_id: userId,
                status: 'approved',
            },
            order: [['created_at', 'DESC']],
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
            ],
            limit: 5, // Optional - keep the recent limit
        });

        return res.status(200).json({
            success: true,
            loans,
        });

    } catch (error) {
        console.error('❌ Failed to fetch approved loans:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong.',
            error: error.message,
        });
    }
};
