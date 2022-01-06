const express = require('express');
const { getMarketCap } = require("../controller/coinMarketCap");

const router = express.Router();

router.get("/marketcap", getMarketCap);

module.exports = router;