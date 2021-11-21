require('dotenv-extended').load()
const {
    getAuthToken,
    getSpreadSheetValues
} = require('./googleSheetsService.js');
const axios = require('axios');

const spreadsheetId = process.env.WEIGHT_SHEET_ID;
const sheetName = process.env.WEIGHT_SHEET_NAME;

// 1. Get weight of each constituent from Google Sheets
// 2. Fetch market cap of the laters from CoinMarketCap
// 3. Display value

exports.getConstituents = async (req, res, next) => {
    let constituentsInfoArray = [];
    let stringID = "";

    try {
        // Get all constituents name from Google Sheet
        const auth = await getAuthToken();
        const responseGS = await getSpreadSheetValues({
            spreadsheetId,
            sheetName,
            auth
        })

        // Concat all slug name from GS to be used as params in CMC api call
        for (let i = 0; i < 30; i++) {
            if (i == 0) {
                stringID = stringID + responseGS.data.values[i][1]
            } else {
                stringID = stringID + "," + responseGS.data.values[i][1]
            }
        }

        // Call CMC api to get info about each crypto
        const responseCMC = await axios.get(
            `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?slug=${stringID}&convert=USD`, {
            headers: {
                "X-CMC_PRO_API_KEY": "b5e46811-a2dd-45e9-a06a-34f43326860b"
            }
        })

        // Create the final array to send to frontend
        // 1. Array array based on GS rank
        // 2. Get all elements corresoinding to this crypto from CMC
        for (let i = 0; i < 30; i++) {
            Object.keys(responseCMC.data.data).map((key, index) => {
                if (responseGS.data.values[i][1] == responseCMC.data.data[key].slug) {
                    let market_cap_constituent;

                    Object.keys(responseCMC.data.data[key].quote).map((k, i) => {
                        market_cap_constituent = responseCMC.data.data[key].quote[k].market_cap;
                    })

                    // Format oebject to be pushed inside array of constituents
                    let tempObject = {
                        rank: i + 1,
                        slug: responseGS.data.values[i][1],
                        symbol: responseCMC.data.data[key].symbol,
                        name: responseCMC.data.data[key].name,
                        market_cap: market_cap_constituent,
                    }

                    constituentsInfoArray.push(tempObject);
                }
            })
        }

        res.status(200).json(constituentsInfoArray);
    } catch (error) {
        console.log(error.message, error.stack);
    }
}