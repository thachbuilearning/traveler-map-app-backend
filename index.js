const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = express();
const userRoute = require("./routes/users");
const pinRoute = require("./routes/pins");
const cors = require('cors');
const passport = require("passport");
const User = require("./models/User");
const session = require("express-session");

dotenv.config();
app.use(express.json());
// app.use(cors());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
    origin: 'https://traveler-map-app-test.netlify.app',
    credentials: true,
}));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "https://traveler-map-app-test.netlify.app");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
});


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



app.use("/api/users", userRoute);
app.use("/api/pins", pinRoute);

// Endpoint to save user data
app.post("/api/users", async (req, res) => {
    const { username, email, profilePicture } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            // Create a new user if not already in database
            user = new User({ username, email, profilePicture });
            await user.save();
            console.log("New user created:", user);
        } else {
            console.log("User already exists:", user);
        }
        res.status(200).json(user);
    } catch (err) {
        console.error("Error saving user data:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(8800, () => {
    console.log("Backend server is running on 8800 port!")
});

// Export serializeUser and deserializeUser functions
module.exports = {
    serializeUser: passport.serializeUser,
    deserializeUser: passport.deserializeUser
};