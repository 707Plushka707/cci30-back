const express = require('express');
const { getAllUSDTPairs, depositInfo, getOpenOrdersList, convertToBnb } = require("../controller/binance");

const router = express.Router();

router.get("/usdtpairs", getAllUSDTPairs);
router.get("/depositinfo", depositInfo);
router.get("/openorders", getOpenOrdersList);
router.get("/converttobnb", convertToBnb);
/*router.get("/accountInfo", getAccountInfo);
router.get("/accountInfo2", binanceNPM);
router.get("/accountInfo3", binanceConnector);*/

module.exports = router;