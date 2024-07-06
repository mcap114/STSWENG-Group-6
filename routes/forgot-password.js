const express = require("express");
const path = require("path");

const router = express.Router();

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

// GET request to display forgot-password page
router.get("/", requireAuth, function (req, res) {
    res.sendFile(path.resolve('./views/forgot-password.html'));
});

module.exports = router;