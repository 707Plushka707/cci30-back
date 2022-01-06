const axios = require('axios');
const MarketCap = require('../models/MarketCap');
const moment = require('moment');

exports.getMarketCap = async (req, res, next) => {
    try {
        // Variables
        let marketCap = [];

        // Fetch top 100 market caps from coinmarketcap
        await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=100&convert=USD`, {
            headers: {
                "X-CMC_PRO_API_KEY": process.env.COINMARKETCAP_APIKEY,
                "Accept": "application/json"
            }
        }).then(async (data) => {
            console.log(data.data.data);

            await data.data.data.map(async (d) => {
                let tempObj = {
                    asset: d.symbol,
                    name: d.name,
                    slug: d.slug,
                    tags: d.tags,
                    cmc_rank: d.cmc_rank,
                    market_cap: d.quote.USD.market_cap
                }

                marketCap.push(tempObj);
            })

            await MarketCap.create({
                date: moment(new Date()).utcOffset('+0000').format("DD/MM/YYYY HH:mm:ss"),
                marketCaps: marketCap
            })

        })

        res.status(201).json({
            success: true,
            data: {
                date: moment(new Date()).utcOffset('+0000').format("DD/MM/YYYY HH:mm:ss"),
                marketCaps: marketCap
            }
        })
    } catch (error) {
        console.log("ERROR IN GET MARKET CAP: ", error)
    }
}