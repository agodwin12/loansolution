// routes/withdrawalRoutes.js
const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawFromWallet');

router.post('/', withdrawalController.withdrawFromWallet);

module.exports = router;
