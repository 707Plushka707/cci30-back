const express = require('express');
const { check } = require('express-validator');
const { getSpreadSheetValues, getSpreadSheetValuesMonthly } = require("../controller/ohlcv");

const router = express.Router();

router.get("/daily", getSpreadSheetValues);
router.get("/monthly", getSpreadSheetValuesMonthly);

module.exports = router;