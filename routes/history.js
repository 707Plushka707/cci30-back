const express = require('express');
const { getOrdersHistory, getAccountSnaphot } = require("../controller/history");

const router = express.Router();

router.get("/orders", getOrdersHistory);
router.get("/snapshot", getAccountSnaphot);

module.exports = router;