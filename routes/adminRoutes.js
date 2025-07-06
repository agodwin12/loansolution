// routes/adminRoutes.js

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const multer = require("multer");

// Configure multer for profile image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
const upload = multer({ storage });

// Register & login routes
router.post("/register", upload.single("profile"), adminController.registerAdmin);
router.post("/login", adminController.loginAdmin);

// Fetch admin profile
router.get('/profile/:id', adminController.getAdminProfile);

// ✅ Fix: connect multer middleware here
router.post('/create', upload.single("profile_image"), adminController.createAdmin);


router.get("/users", adminController.getAllUsers);


router.get("/admins", adminController.getAllAdmins);


router.delete("/users/:id", adminController.deleteUser);


router.delete("/admins/:id", adminController.deleteAdmin);

router.get("/dashboard-stats", adminController.getDashboardStats);

router.get('/dashboard-stats', adminController.getDashboardStats);


module.exports = router;
