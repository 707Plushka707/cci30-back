const { Spot } = require('@binance/connector');
const { getCCi30Info } = require('./constituents')

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

// Get all USDT pairs from cci30 constituents
exports.getAllUSDTPairs = async (cci30Info) => {
    try {
        // Variables
        let usdtPairsAssets = [];
        let stepSize;
        let minQty;
        let minNotional;

        // Connect to Binance account
        const client = new Spot(process.env.API_KEY, process.env.secretKey_KEY);

        const cci30Mapping = await cci30Info.map(async (c) => {
            // Get exchange info to get all pairs
            await client.exchangeInfo({ symbol: `${c.asset}usdt` })
                .then(async (response) => {
                    //client.logger.log(response.data.symbols);
                    response.data.symbols[0].filters.map(async (a) => {
                        //console.log("A: ", a)
                        // Get minimum lot size value
                        if (a.filterType == "LOT_SIZE") {
                            // client.logger.log(`LOT ${a.asset}: ${a.stepSize}`);
                            stepSize = Number(a.stepSize);
                            minQty = Number(a.minQty);
                        }

                        // Get minimum notional value
                        if (a.filterType == "MIN_NOTIONAL") {
                            //client.logger.log(`MIN ${a.asset}: ${a.minNotional}`);
                            minNotional = Number(a.minNotional);
                        }
                    })

                    // Update assets allOrderPrice array
                    let tempObj = {
                        asset: c.asset,
                        step_size: stepSize,
                        order_price: 0,
                        min_qty: minQty,
                        min_notional: minNotional,
                    }

                    usdtPairsAssets.push(tempObj);
                })

            //console.log("BRO: ", usdtPairsAssets);
            return usdtPairsAssets;
        })

        // Get all historical value to get the order price
        const numFruits = await Promise.all(cci30Mapping)
        return numFruits
        //console.log("FRUIT: ", numFruits);


    } catch (error) {
        console.log("ALL USDT PAIRS CLIENT ERROR: ", error)
    }
}

// Get all USDT order price
exports.getUsdtOrderPrice = async (asset) => {
    const client = new Spot(process.env.API_KEY, process.env.secretKey_KEY);

    // Variables
    let order_price;
    let decimalNumber;

    // Get order price for the asset
    try {
        const priceMapping = await asset.map(async (a) => {
            await client.historicalTrades(`${a.asset}usdt`, { limit: 120 })
                .then(async response => {
                    //client.logger.log(response.data.price)
                    let priceArray = [];

                    await response.data.map(async p => {
                        priceArray.push(parseFloat(Number(p.price)))
                    })

                    // Find number of decimal for the order_price
                    decimalNumber = await (priceArray[0].toString().length) - 2;
                    // Get the average price of the 60 to get the final order_price
                    order_price = parseFloat((priceArray.reduce((a, b) => a + b, 0) / priceArray.length).toFixed(decimalNumber));

                    a.order_price = order_price;

                })

            return asset;
        })

        const numFruits = await Promise.all(priceMapping)
        return numFruits

    } catch (error) {
        console.log("ERROR IN HISTORICAL TRADES: ", error)
    }
}

// Get Binance account details
exports.getBinanceAccountInfo = async (apiKey, secretKey) => {
    try {
        // Variables
        let assets = []; // Store all available assets in client account

        // Connect to Binance account
        const client = new Spot(apiKey, secretKey);

        // Get all assets + their quantity
        const clientInfo = await client.account()
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

                return assets;
            })

        const numFruits = await Promise.all(clientInfo)
        return numFruits;

    } catch (error) {
        console.log("GET BINANCE ACCOUNT INFO ERROR: ", error)
    }
}

// Get Binance wallet BTC value
exports.getBinanceWalletBTCValues = async (clientwallet, usdtpairs) => {
    // Variables
    let totalBTC = 0;

    // Get all assets BTC value
    const btcValues = await clientwallet.map(async (w) => {
        if (w.asset == "BTC") {
            await usdtpairs.map(async (u) => {
                if (u.asset = "BTC") {
                    w.order_price = u.order_price;
                }
            })

            w.btc_value = w.qty;
            totalBTC = totalBTC + w.qty;
        } else if (w.asset == "USDT") {
            await usdtpairs.map(async (u) => {
                if (u.asset == "BTC") {
                    let decimalNumber = ((u.step_size).toString().length) - 2;

                    if (decimalNumber < 0) {
                        decimalNumber = 0;
                    }

                    w.btc_value = parseFloat((w.qty / u.order_price).toFixed(decimalNumber));
                    w.order_price = u.order_price;
                    totalBTC = totalBTC + (w.qty / u.order_price);
                }
            })
        } else {
            await usdtpairs.map(async (u) => {
                if (w.asset == u.asset) {
                    w.order_price = u.order_price;

                    // 1. Get USDT value of the coin
                    let coinUSDTvalue = w.qty * u.order_price;

                    // 2. Get BTC value of the coin
                    await usdtpairs.map(async (u2) => {
                        let decimalNumber = ((u2.step_size).toString().length) - 2;

                        if (decimalNumber < 0) {
                            decimalNumber = 0;
                        }

                        if (u2.asset == "BTC") {
                            w.btc_value = parseFloat((coinUSDTvalue / u2.order_price).toFixed(decimalNumber));
                            totalBTC = totalBTC + (coinUSDTvalue / u2.order_price);
                        }
                    })
                }
            })
        }
    })


    // Get BTC percentage of each coins in wallet
    const btcPercentage = await Promise.all(btcValues).then(async () => {
        // Get weight percentage of each asset
        await clientwallet.map(async (w) => {
            let weight;

            weight = (w.btc_value * 100) / totalBTC;
            w.weight_percentage = Number(weight.toFixed(2));
        })

        return clientwallet;
    });

    const numFruits = await Promise.all(btcPercentage);
    return { clientWallet: numFruits, totalBTC };
}

// Get order (BUY or SELL) list
exports.getOrderListWithoutQty = async (walletBTCweight, cci30details, usdtpairs) => {
    // Variables
    let notInCci30 = [];
    let orderList = [];
    let weightDifference = 0;
    let order_type;

    try {
        const checkExistence = await cci30details.map(async (c) => {
            let exists = 0;
            let notExists = 0;

            await walletBTCweight.map(async (w) => {
                // Check is CCi30 asset is in wallet
                if (w.asset == c.asset) {
                    exists++;

                    // Get weight difference from what is expected by CCi30 and what is inside wallet
                    weightDifference = Number((c.weight - w.weight_percentage).toFixed(2));

                    // If difference > 0 ==> we shall buy the the asset with weight differenceCB
                    // Else we shall sell the excess
                    if (weightDifference > 0) {
                        order_type = "BUY"
                    } else {
                        order_type = "SELL"
                    }

                    await usdtpairs.map(async (u) => {
                        if (w.asset == u.asset) {
                            let tempObj = {
                                asset: w.asset,
                                order_type: order_type,
                                order_percentage: weightDifference,
                                order_price: u.order_price,
                            }

                            orderList.push(tempObj);
                        }
                    })
                } else {
                    notExists++;
                }

                if (notExists == walletBTCweight.length) {
                    if (w.asset != "USDT") {
                        notInCci30.push(w);
                    } else {
                        await usdtpairs.map(async (u) => {
                            if (c.asset == u.asset) {
                                let tempObj = {
                                    asset: c.asset,
                                    order_type: "BUY",
                                    order_percentage: c.weight,
                                    order_price: u.order_price
                                }

                                orderList.push(tempObj);
                            }
                        })
                    }
                }
            })

            return { orderList, notInCci30 }
        })

        const numFruits = await Promise.all(checkExistence);
        return numFruits;

    } catch (error) {
        console.log("ERROR IN GET ORDER LIST FUNCRION: ", error);
    }
}

// Get quantity for each order
exports.getOrderQty = async (orderlist, usdtpairs, totalbtc) => {
    try {
        const getQty = await orderlist.map(async (o) => {
            await usdtpairs.map(async (u) => {
                if (o.asset == u.asset) {

                    // Only execute order if order percentage is >0.5, otherwise fees will not be worth it
                    if (Math.abs(o.order_percentage) > 0.5) {
                        // Get number of decimal for each qty based on step_size
                        let stepSizeDecimal = countDecimals(u.step_size);

                        // Get quantity of asset to buy
                        let qty = Number((((totalbtc * Math.abs(o.order_percentage)) / 100) / o.order_price).toFixed(stepSizeDecimal));
                        let notional = o.order_price * qty;

                        if (qty == 0 || notional < Number(u.min_notional)) {
                            qty = (Number(u.min_notional) / Number(o.order_price)).toFixed(stepSizeDecimal);

                            if ((o.order_price * qty) < Number(u.min_notional)) {
                                qty = (Number(qty) + Number(u.step_size)).toFixed(stepSizeDecimal);
                            }
                        }

                        o.qty = Number(qty);
                    }
                }
            })

            return orderlist;
        })

        const numFruits = await Promise.all(getQty);
        return numFruits;

    } catch (error) {
        console.log("ERROR IN GET ORDER QTY: ", error);
    }
}