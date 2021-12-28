const express = require('express');
const { getBTCrebalancing, rebalancing } = require("../controller/rebalancing");

const router = express.Router();

//router.get("/tobtc", getBTCrebalancing);
router.get("/rebalancing", rebalancing);

module.exports = router;