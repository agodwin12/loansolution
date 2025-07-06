const express = require('express');
const router = express.Router();
const adminLoanController = require('../controllers/adminLoanController');

// GET all pending loans
router.get('/loans/pending', adminLoanController.getPendingLoans);

// PUT approve a loan
router.put('/loans/:id/approve', adminLoanController.approveLoan);

// PUT reject a loan
router.put('/loans/:id/reject', adminLoanController.rejectLoan);

// PUT mark loan as processing
router.put('/loans/:id/processing', adminLoanController.processingLoan);

module.exports = router;
