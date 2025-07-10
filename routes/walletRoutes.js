const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

router.get('/:walletId', walletController.getWalletById);

module.exports = router;
