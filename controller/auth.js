const User = require('../models/User');

exports.register = async (req, res, next) => {
    const { firstName, lastName, email, password, phone, apiKey, secureKey } = req.body;

    try {
        const user = await User.create({
            firstName, lastName, email, password, phone, apiKey, secureKey
        })

        sendToken(user, 201, res);
    } catch (error) {
        next(error);
    }
}

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse("Please provide and email and password", 400));
    }

    try {
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return next(new ErrorResponse("Invalid credentials", 401));
        }

        // Check if password matches the one in the DB
        const isMatched = await user.matchPasswords(password);

        if (!isMatched) {
            return next(new ErrorResponse("Invalid credentials", 401));
        }

        // If email and password matches the DB, respond with a token for the user to log in
        sendToken(user, 200, res);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}

exports.getAllUsers = async (req, res, next) => {
    try {
        // Find all user using "type" property
        const users = await User.find({ type: "user" });

        if (!users) {
            return next(new ErrorResponse("No user found", 401));
        }

        // Return all users in MongiDB
        return users;
        //res.status(200).json(users);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}

const sendToken = (user, statusCode, res) => {
    const token = user.getSignedToken();
    res.status(statusCode).json({
        success: true,
        token
    })
}