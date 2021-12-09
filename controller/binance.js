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

// Get Binance account details
exports.getBinanceAccountInfo = async (apiKey, secretKey, cci30Info) => {
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

        // Get all assets BTC value
        const btcValues = await cci30Info.map(async (c) => {
            let allBTCvalue = [];
            let order_price;
            let decimalNumber;

            await assets.map(async (a) => {
                if (a.asset == "BTC") {
                    a.btc_value = a.qty;
                } else if (a.asset == "USDT") {
                    if (c.asset == "BTC") {
                        a.btc_value = a.qty / c.order_price;
                    }
                } else {
                    if (a.asset == c.asset) {
                        let usdtAmount = (a.qty * c.order_price);

                        await cci30Info.map(async (c2) => {
                            if (c2.asset == "BTC") {
                                a.btc_value = usdtAmount / c2.order_price;
                            }
                        })
                    }

                }
            })
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

            console.log("BRO: ", clientInfo)
        });



        // Check assets array

        // Only one asset inside the wallet
        /*if (assets.length == 1) {
            await assets.map((a) => {
                // Case 1: only BTC
                if (a.asset == "BTC") {
                    // Call function that will check historical value for asset/BTC
                    // Calculate difference between current BTC percentage and CCi30 percentage required
                    // Sell BTC excess percentage against USDT
                }

                // Case 2: only USDT
                else if (a.asset == "USDT") {
                    // Call function that will check historical value for asset/USDT
                    // Get all percentage of coins that and buy these coins
                }

                // Case 3: other than BTC and USDT
                else {
                    // Call if asset exists inside CCi30
                    // If yes, just sell the excess against USDT
                    // If no, sell everything agains USDT
                    // Call function that will check historical value for asset/USDT
                }
            })
        }
        else if (assets.length == 2) {
            let btcExists = 0;
            let usdtExists = 0;

            await assets.map((a) => {
                // Case 1: if BTC exists
                if (a.asset == "BTC") {
                    btcExists++;
                } else if (a.asset == "USDT") {
                    usdtExists++;
                }
            })

            // Wallet is composed of only BTC and USDT
            if (btcExists > 0 && usdtExists > 0) {

            }
            // Wallet is composed of BTC and other coins
            else if (btcExists > 0 && usdtExists == 0) {

            }
            // Wallet is composed of USDT and other coins
            else if (btcExists == 0 && usdtExists > 0) {

            }
            // There is neither BTC and USDT in wallet
            else if (btcExists == 0 && usdtExists == 0) {

            }
        } else {

        }*/
        // Case 4: none of the above




    } catch (error) {
        console.log("GET BINANCE ACCOUNT INFO ERROR: ", error)
    }
}

// Get all USDT pairs from cci30 constituents
exports.getAllUSDTPairs = async (cci30Info) => {
    try {
        // Variables
        let usdtPairsAssets = [];
        let priceArray = [];
        let order_price;
        let decimalNumber;
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

                        // COMMENT HERE

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



        /*const cci30Mapping = Object.keys(cci30Info).map(async (c, i) => {
            try {
                // Get exchange info to get all pairs
                await client.exchangeInfo({ symbol: `${cci30Info[c].asset}usdt` })
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
    
                            // COMMENT HERE
    
    
                        })
    
                        // Update assets allOrderPrice array
                        let tempObj = {
                            asset: cci30Info[c].asset,
                            step_size: stepSize,
                            order_price: 0,
                            min_qty: minQty,
                            min_notional: minNotional,
                        }
    
                        usdtPairsAssets.push(tempObj);
                    })
    
                //console.log("HERE: ", usdtPairsAssets);
    
            } catch (error) {
                console.log("ERROR IN LOOP CCI30: ", error)
            }
    
        })*/

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
            await client.historicalTrades(`${a.asset}usdt`, { limit: 60 })
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

// Get order price for the asset
/*try {
    await client.historicalTrades(`${cci30Info[c].asset}usdt`, { limit: 60 })
        .then(async response => {
            //client.logger.log(response.data.price)
            await response.data.map(async p => {
                priceArray.push(parseFloat(Number(p.price)))
            })

        })
} catch (error) {
    console.log("ERROR IN HISTORICAL TRADES: ", error)
}


// Find number of decimal for the order_price
decimalNumber = await (priceArray[0].toString().length) - 2;
// Get the average price of the 60 to get the final order_price
order_price = await parseFloat((priceArray.reduce((a, b) => a + b, 0) / priceArray.length).toFixed(decimalNumber));*/