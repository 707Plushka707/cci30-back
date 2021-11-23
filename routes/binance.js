const express = require('express');
const { getAccountInfo, binanceNPM, binanceConnector } = require("../controller/binance");

const router = express.Router();

router.get("/accountInfo", getAccountInfo);
router.get("/accountInfo2", binanceNPM);
router.get("/accountInfo3", binanceConnector);

module.exports = router;