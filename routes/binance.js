const express = require('express');
const { getAllUSDTPairs, depositInfo } = require("../controller/binance");

const router = express.Router();

router.get("/usdtpairs", getAllUSDTPairs);
router.get("/depositinfo", depositInfo);
/*router.get("/accountInfo", getAccountInfo);
router.get("/accountInfo2", binanceNPM);
router.get("/accountInfo3", binanceConnector);*/

module.exports = router;