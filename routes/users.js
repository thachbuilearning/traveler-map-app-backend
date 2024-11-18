const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const passport = require("passport");

require('dotenv').config();

router.use(passport.initialize());
router.use(passport.session());

// REGISTER
router.post("/register", async (req, res) => {
    try {
        // Check if the username or email already exists
        const existingUser = await User.findOne({
            $or: [{ username: req.body.username }, { email: req.body.email }],
        });

        if (existingUser) {
            return res.status(400).json("Username or email already exists");
        }

        // Generate a new password hash
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        // Create a new user
        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
        });

        // Save the new user
        const user = await newUser.save();

        // Respond with the user's ID
        res.status(200).json({ _id: user._id });
    } catch (err) {
        console.error(err);
        res.status(500).json("Internal Server Error");
    }
});

// LOGIN
router.post("/login", async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            return res.status(400).json("Wrong username");
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return res.status(400).json("Wrong password");
        }

        // Save user session
        req.login(user, (err) => {
            if (err) return next(err);
            res.status(200).json({ _id: user._id, username: user.username });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json("Internal Server Error");
    }
});


// Check current user session status
router.get('/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        return res.status(200).json({ user: req.user });
    }
    res.status(401).json({ message: "Not authenticated" });
});

// Logout endpoint
router.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ message: "Logout failed" });
        res.status(200).json({ message: "Logged out successfully" });
    });
});

module.exports = router;