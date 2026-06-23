// controllers/adminController.js
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Admin, User, Loan, Withdrawal } = require("../models");

exports.registerAdmin = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        const existing = await Admin.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ message: "Email already exists" });
        }

        const hash = await bcrypt.hash(password, 10);

        let imageFilename = null;
        if (req.file) {
            imageFilename = req.file.filename;
        }

        const admin = await Admin.create({
            name,
            email,
            phone,
            profile_image_url: imageFilename,
            password_hash: hash,
            role: role || "admin",
        });

        return res.status(201).json({
            message: "Admin registered successfully",
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                profile_image_url: admin.profile_image_url,
                role: admin.role,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error registering admin" });
    }
};

exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ where: { email } });
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const valid = await bcrypt.compare(password, admin.password_hash);
        if (!valid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                role: admin.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
        );

        return res.json({
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                profile_image_url: admin.profile_image_url,
                role: admin.role,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error logging in admin" });
    }
};



exports.getAdminProfile = async (req, res) => {
    try {
        const adminId = req.params.id;

        console.log(`🔎 Fetching admin profile for admin ID ${adminId}`);

        const admin = await Admin.findByPk(adminId, {
            attributes: [
                "id",
                "name",
                "email",
                "phone",
                "profile_image_url",
                "role",
                "created_at",
                "updated_at"
            ],
        });

        if (!admin) {
            console.log(`❌ Admin not found for id ${adminId}`);
            return res.status(404).json({ message: "Admin not found." });
        }

        console.log("✅ Admin profile found:", admin.toJSON());

        return res.json({ admin });
    } catch (e) {
        console.error("❌ Error fetching admin profile:", e);
        return res.status(500).json({ message: "Failed to fetch admin profile." });
    }
};


exports.createAdmin = async (req, res) => {
    try {
        console.log("🔧 Received body:", req.body);
        console.log("🔧 Received file:", req.file);

        const name = req.body.name;
        const email = req.body.email;
        const phone = req.body.phone;
        const password = req.body.password;
        const role = req.body.role || "admin";

        const profileImage = req.file ? req.file.filename : null;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Check if email already exists
        const existing = await Admin.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: "Admin with this email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await Admin.create({
            name,
            email,
            phone,
            password_hash: hashedPassword,
            profile_image_url: profileImage,
            role
        });

        console.log("✅ New admin created:", newAdmin.toJSON());

        return res.status(201).json({
            message: "Admin account created successfully.",
            admin: newAdmin
        });

    } catch (e) {
        console.error("❌ Error creating admin:", e);
        return res.status(500).json({
            message: "Failed to create admin.",
            error: e.message
        });
    }
};


exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ["id", "name", "email", "phone", "profile_image_url"],
        });
        return res.json({ users });
    } catch (e) {
        console.error("❌ Error fetching users:", e);
        return res.status(500).json({ message: "Error fetching users." });
    }
};

exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.findAll({
            attributes: ["id", "name", "email", "phone", "profile_image_url", "role"],
        });
        return res.json({ admins });
    } catch (e) {
        console.error("❌ Error fetching admins:", e);
        return res.status(500).json({ message: "Error fetching admins." });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "User not found." });

        await user.destroy();
        return res.json({ message: "User deleted successfully." });
    } catch (e) {
        console.error("❌ Error deleting user:", e);
        return res.status(500).json({ message: "Error deleting user." });
    }
};

exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findByPk(id);
        if (!admin) return res.status(404).json({ message: "Admin not found." });

        await admin.destroy();
        return res.json({ message: "Admin deleted successfully." });
    } catch (e) {
        console.error("❌ Error deleting admin:", e);
        return res.status(500).json({ message: "Error deleting admin." });
    }
};


exports.getDashboardStats = async (req, res) => {
    try {
        console.log("🔎 Starting dashboard stats calculation...");

        // 1. Total users
        console.log("➡️ Counting total users...");
        const totalUsers = await User.count();
        console.log("✅ Total users:", totalUsers);

        // 2. Pending loans
        console.log("➡️ Counting pending loans...");
        const pendingLoans = await Loan.count({
            where: { status: 'pending' }
        });
        console.log("✅ Pending loans:", pendingLoans);

        // 3. Approved loans today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        console.log("➡️ Time range for today:");
        console.log("   From:", todayStart.toISOString());
        console.log("   To  :", todayEnd.toISOString());

        const approvedToday = await Loan.count({
            where: {
                status: 'approved',
                updated_at: {
                    [Op.between]: [todayStart, todayEnd],
                }
            }
        });
        console.log("✅ Approved loans today:", approvedToday);

        // 4. Active loans:
        console.log("➡️ Counting active loans...");
        const activeLoans = await Loan.count({
            where: {
                status: {
                    [Op.in]: ['approved', 'processing'],
                },
                return_date: {
                    [Op.gte]: new Date(),
                }
            }
        });
        console.log("✅ Active loans:", activeLoans);

        console.log("✅ Dashboard stats calculated successfully.");

        return res.json({
            totalUsers,
            pendingLoans,
            approvedToday,
            activeLoans
        });

    } catch (e) {
        console.error("❌ Error fetching dashboard stats:", e);
        return res.status(500).json({ message: "Error fetching dashboard stats." });
    }
};



exports.getRecentActivity = async (req, res) => {
    try {
        console.log("📥 Fetching recent activity...");

        const latestUser = await User.findOne({
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'name', 'email', 'phone', 'createdAt'],
        });

        console.log("👤 Latest Registered User:", latestUser);

        const latestApprovedLoan = await Loan.findOne({
            where: { status: 'approved' },
            order: [['updated_at', 'DESC']],
            attributes: ['id', 'amount', 'wallet_id', 'updated_at'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name'],
                },
            ],
        });

        console.log("💰 Latest Approved Loan:", latestApprovedLoan);

        const latestWithdrawal = await Withdrawal.findOne({
            order: [['created_at', 'DESC']],
            attributes: ['id', 'amount', 'wallet_id', 'created_at'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name'],
                },
            ],
        });

        console.log("🏧 Latest Withdrawal:", latestWithdrawal);

        return res.status(200).json({
            latestUser,
            latestApprovedLoan,
            latestWithdrawal,
        });
    } catch (err) {
        console.error("❌ Error fetching recent activity:", err);
        return res.status(500).json({ message: 'Server error' });
    }
};