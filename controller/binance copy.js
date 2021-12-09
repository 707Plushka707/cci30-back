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
        APIKEY: 'CzVUrIY981pE2mpRfRH8TJyHW2ZnQNS0ZFMKfau3XvjdpJ5OUbIBYv7fwtwAooPi',
        APISECRET: 'xUj9Y0LZSMQqFdFVpFbqKm3PyctFIpBhN7nUhBEJ1zTKPVPkf1p3U0IL36ILh6KP'
    })

    await binance.balance(async (error, balances) => {
        console.log(balances);
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

exports.getBinanceAccountInfo = async (apiKey, secretKey, cci30Info) => {
    try {
        const client = new Spot(apiKey, secretKey);

        let assets = [];
        let allOrderPrice = [];

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
        const btcValues = await assets.map(async (a) => {
            let allBTCvalue = [];
            let order_price;
            let decimalNumber;

            if (a.asset == "BTC") {
                a.btc_value = a.qty;
            } else {
                // Get last 60 seconds value of the asset to find the average
                await client.historicalTrades(`${a.asset}BTC`, { limit: 120 })
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

        // Get order price for each asset in cci30
        const orderPriceValue = await cci30Info.map(async (a) => {
            let priceArray = [];
            let order_price;
            let decimalNumber;
            let stepSize;

            if (a.asset != "BTC") {
                // Because SHIBBTC doesn't exist, check if current asset is SHIB
                if (a.asset != "SHIB") {
                    // Get last 120 seconds value of the asset to find the average
                    await client.historicalTrades(`${a.asset}BTC`, { limit: 120 })
                        .then(async response => {
                            //client.logger.log(response.data.price)
                            await response.data.map(async p => {
                                priceArray.push(parseFloat(Number(p.price)))
                            })

                            // Find number of decimal for the order_price
                            decimalNumber = (priceArray[0].toString().length) - 2;
                            // Get the average price of the 60 to get the final order_price
                            order_price = parseFloat((priceArray.reduce((a, b) => a + b, 0) / priceArray.length).toFixed(decimalNumber));

                            await client.exchangeInfo({ symbol: `${a.asset}btc` })
                                .then(response => {
                                    response.data.symbols[0].filters.map(async (sz) => {
                                        if (sz.filterType == "LOT_SIZE") {
                                            client.logger.log("SZ: ", Number(sz.stepSize));
                                            stepSize = Number(sz.stepSize);
                                        }
                                    })
                                })

                            // Update assets allOrderPrice array
                            let tempObj = {
                                asset: a.asset,
                                order_price: order_price,
                                step_size: stepSize,
                            }

                            allOrderPrice.push(tempObj);
                        })
                } else {
                    // Get last 120 seconds value of the asset to find the average
                    await client.historicalTrades(`${a.asset}USDT`, { limit: 120 })
                        .then(async response => {
                            //client.logger.log(response.data.price)
                            await response.data.map(async p => {
                                priceArray.push(parseFloat(Number(p.price)))
                            })

                            // Find number of decimal for the order_price
                            decimalNumber = (priceArray[0].toString().length) - 2;
                            // Get the average price of the 60 to get the final order_price
                            order_price = parseFloat((priceArray.reduce((a, b) => a + b, 0) / priceArray.length).toFixed(decimalNumber));

                            await client.exchangeInfo({ symbol: `${a.asset}usdt` })
                                .then(response => {
                                    response.data.symbols[0].filters.map(async (sz) => {
                                        if (sz.filterType == "LOT_SIZE") {
                                            client.logger.log("SZ: ", Number(sz.stepSize));
                                            stepSize = Number(sz.stepSize);
                                        }
                                    })
                                })

                            // Update assets allOrderPrice array
                            let tempObj = {
                                asset: a.asset,
                                order_price: order_price,
                                step_size: stepSize,
                            }

                            allOrderPrice.push(tempObj);
                        })
                }
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

        return Promise.all(orderPriceValue).then(() => {
            return {
                assets,
                allOrderPrice
            };
        });

    } catch (error) {
        console.log(error)
    }
}

const countDecimals = (value) => {

    if (Math.floor(value.valueOf()) === value.valueOf()) return 0;

    var str = value.toString();
    if (str.indexOf(".") !== -1 && str.indexOf("-") !== -1) {
        return str.split("-")[1] || 0;
    } else if (str.indexOf(".") !== -1) {
        return str.split(".")[1].length || 0;
    }
    return str.split("-")[1] || 0;
}

// Place order to buy other coins if wallet is composed only of BTC
exports.buyOrdersFromBTC = async (apiKey, secretKey, total, buyOnlyOrders, allOrderPrice) => {
    const client = new Spot(apiKey, secretKey);

    let orderArray = [];
    let allBTCvalue = [];
    let order_price;
    let decimalNumber;
    let exchangeInfo;

    await buyOnlyOrders.map(async (b) => {
        await allOrderPrice.map(async (p) => {
            if (p.asset == b.asset) {
                // Get number of decimal for each qty based on step_size
                let stepSizeDecimal = countDecimals(p.step_size);

                // Get quantity of asset to buy
                let qty = Number((((total * b.order_percentage) / 100) / p.order_price).toFixed(stepSizeDecimal));

                console.log("COIN: ", p.asset, " SIZE: ", qty)
                // If order_percentage is less than 0.5, don't buy as maybe the transaction fee will be higher
                if (p.order_percentage >= 0.5) {
                    // Place a new order
                    /*client.newOrder(`${b.asset}BTC`, 'BUY', 'LIMIT', {
                        price: `${p.order_price}`,
                        quantity: qty,
                        timeInForce: 'GTC'
                    }).then(response => client.logger.log(response.data))
                        .catch(error => client.logger.error(error))*/
                }
            }
        })
    })

    //return exchangeInfo;
};

exports.buyOrdersFromNodeNpm = async (apiKey, secretKey, total, buyOnlyOrders, allOrderPrice) => {
    const binance = new Binance().options({
        APIKEY: apiKey,
        APISECRET: secretKey,
    })


    try {
        await buyOnlyOrders.map(async (b) => {
            if (b.asset == "ETH" || b.asset == "BNB") {
                await allOrderPrice.map(async (p) => {
                    if (p.asset == b.asset) {
                        // Get quantity of asset to buy
                        let qty = Number((((total * b.order_percentage) / 100) / p.order_price).toFixed(8));

                        try {
                            // Place a new order
                            await binance.buy(`${b.asset}BTC`, qty, p.order_price);
                        } catch (error) {
                            console.log("ERROR IN BUY: ", error)
                        }

                    }
                })
            }
        })
    } catch (error) {
        console.log("ERROR HERE: ", error)
    }

}
