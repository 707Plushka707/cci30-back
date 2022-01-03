const {
    getBinanceAccountInfo,
    getAllHistoryOfTheDay,
    accountSnapshot,
} = require('./binance');
const { getCCi30Info } = require('./constituents');
const { getAllUsers } = require('./auth');
const { Spot } = require('@binance/connector');
const moment = require('moment');
const BtcPriceHistory = require('../models/BtcPriceHistory');
const AccountSnapshot = require('../models/AccountSnapshot');
const User = require('../models/User');

const isInArray = async (arrayToCkeck, assetToCheck) => {
    let arr = arrayToCkeck;

    return arr.some(function (a) {
        return a.asset === assetToCheck;
    });
}

// Get all order history
exports.getOrdersHistory = async () => {
    try {
        // Variables
        let allUsers;
        let walletConstituents;
        let orderHistory;

        const callPromises = await Promise.all([
            // 1. Get all users from DB
            getAllUsers()
        ]);

        allUsers = callPromises[0];

        // 2. Loop through all users and rebalance their wallet
        await allUsers.map(async (u, i) => {
            // Inner variables for each user 
            let apiKey = u.apiKey;
            let secureKey = u.secureKey;
            let combinedConsituents = [];

            // 3. Get Binance wallet info
            walletConstituents = await getBinanceAccountInfo(apiKey, secureKey);

            // 4. Loop though all assets inside client wallet
            Promise.all(walletConstituents.map(async (t) => {
                if (t.asset != "USDT") {
                    combinedConsituents.push(t);
                }

                return combinedConsituents;
            }))

            let end = moment(new Date()).utcOffset('+0000').format("x");
            let start = moment(end, "x").subtract(270, 'minutes').format("x");

            // 5. Get order history of merged assets
            await getAllHistoryOfTheDay(combinedConsituents, u, start, end, "Other")
        })
    } catch (error) {
        console.log("ERROR in order history file: ", error)
    }
}

// Get snapshot of yesterday's account 
// Run this evryday
exports.getAccountSnaphot = async (req, res, next) => {
    try {
        // Variables
        let allUsers;
        let accountSnapshotDetail;
        let yesterdayDate = moment(new Date()).utcOffset('+0000').subtract(1, 'day').format("DD/MM/YYYY");
        let start;
        let end;

        // Convert start and end minutes to milliseconds and at 23:58:59 and 23:59:59
        start = moment(yesterdayDate + " 00:00:00", "DD/MM/YYYY HH:mm:ss").utcOffset('+0000').format("x")
        end = moment(yesterdayDate + " 23:59:59", "DD/MM/YYYY HH:mm:ss").utcOffset('+0000').format("x")

        const callPromises = await Promise.all([
            // 1. Get all users from DB
            getAllUsers()
        ]);

        allUsers = callPromises[0];

        await allUsers.map(async (u, i) => {
            // Inner variables for each user 
            let apiKey = u.apiKey;
            let secureKey = u.secureKey;

            accountSnapshotDetail = await accountSnapshot(apiKey, secureKey, start, end);

            await AccountSnapshot.create({
                uid: u._id,
                date: yesterdayDate,
                totalAssetOfBtc: accountSnapshotDetail.totalAssetOfBtc,
                balances: accountSnapshotDetail.balances
            })
        })

        res.status(201).json({
            success: true,
            message: "Account snapshot successfully added!"
        })
    } catch (error) {
        console.log("ERROR in history.js snapshot: ", error)
    }
}

// Get BTCUSDT and BTCEUR price between 22:59:59 and 23:59:59 of yesterday
// Run this everyday
exports.getYesterdayPrice = async (req, res, next) => {
    try {
        // Variables
        const currencies = ['USDT', 'EUR'];
        let yesterdayDate = moment(new Date()).utcOffset('+0000').subtract(1, 'day').format("DD/MM/YYYY");
        let start;
        let end;

        // Connect to Binance account
        const client = new Spot(process.env.API_KEY, process.env.SECRET_KEY);

        // Convert start and end minutes to milliseconds and at 23:58:59 and 23:59:59
        start = moment(yesterdayDate + " 23:58:59", "DD/MM/YYYY HH:mm:ss").utcOffset('+0000').format("x")
        end = moment(yesterdayDate + " 23:59:59", "DD/MM/YYYY HH:mm:ss").utcOffset('+0000').format("x")

        // Get prices for BTCUSDT and BTCEUR
        currencies.map(async (c) => {
            await client.aggTrades(`BTC${c}`, {
                startTime: start,
                endTime: end
            })
                .then(async (response) => {
                    // Insert into DB
                    await BtcPriceHistory.create({
                        date: yesterdayDate,
                        currency: c,
                        price: Number(response.data[Object.keys(response.data)[0]].p)
                    })
                })
                .catch(error => client.logger.error(error.message))
        })

        setTimeout(() => {
            res.status(201).json({
                success: true,
                message: "BTC prices added successfully"
            })
        }, 3000);
    } catch (error) {
        console.log("ERROR in history.js price: ", error)

        res.status(400).json({
            success: false,
            message: `ERROR in history.js price: ${error}`
        })
    }
}