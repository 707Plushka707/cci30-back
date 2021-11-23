const crypto = require('crypto');
const axios = require('axios');
const Binance = require('node-binance-api');
const { Spot } = require('@binance/connector');

const params = `recvWindow=10000&timestamp=${Date.now()}`;

const keys = {
    "apiKey": "nylxq2UVd2ui9zxm1PNU3munSh6Zeqw8r8irqo5WjfjQWaRTt4SLEz0aDtSgAFu4",
    "secretKey": "puRD04EUYc7gBp3iq0eDsW7prROI5BRlJYIR5VoIEC97bdLVuaB5LwMxpXCmz9wx"
}

// Get signature
exports.getAccountInfo = async (req, res, next) => {
    try {
        const hashedSignature = crypto
            .createHmac('sha256', "eUzRDZRLKCoS2d3Ttpy6F9mneuOZUuMGHlTW2MYtDZ9qqoCny4SVuHMCAn6ESwGd")
            .update(params)
            .digest('hex');

        const info = await axios.get(
            `https://api.binance.com/api/v3/account?recvWindow=10000&timestamp=${Date.now()}&signature=${hashedSignature}`, {
            headers: {
                "X-MBX-APIKEY": "eUzRDZRLKCoS2d3Ttpy6F9mneuOZUuMGHlTW2MYtDZ9qqoCny4SVuHMCAn6ESwGd"
            }
        }
        )

        res.status(200).json(info.data);
    } catch (error) {
        console.log(error)
    }
}

exports.binanceNPM = async (req, res, next) => {
    const binance = new Binance().options({
        APIKEY: 'eUzRDZRLKCoS2d3Ttpy6F9mneuOZUuMGHlTW2MYtDZ9qqoCny4SVuHMCAn6ESwGd',
        APISECRET: '5LMOrukq9UYAIqZKbEIzJ9mqvn7jFKNQynHlsqG4bjVG5LFwyGbWjCZ41sG5Xwev'
    })

    binance.balance((error, balances) => {
        if (error) return console.error(error);
        console.info("balances()", balances);
        console.info("ETH balance: ", balances.ETH.available);
    })
}

exports.binanceConnector = async (req, res, next) => {
    try {
        const client = new Spot('eUzRDZRLKCoS2d3Ttpy6F9mneuOZUuMGHlTW2MYtDZ9qqoCny4SVuHMCAn6ESwGd', '5LMOrukq9UYAIqZKbEIzJ9mqvn7jFKNQynHlsqG4bjVG5LFwyGbWjCZ41sG5Xwev')

        let info;
        let assets = []

        // Get all assets quantity
        await client.account()
            .then(response => {
                //client.logger.log(response.data.balances);
                response.data.balances.map(a => {
                    let value = parseFloat(Number(a.free));
                    let tempObj;

                    if (value != 0) {
                        tempObj = {
                            asset: a.asset,
                            qty: value,
                            btc_value: 0,
                            weight_percentage: 0,
                            order_price: 0,
                        }

                        assets.push(tempObj);
                    }
                })
            })

        // Get all assets BTC value
        const btcValues = assets.map(async (a) => {
            let allBTCvalue = [];
            let order_price;
            let decimalNumber;

            if (a.asset == "BTC") {
                a.btc_value = a.qty;
            } else {
                // Get last 60 seconds value of the asset to find the average
                await client.historicalTrades(`${a.asset}BTC`, { limit: 60 })
                    .then(async response => {
                        //client.logger.log(response.data.price)
                        await response.data.map(async p => {
                            allBTCvalue.push(parseFloat(Number(p.price)))
                        })

                        // Find number of decimal for the order_price
                        decimalNumber = (allBTCvalue[0].toString().length) - 2;
                        // Get the average price of the 60 to get the final order_price
                        order_price = parseFloat((allBTCvalue.reduce((a, b) => a + b, 0) / allBTCvalue.length).toFixed(decimalNumber));

                        // Update assets array
                        a.btc_value = Number((a.qty * order_price).toFixed(8));
                        a.order_price = order_price;
                    })
            }
        })

        // Get total asset in btc
        await Promise.all(btcValues).then(async () => {
            let total = 0;

            // Get total wallet value in BTC
            await assets.map(async (a) => {
                total = total + a.btc_value;
            })

            // Get weight percentage of each asset
            await assets.map(async (a) => {
                let weight;

                weight = (a.btc_value * 100) / total;
                a.weight_percentage = Number(weight.toFixed(2));
            })

        });

        return Promise.all(btcValues).then(() => {
            res.status(200).json(assets)
        });

    } catch (error) {
        console.log(error)
    }

}

exports.getBinanceAccountInfo = async (apiKey, secretKey) => {
    try {
        const client = new Spot(apiKey, secretKey);

        let assets = []

        // Get all assets quantity
        await client.account()
            .then(response => {
                //client.logger.log(response.data.balances);
                response.data.balances.map(a => {
                    let value = parseFloat(Number(a.free));
                    let tempObj;

                    if (value != 0) {
                        tempObj = {
                            asset: a.asset,
                            qty: value,
                            btc_value: 0,
                            weight_percentage: 0,
                            order_price: 0,
                        }

                        assets.push(tempObj);
                    }
                })
            })

        // Get all assets BTC value
        const btcValues = assets.map(async (a) => {
            let allBTCvalue = [];
            let order_price;
            let decimalNumber;

            if (a.asset == "BTC") {
                a.btc_value = a.qty;
            } else {
                // Get last 60 seconds value of the asset to find the average
                await client.historicalTrades(`${a.asset}BTC`, { limit: 60 })
                    .then(async response => {
                        //client.logger.log(response.data.price)
                        await response.data.map(async p => {
                            allBTCvalue.push(parseFloat(Number(p.price)))
                        })

                        // Find number of decimal for the order_price
                        decimalNumber = (allBTCvalue[0].toString().length) - 2;
                        // Get the average price of the 60 to get the final order_price
                        order_price = parseFloat((allBTCvalue.reduce((a, b) => a + b, 0) / allBTCvalue.length).toFixed(decimalNumber));

                        // Update assets array
                        a.btc_value = Number((a.qty * order_price).toFixed(8));
                        a.order_price = order_price;
                    })
            }
        })

        // Get total asset in btc
        await Promise.all(btcValues).then(async () => {
            let total = 0;

            // Get total wallet value in BTC
            await assets.map(async (a) => {
                total = total + a.btc_value;
            })

            // Get weight percentage of each asset
            await assets.map(async (a) => {
                let weight;

                weight = (a.btc_value * 100) / total;
                a.weight_percentage = Number(weight.toFixed(2));
            })

        });

        return Promise.all(btcValues).then(() => {
            return assets;
        });

    } catch (error) {
        console.log(error)
    }

}

