const {
    getBinanceAccountInfo,
    getAllHistoryOfTheDay,
    accountSnapshot
} = require('./binance');
const { getCCi30Info } = require('./constituents');

const isInArray = (arrayToCkeck, assetToCheck) => {
    let arr = arrayToCkeck;

    return arr.some(function (a) {
        return a.asset === assetToCheck;
    });
}

exports.getOrdersHistory = async () => {
    try {
        // Variables
        let cci30Constituents;
        let walletConstituents;
        let combinedConsituents = [];

        // 1. Get all constituents of CCi30
        await getCCi30Info()
            .then(async (cci30details) => {
                cci30Constituents = cci30details;

                // 2. Get wallet constituents
                await getBinanceAccountInfo(process.env.API_KEY, process.env.SECRET_KEY)
                    .then(async (clientwallet) => {
                        walletConstituents = clientwallet;

                        // 3. Merge CCi30 and wallet assets
                        let tempArr = [...cci30Constituents, ...walletConstituents];

                        tempArr.map(async (t) => {
                            if (t.asset != "USDT" && await isInArray(combinedConsituents, t.asset) == false) {
                                combinedConsituents.push(t);
                            }
                        })
                    })

                // 4. Get order history of merged assets
                await getAllHistoryOfTheDay(combinedConsituents)
                    .then(async (history) => {
                        // Send directly into DB
                        console.log("LIST HISTORY: ", history);
                    })
            })
    } catch (error) {
        console.log("ERROR in order history file: ", error)
    }
}

exports.getAccountSnaphot = async () => {
    try {
        let test = await accountSnapshot();
        console.log("TEST: ", test);

    } catch (error) {
        console.log("ERROR in history.js snapshot: ", error)
    }
}