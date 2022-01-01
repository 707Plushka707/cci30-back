const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');

// Create Schema
const UserSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "Please provide a first name"]
    },
    lastName: {
        type: String,
        required: [true, "Please provide a last name"]
    },
    email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: [true, "Email already exists, please login"],
        match: [
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
            "Please provide a valid email"
        ]
    },
    emailStats: {
        type: String,
        required: [true, "Please provide an email to send stats to"],
        match: [
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
            "Please provide a valid email"
        ]
    },
    password: {
        type: String,
        required: String,
        required: [true, "Please provide a password"],
        minlength: 6,
        select: false
    },
    phone: {
        type: String,
        required: [true, "Please provide a phone number"]
    },
    apiKey: {
        type: String,
        required: [true, "Please provide an API key"]
    },
    secureKey: {
        type: String,
        required: [true, "Please provide a secure key"]
    },
    apiKeyReadOnly: {
        type: String,
        required: [true, "Please provide an API key for read-only access"]
    },
    secureKeyReadOnly: {
        type: String,
        required: [true, "Please provide a secure key for read-only access"]
    },
    apiKeyTransfer: {
        type: String,
    },
    secureKeyTransfer: {
        type: String,
    },
    type: {
        type: String,
        required: [true, "Please provide a user type"],
        default: "user"
    },
    startSubscription: {
        type: String,
        required: [true, "Please provide a subscription start date"]
    },
    subscriptionType: {
        type: String,
        required: [true, "Please provide a subscription type"]
    },
    initialCapital: {
        type: Number,
        required: [true, "Please provide an initial investmeen amount"]
    },
    curerncyCapital: {
        type: String,
        required: [true, "Please provide a currency for your capital"]
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
},
    {
        timestamps: true
    }
);

// Encrypt password before creating the User
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }

    // Hash password to the model before it is saved
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

// Check for matching password on login and DB
UserSchema.methods.matchPasswords = async function (password) {
    return await bcrypt.compare(password, this.password);
};

UserSchema.methods.getSignedToken = function () {
    return jwt.sign(
        {
            id: this._id,
        },
        process.env.JWT_SECRET,
    );
};

UserSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.resetPasswordExpire = Date.now() + 10 * (60 * 1000);

    return resetToken;
};

const User = mongoose.model("User", UserSchema);

module.exports = User;