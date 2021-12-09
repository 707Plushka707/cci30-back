const express = require('express');
const { getAllUSDTPairs } = require("../controller/binance");

const router = express.Router();

router.get("/usdtpairs", getAllUSDTPairs);
/*router.get("/accountInfo", getAccountInfo);
router.get("/accountInfo2", binanceNPM);
router.get("/accountInfo3", binanceConnector);*/

module.exports = router;