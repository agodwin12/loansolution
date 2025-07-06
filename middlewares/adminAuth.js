// middleware/adminAuth.js
const jwt = require('jsonwebtoken');

exports.verifyAdmin = (req, res, next) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        req.admin = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};
