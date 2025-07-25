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


// PUT /api/user/:id (update profile)
router.put("/user/:id", upload.single("profile_image"), authController.updateProfile);


router.get("/user/:id/documents", authController.getUserDocuments);


module.exports = router;
