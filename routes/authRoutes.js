const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../middlewares/upload');

router.post('/signup', upload.fields([
    { name: 'profile', maxCount: 1 },
    { name: 'id_front', maxCount: 1 },
    { name: 'id_back', maxCount: 1 },
]), authController.signup);

router.post('/login', authController.login);

router.post('/verify-otp', authController.verifyOtp);

router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);


module.exports = router;
