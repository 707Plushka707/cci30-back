const express = require('express');
const { getBTCrebalancing } = require("../controller/rebalancing");

const router = express.Router();

router.get("/tobtc", getBTCrebalancing);

module.exports = router;