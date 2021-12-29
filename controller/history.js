const {
    getBinanceAccountInfo,
    getAllHistoryOfTheDay,
    accountSnapshot
} = require('./binance');
const { getCCi30Info } = require('./constituents');
const { getAllUsers } = require('./auth');

const isInArray = async (arrayToCkeck, assetToCheck) => {
    let arr = arrayToCkeck;

    return arr.some(function (a) {
        return a.asset === assetToCheck;
    });
}

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

            // 5. Get order history of merged assets
            orderHistory = await getAllHistoryOfTheDay(apiKey, secureKey, combinedConsituents)
            console.log(`ORDER HISTORY LIST OF ${u.lastName}: ${orderHistory}`);
        })


        // 1. Get all constituents of CCi30
        /*await getCCi30Info()
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
            })*/
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