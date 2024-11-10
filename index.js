const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = express();
const userRoute = require("./routes/users");
const pinRoute = require("./routes/pins");
const cors = require('cors');
const passport = require("passport");
const User = require("./models/User");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");

dotenv.config();
app.use(express.json());
app.use(cors());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

// Define serializeUser and deserializeUser functions
passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB connection to mappin successful!"))
    .catch((err) => {
        console.log(err)
    });

// Google Authentication Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log("Google OAuth callback received");
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    console.log("User not found, creating a new user");
                    user = new User({
                        googleId: profile.id,
                        username: profile.displayName,
                        email: profile.emails[0].value,
                        profilePicture: profile.photos[0].value,
                    });
                    await user.save();
                }

                console.log("Google OAuth callback successful, user:", user);
                return done(null, user);
            } catch (err) {
                console.error("Error in Google OAuth callback:", err);
                return done(err);
            }
        }
    )
);

app.use("/api/users", userRoute);
app.use("/api/pins", pinRoute);

// Route for Google authentication
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/login",
    }),
    (req, res) => {
        // Pass the username to the frontend as a query parameter
        res.redirect(`http://127.0.0.1:5500/frontend/index.html?username=${req.user.username}`);
    }
);

app.listen(8800, () => {
    console.log("Backend server is running on 8800 port!")
});

// Export serializeUser and deserializeUser functions
module.exports = {
    serializeUser: passport.serializeUser,
    deserializeUser: passport.deserializeUser
};