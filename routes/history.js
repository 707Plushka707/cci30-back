const express = require('express');
const { getOrdersHistory } = require("../controller/history");

const router = express.Router();

router.get("/orders", getOrdersHistory);

module.exports = router;