const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        min: 3,
        max: 30,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        max: 50,
        unique: true,
    },
    password: {
        type: String,
        required: false,
        min: 6,
    },
    // Fields for Google OAuth
    googleId: {
        type: String,
    },
    profilePicture: {
        type: String,
    },
},
    { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
