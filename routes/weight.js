const express = require('express');
const { check } = require('express-validator');
const { getSpreadSheetValues } = require("../controller/weight");

const router = express.Router();

router.get("/weight", getSpreadSheetValues);

module.exports = router;