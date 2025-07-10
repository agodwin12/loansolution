// routes/loanRoutes.js

const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

// User requests loan
router.post('/request', loanController.requestLoan);

// Admin approves loan
router.post('/:loanId/approve', loanController.approveLoan);

// Admin rejects loan
router.post('/:loanId/reject', loanController.rejectLoan);

router.get('/user/:userId/recent', loanController.getUserRecentLoans);

router.get('/user/:userId', loanController.getUserLoans);

//pay
router.post('/:loanId/pay', loanController.payLoan);

router.get('/user/:userId/approved', loanController.getUserApprovedLoans);


module.exports = router;
