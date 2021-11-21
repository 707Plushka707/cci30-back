const express = require('express');
const { getConstituents } = require("../controller/constituents");

const router = express.Router();

router.get("/all", getConstituents);

module.exports = router;