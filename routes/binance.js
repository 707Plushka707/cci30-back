const express = require('express');
const { getAllUSDTPairs, depositInfo, getOpenOrdersList, convertToBnb, getOpenOrdersListApi, getAllHistoryOfTheDayApi, getYesterdayBTCPrice, makeWithdrawalBnbNetwork,
    allCoinsInfo } = require("../controller/binance");

const router = express.Router();

router.get("/usdtpairs", getAllUSDTPairs);
router.get("/depositinfo", depositInfo);
router.get("/openorders", getOpenOrdersList);
router.get('/openordersapi', getOpenOrdersListApi);
router.get("/converttobnb", convertToBnb);
router.get("/dayhistoryapi", getAllHistoryOfTheDayApi);
router.get("/btccurrencyprice", getYesterdayBTCPrice);
router.get("/withdrawal", makeWithdrawalBnbNetwork);
router.get("/coinInfo", allCoinsInfo);
/*router.get("/accountInfo", getAccountInfo);
router.get("/accountInfo2", binanceNPM);
router.get("/accountInfo3", binanceConnector);*/

module.exports = router;