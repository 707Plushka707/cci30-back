const express = require('express');
const { getOrdersHistory, getAccountSnaphot, getYesterdayPrice } = require("../controller/history");

const router = express.Router();

router.get("/orders", getOrdersHistory);
router.get("/snapshot", getAccountSnaphot);
router.get("/price", getYesterdayPrice);

module.exports = router;