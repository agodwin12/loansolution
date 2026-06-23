require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./models');

const authRoutes = require('./routes/authRoutes');
const loanRoutes = require('./routes/loanRoutes');
const adminRoutes = require("./routes/adminRoutes");
const adminLoanRoutes = require('./routes/adminLoanRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/admin', adminLoanRoutes);
app.use('/api/wallets', require('./routes/walletRoutes'));
app.use('/api/withdraw', withdrawalRoutes);

// Sync database and start server
// Sync database and start server
db.sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connected!');

        const PORT = process.env.PORT || 7050;

        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Failed to sync database:', err);
    });