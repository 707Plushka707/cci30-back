const express = require('express');
const { register, login, forgotpassword, resetpassword, getAllUsers } = require("../controller/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
//router.get("/allusers", getAllUsers);

module.exports = router;