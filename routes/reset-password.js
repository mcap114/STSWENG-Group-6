const express = require('express');
const router = express.Router();
const path = require('path');
const Password = require('../models/user');

// Session Authenticator
function requireAuth(req, res, next) {
    console.log("Checking authentication...");
    if (req.session.user && req.session.user.authenticated) {
        console.log("User is authenticated. Proceeding...");
        next(); 
    } else {
        console.log("User is not authenticated. Redirecting to login page...");
        res.redirect('/login');
    }
}

// GET request to display Reset-password page
router.get("/", requireAuth, function (req, res) {
    res.sendFile(path.resolve('./views/reset-password.html'));
});

// POST request for password reset
router.post('/', async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'New passwords do not match' });
    }

    try {
        const passwordDoc = await Password.findOne();

        if (!passwordDoc) {
            return res.status(404).json({ message: 'Password document not found' });
        }

        if (oldPassword !== passwordDoc.password) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        passwordDoc.password = newPassword;
        await passwordDoc.save();

        // Password changed successfully
        res.status(200).json({ message: 'Password changed successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
