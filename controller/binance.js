const crypto = require('crypto');
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

const isInArray = (arrayToCkeck, assetToCheck) => {
    let arr = arrayToCkeck;

    return arr.some(function (a) {
        return a.asset === assetToCheck;
    });
}

// Get all USDT pairs from cci30 constituents
exports.getAllUSDTPairs2 = async (cci30Info) => {
    try {
        // Variables
        let usdtPairsAssets = [];
        let stepSize;
        let minQty;
        let minNotional;

        // Connect to Binance account
        const client = new Spot(process.env.API_KEY, process.env.SECRET_KEY);

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

exports.getAllUSDTPairs = async (clientwallet, cci30Info) => {
    try {
        // Variables
        let usdtPairsAssets = [];
        let stepSize;
        let minQty;
        let minNotional;
        let tickSize;

        // Combine both array so we will have all CCi30 components as well as those that are in the wallet but not in CCi30
        let combinedArray = [...clientwallet, ...cci30Info];

        // Connect to Binance account
        const client = new Spot(process.env.API_KEY, process.env.SECRET_KEY);

        const cci30Mapping = await combinedArray.map(async (c) => {
            //console.log("ASSET: ", c.asset, " EXISTS ? ", isInArray(usdtPairsAssets, c.asset), " ARRAY: ", usdtPairsAssets);
            if (c.asset != "USDT") {

                // Get exchange info to get all pairs
                await client.exchangeInfo({ symbol: `${c.asset}usdt` })
                    .then(async (response) => {
                        //client.logger.log(response.data.symbols);
                        response.data.symbols[0].filters.map(async (a) => {
                            // Get minimum lot size value
                            if (a.filterType == "LOT_SIZE") {
                                //client.logger.log(`LOT ${c.asset}: ${a.stepSize}`);
                                stepSize = Number(a.stepSize);
                                minQty = Number(a.minQty);
                            }

                            // Get minimum notional value
                            if (a.filterType == "MIN_NOTIONAL") {
                                //client.logger.log(`MIN ${c.asset}: ${a.minNotional}`);
                                minNotional = Number(a.minNotional);
                            }

                            // Get tick size value
                            if (a.filterType == "PRICE_FILTER") {
                                //client.logger.log(`MIN ${a.asset}: ${a.minNotional}`);
                                tickSize = Number(a.tickSize);
                            }
                        })

                        // Update assets allOrderPrice array
                        let tempObj = {
                            asset: c.asset,
                            step_size: stepSize,
                            order_price: 0,
                            min_qty: minQty,
                            min_notional: minNotional,
                            tick_size: tickSize,
                        }

                        if (await isInArray(usdtPairsAssets, c.asset) == false) {
                            //console.log("ALREADY EXIXTS");
                            usdtPairsAssets.push(tempObj);
                        }

                        //console.log("ARRAY: ", usdtPairsAssets)
                    })

                //console.log("BRO: ", usdtPairsAssets);
                return usdtPairsAssets;
            }
        })

        // Get all historical value to get the order price
        const numFruits = await Promise.all(cci30Mapping)
        //console.log("FRUIT: ", numFruits);
        return numFruits



    } catch (error) {
        console.log("ALL USDT PAIRS CLIENT ERROR: ", error)
    }
}

// Get all USDT order price
exports.getUsdtOrderPrice = async (asset) => {
    const client = new Spot(process.env.API_KEY, process.env.SECRET_KEY);

    // Variables
    let order_price;
    let decimalNumber;
    let decimalTickSize;

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
                    decimalTickSize = await countDecimals(a.tick_size);

                    // Get the average price of the 60 to get the final order_price
                    order_price = parseFloat((priceArray.reduce((a, b) => a + b, 0) / priceArray.length).toFixed(decimalTickSize));

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
exports.getBinanceWalletBTCValues2 = async (clientwallet, usdtpairs) => {
    // Variables
    let totalBTC = 0;

    // Get all assets BTC value
    const btcValues = await clientwallet.map(async (w) => {
        if (w.asset == "BTC") {
            await usdtpairs.map(async (u) => {
                if (u.asset == "BTC") {
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
        } else if (w.asset != "USDT" && w.asset != "BTC") {
            await usdtpairs.map(async (u) => {
                if (w.asset == u.asset) {
                    w.order_price = u.order_price;

                    // 1. Get USDT value of the coin
                    let coinUSDTvalue = Number(w.qty) * Number(u.order_price);

                    // 2. Get BTC value of the coin
                    await usdtpairs.map(async (u2) => {
                        let decimalNumber = Number(((u2.step_size).toString().length) - 2);

                        if (decimalNumber < 0) {
                            decimalNumber = 0;
                        }

                        if (u2.asset == "BTC") {
                            w.btc_value = parseFloat((coinUSDTvalue / Number(u2.order_price)).toFixed(decimalNumber));
                            totalBTC = totalBTC + (coinUSDTvalue / Number(u2.order_price));
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

            //console.log("BTC ASST: ", w.btc_value, " TOTAL: ", totalBTC, " CALCUL WEIGHT: ", w.weight_percentage)
        })

        return clientwallet;
    });

    const numFruits = await Promise.all(btcPercentage);
    return { clientWallet: numFruits, totalBTC };
}

exports.getBinanceWalletBTCValues = async (clientwallet, usdtpairs) => {
    // Variables
    let totalBTC = 0;
    let totalUSDT = 0;

    // Get all assets BTC value
    const btcValues = await clientwallet.map(async (w) => {
        if (w.asset == "BTC") {
            await usdtpairs.map(async (u) => {
                if (u.asset == "BTC") {
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
        } else if (w.asset != "USDT" && w.asset != "BTC") {
            await usdtpairs.map(async (u) => {
                if (w.asset == u.asset) {
                    w.order_price = u.order_price;

                    // 1. Get USDT value of the coin
                    let coinUSDTvalue = Number(w.qty) * Number(u.order_price);

                    // 2. Get BTC value of the coin
                    await usdtpairs.map(async (u2) => {
                        let decimalNumber = Number(((u2.step_size).toString().length) - 2);

                        if (decimalNumber < 0) {
                            decimalNumber = 0;
                        }

                        if (u2.asset == "BTC") {
                            w.btc_value = parseFloat((coinUSDTvalue / Number(u2.order_price)).toFixed(decimalNumber));
                            totalBTC = totalBTC + (coinUSDTvalue / Number(u2.order_price));
                        }
                    })
                }
            })
        }
    })

    await usdtpairs.map(async (u) => {
        if (u.asset == "BTC") {
            totalUSDT = totalBTC * u.order_price;
        }
    })


    // Get BTC percentage of each coins in wallet
    const btcPercentage = await Promise.all(btcValues).then(async () => {
        // Get weight percentage of each asset
        await clientwallet.map(async (w) => {
            let weight;

            weight = (w.btc_value * 100) / totalBTC;
            w.weight_percentage = Number(weight.toFixed(2));

            //console.log("BTC ASST: ", w.btc_value, " TOTAL: ", totalBTC, " CALCUL WEIGHT: ", w.weight_percentage)
        })

        return clientwallet;
    });

    const numFruits = await Promise.all(btcPercentage);
    return { clientWallet: numFruits, totalBTC, totalUSDT: Number(totalUSDT.toFixed(2)) };
}

// Get order (BUY or SELL) list
exports.getOrderListWithoutQty2 = async (walletBTCweight, cci30details, usdtpairs) => {
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
            })

            if (notExists == walletBTCweight.length) {
                if (c.asset != "USDT") {
                    if (isInArray(notInCci30, c.asset) == false) {
                        notInCci30.push(c);
                    }
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

            return { orderList, notInCci30 }
        })

        const numFruits = await Promise.all(checkExistence);
        console.log("PFFFF: ", orderList)
        return numFruits;

    } catch (error) {
        console.log("ERROR IN GET ORDER LIST FUNCRION: ", error);
    }
}

exports.getOrderListWithoutQty3 = async (walletBTCweight, cci30details, usdtpairs) => {
    // Variables
    let notInCci30 = [];
    let orderList = [];
    let weightDifference = 0;
    let order_type;

    try {
        const checkExistence = await walletBTCweight.map(async (w) => {
            let exists = 0;
            let notExists = 0;

            await cci30details.map(async (c) => {
                // Check is CCi30 asset is in wallet
                if (w.asset == c.asset) {
                    exists++;

                    // Get weight difference from what is expected by CCi30 and what is inside wallet
                    weightDifference = Number((c.weight - w.weight_percentage).toFixed(2));
                    //console.log("ASSET: ", c.asset, " GS: ", c.weight, " WALLET: ", w.weight_percentage, " DIFF: ", weightDifference)

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
                }
                /* else {
                    notExists++;

                    
                }*/
            })

            return { orderList, notInCci30 }
        })

        const checkAllWalletCoins = await Promise.all(checkExistence)
            .then(async () => {
                await walletBTCweight.map(async (w) => {
                    if (w.asset != "USDT" && isInArray(orderList, w.asset) == false) {
                        let tempObj = {
                            asset: w.asset,
                            order_type: "SELL",
                            order_percentage: w.weight_percentage,
                            order_price: 0
                        }

                        orderList.push(tempObj);
                    }
                })

                return { orderList, notInCci30 }
            })

        await usdtpairs.map(async (u) => {
            if (u.asset != "USDT" && isInArray(orderList, u.asset) == false) {
                let tempObj = {
                    asset: u.asset,
                    order_type: "BUY",
                    order_percentage: u.weight,
                    order_price: u.order_price
                }

                orderList.push(tempObj);
            }
        })

        /*const cci30OrdeList = await Promise.all(checkExistence)
            .then(async () => {
                await cci30details.map(async (c) => {
                    if (c.asset != "USDT" && !isInArray(notInCci30, c.asset)) {
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
                })

                return { orderList, notInCci30 }
            })*/

        return { orderList, notInCci30 }

    } catch (error) {
        console.log("ERROR IN GET ORDER LIST FUNCRION: ", error);
    }
}

exports.getOrderListWithoutQty4 = async (walletBTCweight, cci30details, usdtpairs) => {
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
            })

            if (notExists == walletBTCweight.length) {
                if (c.asset != "USDT") {
                    if (isInArray(notInCci30, c.asset) == false) {
                        notInCci30.push(c);
                    }
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

            return { orderList, notInCci30 }
        })

        const numFruits = await Promise.all(checkExistence)
        //console.log("PFFFF: ", numFruits[0])
        return numFruits[0];

    } catch (error) {
        console.log("ERROR IN GET ORDER LIST FUNCRION: ", error);
    }
}

exports.getOrderListWithoutQty = async (walletBTCweight, walletUSDTtotal, cci30details, usdtpairs) => {
    // Variables
    let sortedArray;
    let totalPercentageLess2k = 0;
    let noOrder = [];
    let notInCci30 = [];
    let orderList = [];
    let weightDifference = 0;
    let order_type;
    let checkExistenceCCi30;
    let checkExistenceWallet;

    try {
        // Get first 2 crypto in cci30
        sortedArray = cci30details
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 2);
        //console.log("SORTED ARRAY: ", sortedArray);

        if (walletUSDTtotal < 2010) {
            await sortedArray.map(async (s) => {
                //console.log("ASSET: ", s.asset, " WEIGHT: ", s.weight);
                return totalPercentageLess2k = totalPercentageLess2k + s.weight;
            })

            checkExistenceCCi30 = await sortedArray.map(async (c) => {
                let exists = 0;
                let notExists = 0;

                await walletBTCweight.map(async (w) => {
                    // Check is CCi30 asset is in wallet
                    if (w.asset == c.asset) {
                        exists++;

                        // Get weight difference from what is expected by CCi30 and what is inside wallet
                        //weightDifference = Number((c.weight - w.weight_percentage).toFixed(2));
                        weightDifference = Number((((c.weight * 100) / totalPercentageLess2k) - w.weight_percentage).toFixed(2));
                        console.log("WEIGHT CALCULE: ", weightDifference, " <2K: ", totalPercentageLess2k, " GS: ", (c.weight * 100) / totalPercentageLess2k, " WALLET: ", w.weight_percentage);

                        // If difference > 0 ==> we shall buy the the asset with weight differenceCB
                        // Else we shall sell the excess
                        if (weightDifference > 3.5) {
                            order_type = "BUY";

                            //console.log("TETS: ", Math.floor(weightDifference * 10) / 10)

                            await usdtpairs.map(async (u) => {
                                if (w.asset == u.asset) {
                                    let tempObj = {
                                        asset: w.asset,
                                        order_type: order_type,
                                        order_percentage: (Math.floor(weightDifference * 10) / 10) - 0.1,
                                        order_price: u.order_price,
                                    }

                                    orderList.push(tempObj);
                                }
                            })
                        } else if (weightDifference < -3.5) {
                            order_type = "SELL";

                            await usdtpairs.map(async (u) => {
                                if (w.asset == u.asset) {
                                    let tempObj = {
                                        asset: w.asset,
                                        order_type: order_type,
                                        order_percentage: Math.floor(weightDifference * 10) / 10,
                                        order_price: u.order_price,
                                    }

                                    orderList.push(tempObj);
                                }
                            })
                        }
                    } else {
                        notExists++;
                    }
                })

                // Buy coins that are not in wallet but need to be bought based on CCi30 constituents
                if (notExists == walletBTCweight.length) {
                    if (c.asset != "USDT") {
                        if (isInArray(notInCci30, c.asset) == false) {
                            await usdtpairs.map(async (u) => {
                                if (c.asset == u.asset) {
                                    /*let tempObj = {
                                        asset: c.asset,
                                        order_type: "BUY",
                                        order_percentage: c.weight,
                                        order_price: u.order_price
                                    }*/

                                    //console.log("TETS 2: ", Math.floor((Number(((c.weight * 100) / totalPercentageLess2k))) * 10) / 10)

                                    let tempObj = {
                                        asset: c.asset,
                                        order_type: "BUY",
                                        order_percentage: (Math.floor((Number(((c.weight * 100) / totalPercentageLess2k))) * 10) / 10) - 0.1,
                                        order_price: u.order_price
                                    }

                                    orderList.push(tempObj);
                                }
                            })
                            //notInCci30.push(c);
                        }
                    }
                }

                return { orderList, notInCci30 }
            })

            checkExistenceWallet = await walletBTCweight.map(async (w) => {
                let existsWallet = 0;
                let notExistsWallet = 0;

                await sortedArray.map(async (c) => {
                    // Check is CCi30 asset is in wallet
                    if (w.asset == c.asset) {
                        existsWallet++;

                        // Get weight difference from what is expected by CCi30 and what is inside wallet
                        weightDifference = Number((((c.weight * 100) / totalPercentageLess2k) - w.weight_percentage).toFixed(2));

                        console.log("WEIGHT CALCULE 2: ", weightDifference, " <2K: ", totalPercentageLess2k, " GS: ", (c.weight * 100) / totalPercentageLess2k, " WALLET: ", w.weight_percentage);

                        // If difference > 0 ==> we shall buy the the asset with weight differenceCB
                        // Else we shall sell the excess
                        if (weightDifference > 3.5) {
                            order_type = "BUY"

                            await usdtpairs.map(async (u) => {
                                if (c.asset == u.asset) {
                                    if (isInArray(orderList, w.asset) == false) {
                                        //console.log("TETS 3: ", Math.floor(weightDifference * 10) / 10)

                                        let tempObj = {
                                            asset: c.asset,
                                            order_type: order_type,
                                            order_percentage: (Math.floor(weightDifference * 10) / 10) - 0.1,
                                            order_price: u.order_price,
                                        }

                                        orderList.push(tempObj);
                                    }
                                }

                            })
                        } else if (weightDifference < -3.5) {
                            order_type = "SELL"

                            await usdtpairs.map(async (u) => {
                                if (c.asset == u.asset) {
                                    if (isInArray(orderList, w.asset) == false) {
                                        let tempObj = {
                                            asset: c.asset,
                                            order_type: order_type,
                                            order_percentage: Math.floor(weightDifference * 10) / 10,
                                            order_price: u.order_price,
                                        }

                                        orderList.push(tempObj);
                                    }
                                }

                            })
                        }
                    } else {
                        notExistsWallet++;
                    }
                })

                if (notExistsWallet == sortedArray.length) {
                    if (w.asset != "USDT") {
                        if (isInArray(orderList, w.asset) == false) {
                            await usdtpairs.map(async (u) => {
                                if (w.asset == u.asset && Number(((w.weight_percentage * 100) / totalPercentageLess2k).toFixed(2)) < -3.5) {
                                    let tempObj = {
                                        asset: w.asset,
                                        order_type: "SELL",
                                        order_percentage: Math.floor((Number(((w.weight_percentage * 100) / totalPercentageLess2k))) * 10) / 10,
                                        order_price: u.order_price
                                    }

                                    orderList.push(tempObj);
                                }
                            })
                        }
                    }
                }

                return { orderList, notInCci30 }
            })

        } else {
            checkExistenceCCi30 = await cci30details.map(async (c) => {
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
                        if (weightDifference > 0.5) {
                            order_type = "BUY"

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
                        } else if (weightDifference < -0.5) {
                            order_type = "SELL"

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
                        }
                    } else {
                        notExists++;
                    }
                })

                if (notExists == walletBTCweight.length) {
                    if (c.asset != "USDT") {
                        if (isInArray(notInCci30, c.asset) == false) {
                            //notInCci30.push(c);

                            if (c.asset == u.asset) {
                                let tempObj = {
                                    asset: c.asset,
                                    order_type: "BUY",
                                    order_percentage: c.weight,
                                    order_price: u.order_price
                                }

                                orderList.push(tempObj);
                            }
                        }
                    }
                }

                return { orderList, notInCci30 }
            })

            checkExistenceWallet = await walletBTCweight.map(async (w) => {
                let existsWallet = 0;
                let notExistsWallet = 0;

                await cci30details.map(async (c) => {
                    // Check is CCi30 asset is in wallet
                    if (w.asset == c.asset) {
                        existsWallet++;

                        // Get weight difference from what is expected by CCi30 and what is inside wallet
                        weightDifference = Number((c.weight - w.weight_percentage).toFixed(2));

                        // If difference > 0 ==> we shall buy the the asset with weight differenceCB
                        // Else we shall sell the excess
                        if (weightDifference > 0.5) {
                            order_type = "BUY"

                            await usdtpairs.map(async (u) => {
                                if (c.asset == u.asset) {
                                    if (isInArray(orderList, w.asset) == false) {
                                        let tempObj = {
                                            asset: c.asset,
                                            order_type: order_type,
                                            order_percentage: weightDifference,
                                            order_price: u.order_price,
                                        }

                                        orderList.push(tempObj);
                                    }
                                }

                            })
                        } else if (weightDifference < -0.5) {
                            order_type = "SELL"

                            await usdtpairs.map(async (u) => {
                                if (c.asset == u.asset) {
                                    if (isInArray(orderList, w.asset) == false) {
                                        let tempObj = {
                                            asset: c.asset,
                                            order_type: order_type,
                                            order_percentage: weightDifference,
                                            order_price: u.order_price,
                                        }

                                        orderList.push(tempObj);
                                    }
                                }

                            })
                        }
                    } else {
                        notExistsWallet++;
                    }
                })

                if (notExistsWallet == cci30details.length) {
                    if (w.asset != "USDT") {
                        if (isInArray(orderList, w.asset) == false) {
                            await usdtpairs.map(async (u) => {
                                if (w.asset == u.asset) {
                                    let tempObj = {
                                        asset: w.asset,
                                        order_type: "SELL",
                                        order_percentage: w.weight_percentage,
                                        order_price: u.order_price
                                    }

                                    orderList.push(tempObj);
                                }
                            })
                        }
                    }
                }

                return { orderList, notInCci30 }
            })
        }

        const numFruits = await Promise.all(checkExistenceWallet)
        //console.log("PFFFF: ", numFruits[0])
        return numFruits[0];

    } catch (error) {
        console.log("ERROR IN GET ORDER LIST FUNCRION: ", error);
    }
}

// Get quantity for each order
exports.getOrderQty = async (orderlist, usdtpairs, totalbtc) => {
    try {
        // Variables
        let finalOrderList = [];
        let btcPrice = 0;

        await usdtpairs.map(async (u) => {
            if (u.asset == "BTC") {
                btcPrice = u.order_price;
            }
        })

        //console.log("ORDER LIST: ", orderlist);
        //console.log("BTC PRICE: ", btcPrice);

        const getQty = await orderlist.map(async (o) => {
            await usdtpairs.map(async (u) => {
                if (o.asset == u.asset) {

                    // Only execute order if order percentage is >0.5, otherwise fees will not be worth it
                    if (Math.abs(o.order_percentage) > 0.5) {

                        // Get number of decimal for each qty based on step_size
                        let stepSizeDecimal = countDecimals(u.step_size);
                        let notionalDecimal = countDecimals(Number(u.min_notional));

                        // Get quantity of asset to buy
                        //console.log(`${o.asset} - BTC: `, totalbtc, " ABS: ", Math.abs(Number(o.order_percentage)), " CALC: ", ((totalbtc * Math.abs(Number(o.order_percentage))) / 100) * Number(o.order_price));
                        //let qty = Number((((totalbtc * Math.abs(Number(o.order_percentage))) / 100) * Number(o.order_price)).toFixed(stepSizeDecimal));
                        let qty = Number(((((totalbtc * Math.abs(Number(o.order_percentage))) / 100) * btcPrice) / Number(o.order_price)).toFixed(stepSizeDecimal));
                        let notional = (Number(o.order_price) * Number(qty)).toFixed(notionalDecimal + 1);
                        //console.log("QTY: ", qty, " NOTIONAL: ", notional);

                        if (qty == 0 || notional < Number(u.min_notional)) {
                            //console.log("ASSET: ", o.asset, "NOTIONAL: ", Number(u.min_notional), " QTY: ", qty, " CALCULATE: ", Number(o.order_price) * Number(qty))

                            qty = (Number(u.min_notional) / Number(o.order_price)).toFixed(stepSizeDecimal);

                            //if ((o.order_price * qty) < Number(u.min_notional)) {
                            //  qty = (Number(qty) + Number(u.step_size)).toFixed(stepSizeDecimal);
                            //}

                            for (let i = 0; i < 500; i++) {
                                //console.log("ASSET: ", o.asset, "NOTIONAL: ", Number(u.min_notional), " QTY: ", qty, " CALCULATE: ", Number(o.order_price) * Number(qty))

                                qty = (Number(qty) + Number(u.step_size)).toFixed(stepSizeDecimal);

                                if ((Number(o.order_price) * Number(qty)).toFixed(notionalDecimal + 1) > Number(u.min_notional)) {
                                    break;
                                }
                            }
                        }

                        //console.log("ASSET FINAL: ", o.asset, "NOTIONAL: ", Number(u.min_notional), " QTY: ", qty, " CALCULATE: ", Number(o.order_price) * Number(qty))

                        let tempObj = {
                            ...o,
                            qty: Number(qty)
                        }

                        finalOrderList.push(tempObj);

                    }
                }
            })

            return finalOrderList;
        })

        const numFruits = await Promise.all(getQty);
        return numFruits;

    } catch (error) {
        console.log("ERROR IN GET ORDER QTY: ", error);
    }
}

// Place SELL MARKET orders
exports.placeSellMarketOrders = async (sellMarketOrders) => {
    try {
        // Connect to Binance account
        const client = new Spot(process.env.API_KEY, process.env.SECRET_KEY);

        await sellMarketOrders.map(async (sm) => {
            //console.log("SELL: ", sm)
            await client.newOrder(`${sm.asset}USDT`, 'SELL', 'MARKET', {
                quantity: sm.qty,
            }).then(response => client.logger.log("AFTER SELL MRAKET: ", response.data))
                .catch(error =>
                    client.logger.error("Error sell market catch: ", error)
                )
        })

        return;
    } catch (error) {
        console.log("ERROR IN SELL MARKET ORDER: ", error)
    }

}

// Place BUY MARKET orders
exports.placeBuyMarketOrders = async (buyMarketOrders) => {
    try {
        // Connect to Binance account
        const client = new Spot(process.env.API_KEY, process.env.SECRET_KEY);

        // Variables
        let buyMarketErrorArray = [];

        await buyMarketOrders.map(async (bm) => {
            //console.log("BUY MARKET: ", finalQty)
            await client.newOrder(`${bm.asset}USDT`, 'BUY', 'MARKET', {
                quantity: bm.qty,
            }).then(response => client.logger.log("AFTER BUY MRAKET: ", response.data))
                .catch(error => {
                    client.logger.error("Error buy market catch: ", error)
                    buyMarketErrorArray.push(bm);
                })
        })

        return buyMarketErrorArray;
    } catch (error) {
        console.log("ERROR IN BUY MARKET ORDER: ", error)
    }
}

// Place all BUY LIMIT orders
exports.placeBuyLimitOrders = async (buyLimitOrders) => {
    try {
        // Connect to Binance account
        const client = new Spot(process.env.API_KEY, process.env.SECRET_KEY);

        await buyLimitOrders.map(async (bl) => {
            // Variables
            let usdtFreeValue = 0;
            let qtyXprice = 0;

            // Check if USDT is >= to the qty to buy to avoid having "Insufficient balance" error
            await client.account()
                .then(async (res) => {
                    await res.data.balances.map(b => {
                        if (b.asset == "USDT") {
                            usdtFreeValue = parseFloat(Number(b.free));
                        }
                    })
                })

            // Compare usdtFreeValue with qty*price of buy order
            qtyXprice = bl.order_price * bl.qty;
            console.log("QTYxPRICE: ", qtyXprice, " FREE: ", usdtFreeValue);

            // If free USDT is >= to what qty is required, proceed with tje buy limit
            if (usdtFreeValue > qtyXprice && usdtFreeValue > 10.1) {
                //console.log("BUY: ", finalQty)
                await client.newOrder(`${bl.asset}USDT`, 'BUY', 'LIMIT', {
                    price: `${bl.order_price}`,
                    quantity: bl.qty,
                    timeInForce: 'GTC',
                }).then(response => client.logger.log("AFTER BUY LIMIT ORDER: ", response.data))
                    .catch(error => {
                        client.logger.error(error)
                    })
            }
            // Else use remaining USDT for the order
            else {
                let decimalCount = countDecimals(bl.qty)
                let finalQty = Number((usdtFreeValue / bl.order_price).toFixed(decimalCount));
                console.log("FINAL: ", finalQty);

                // If qty is till the same as the previous, substract
                if (finalQty >= bl.qty) {
                    let divider = '1';
                    for (let i = 0; i < decimalCount; i++) {
                        divider = divider + '0'
                    }

                    console.log("FINAL MULTIPLAIER: ", 1 / Number((Number(divider)).toFixed(decimalCount)))

                    finalQty = finalQty - (1 / Number((Number(divider)).toFixed(decimalCount)));

                    console.log("FINAL AGAIN: ", finalQty)

                    await client.newOrder(`${bl.asset}USDT`, 'BUY', 'LIMIT', {
                        price: `${bl.order_price}`,
                        quantity: Number(finalQty.toFixed(decimalCount)),
                        timeInForce: 'GTC',
                    }).then(response => client.logger.log("AFTER BUY LIMIT ORDER IN ELSE: ", response.data))
                        .catch(error => {
                            client.logger.error(error)
                        })
                } else {
                    await client.newOrder(`${bl.asset}USDT`, 'BUY', 'LIMIT', {
                        price: `${bl.order_price}`,
                        quantity: finalQty,
                        timeInForce: 'GTC',
                    }).then(response => client.logger.log("AFTER BUY LIMIT ORDER IN ELSE: ", response.data))
                        .catch(error => {
                            client.logger.error(error)
                        })
                }
            }
        })

        return;
    } catch (error) {
        console.log("ERROR IN BUY LIMIT ORDER: ", error)
    }
}

// Get open orders
exports.getOpenOrdersList = async () => {
    try {
        // Variables
        let canceledOrderArray = [];

        // Connect to Binance account
        const client = new Spot(process.env.API_KEY, process.env.SECRET_KEY);

        // Get list of all open orders
        await client.openOrders()
            .then(async (response) => {
                //console.log("OPEN ORDER: ", response.data);

                await response.data.map(async (oo) => {
                    // Cancel all open orders
                    client.cancelOpenOrders(`${oo.symbol}`, {
                        recvWindow: 3000
                    }).then(async (res) => {
                        client.logger.log("CANCELED: ", res.data)

                        await client.newOrder(`${res.data.symbol}`, 'BUY', 'MARKET', {
                            quantity: res.data.origQty,
                        }).then(resp => client.logger.log("AFTER BUY MRAKET HERE: ", resp.data))
                            .catch(error => {
                                client.logger.error("Error buy market catch here: ", error)
                                buyMarketErrorArray.push(bm);
                            })

                    })
                        .catch(error => client.logger.error("Error get open order list catch: ", error))
                })
            })
        return;

    } catch (error) {
        console.log("ERROR IN GET OPEN ORDER LIST: ", error)
    }
}

// Deposit history
exports.depositInfo = async () => {
    try {
        // Connect to Binance account
        const client = new Spot(process.env.API_KEY, process.env.SECRET_KEY);

        client.depositHistory(
            {
                startTime: 1609459200,
                endTime: 1610751600,
            }
        ).then(response => client.logger.log(response.data))
            .catch(error => client.logger.error(error))

    } catch (error) {
        console.log("ERROR IN DEPOSIT INFO: ", error)
    }
}