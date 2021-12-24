const {
    getBinanceAccountInfo,
    getAllUSDTPairs,
    getUsdtOrderPrice,
    getBinanceWalletBTCValues,
    getOrderListWithoutQty,
    getOrderQty,
    placeSellMarketOrders,
    placeBuyLimitOrders,
    getOpenOrdersList,
    placeBuyMarketOrders,
    convertToBnb
} = require('./binance');
const { getCCi30Info } = require('./constituents');

exports.getBTCrebalancing2 = async (req, res, next) => {
    try {
        // Variables
        let cci30UsdtPairs;
        let cci30UsdtOrderPrice;
        let binanceAccount;

        // 1. Get all constituents info from Google Sheet
        const cci30Info = await getCCi30Info()
            .then(async (cci30details) => {

                // 2. Get all cci30 USDT value
                await getAllUSDTPairs(cci30details)
                    .then(async (usdtpairs) => {

                        // 3. Get all cci30 USDT order price
                        await getUsdtOrderPrice(usdtpairs[0])
                            .then(async (orderprice) => {
                                //console.log("ODR PRICE: ", orderprice[0])

                                // 4. Get client account info
                                await getBinanceAccountInfo(process.env.API_KEY, process.env.SECRET_KEY)
                                    .then(async (clientwallet) => {
                                        //console.log("WALLET CLIENT: ", clientwallet);

                                        // 5. Get wallet BTC value of each coins
                                        await getBinanceWalletBTCValues(clientwallet, usdtpairs[0])
                                            .then(async (walletBTCweight) => {
                                                //console.log("PERCENTAGE: ", walletBTCweight.clientWallet)
                                                //console.log("TOTAL BTC: ", walletBTCweight.totalBTC)

                                                // 6. Get order list
                                                await getOrderListWithoutQty(walletBTCweight.clientWallet, cci30details, usdtpairs[0])
                                                    .then(async (orders) => {
                                                        console.log("ORDER LIST: ", orders[0].orderList);
                                                        console.log("NOT IN CCI30: ", orders[0].notInCci30);

                                                        if (orders[0].notInCci30.length == 0) {
                                                            // Get all orders quantity
                                                            await getOrderQty(orders[0].orderList, usdtpairs[0], walletBTCweight.totalBTC)
                                                                .then(async (ordersWithQty) => {
                                                                    console.log("ORDER WITH QTY: ", ordersWithQty[0]);

                                                                    // Place order
                                                                })
                                                        } else {
                                                            // Get historical trade of not in CCi30 asset

                                                        }
                                                    })
                                            })
                                    })
                            });
                    });
            });

        //console.log(cci30Info)

        // 2. Get all cci30 USDT value
        /*setTimeout(async () => {
            cci30UsdtPairs = await getAllUSDTPairs(cci30Info);
        }, 5000);

        setTimeout(async () => {
            // 3. Get all cci30 USDT value
            cci30UsdtOrderPrice = await getUsdtOrderPrice(cci30UsdtPairs);
        }, 10000);

        set
        console.log("THERE YOU GO:", cci30UsdtOrderPrice);*/

        /*
                // 2. Get all asset info from Binance account
                const binanceAccount = await getBinanceAccountInfo(process.env.API_KEY, process.env.SECRET_KEY, cci30Info)
        
                // 3. Compare existing assets weight
                let orderList = [];
        
                // Loop though each cci30 constituent and check if binance account has the constituent
                const mapCCi30 = await cci30Info.map(async (c) => {
                    let exist = 0;
                    let differenceCB = 0;
                    let order_type;
        
                    await binanceAccount.assets.map(async (b) => {
                        // If it's already in the binance account, just ajust the weight
                        if (c.asset == b.asset) {
                            exist = exist + 1;
        
                            differenceCB = Number((c.weight - b.weight_percentage).toFixed(2));
        
                            // If difference > 0 ==> we shall buy the the asset with weight differenceCB
                            // Else we shall sell the excess
                            if (differenceCB > 0) {
                                order_type = "BUY"
                            } else {
                                order_type = "SELL"
                            }
        
                            let tempObj = {
                                asset: c.asset,
                                order_type: order_type,
                                order_percentage: differenceCB
                            }
        
                            orderList.push(tempObj);
                        }
                    })
        
                    if (exist == 0) {
                        let tempObj = {
                            asset: c.asset,
                            order_type: "BUY",
                            order_percentage: c.weight
                        }
        
                        orderList.push(tempObj);
                    }
                })
        
                // 4. Check if account has only BTC or other coins
                Promise.all(mapCCi30).then(async () => {
                    if (binanceAccount.assets.length == 1 && binanceAccount.assets[0].asset == "BTC") {
                        // Get total BTC value of the account
                        let total = 0;
                        await binanceAccount.assets.map(async (b) => {
                            total = total + b.btc_value;
                        })
        
                        // Get only assets that require buy
                        let buyOnlyOrders = [];
                        await orderList.map(async (o) => {
                            if (o.order_type == "BUY") {
                                buyOnlyOrders.push(o);
                            }
                        })
        
                        // Calculate BTC to sell for other coin
                        await buyOrdersFromBTC(process.env.API_KEY, process.env.SECRET_KEY, total, buyOnlyOrders, binanceAccount.allOrderPrice)
        
                    } else {
                        // Get total BTC value of the account
                        let totalElse = 0;
                        await binanceAccount.assets.map(async (b) => {
                            totalElse = totalElse + b.btc_value;
                        })
        
                        // Get only assets that require buy
                        let sellOnlyOrders = [];
                        await orderList.map(async (o) => {
                            if (o.order_type == "SELL") {
                                sellOnlyOrders.push(o);
                            }
                        })
        
                        let buyOnlyOrders = [];
                        await orderList.map(async (o) => {
                            if (o.order_type == "BUY") {
                                buyOnlyOrders.push(o);
                            }
                        })
        
                        // Perform all sell first
                        await sellOrdersToBTC(process.env.API_KEY, process.env.SECRET_KEY, totalElse, sellOnlyOrders, binanceAccount.allOrderPrice)
                        // Perform all buy 
                        await buyOrdersFromBTC(process.env.API_KEY, process.env.SECRET_KEY, totalElse, buyOnlyOrders, binanceAccount.allOrderPrice)
                    }
                });
        
        
                res.status(200).json({ binanceAccount, cci30Info });*/

        res.status(200).json(cci30UsdtOrderPrice);


    } catch (error) {
        console.log(error)
    }
}

const isInArray = (arrayToCkeck, assetToCheck) => {
    let arr = arrayToCkeck;

    return arr.some(function (a) {
        return a.asset === assetToCheck;
    });
}

exports.getBTCrebalancing = async (req, res, next) => {
    try {
        // Variables
        let cci30UsdtPairs;
        let cci30UsdtOrderPrice;
        let binanceAccount;

        // 0. Get Binance wallet info
        const cci30Info = await getBinanceAccountInfo(process.env.API_KEY, process.env.SECRET_KEY)
            .then(async (clientwallet) => {
                //console.log("WALLET CLIENT: ", clientwallet);

                // 1. Get all constituents info from Google Sheet
                await getCCi30Info()
                    .then(async (cci30details) => {
                        //console.log("CONSTITUENT: ", cci30details);

                        // 2. Get all cci30 USDT value
                        await getAllUSDTPairs(clientwallet, cci30details)
                            .then(async (usdtpairs) => {
                                //console.log("HERE: ", usdtpairs[0])

                                // 3. Get all cci30 USDT order price
                                await getUsdtOrderPrice(usdtpairs[0])
                                    .then(async (orderprice) => {
                                        //console.log("ODR PRICE: ", orderprice[0])

                                        // 5. Get wallet BTC value of each coins
                                        await getBinanceWalletBTCValues(clientwallet, usdtpairs[0])
                                            .then(async (walletBTCweight) => {
                                                console.log("PERCENTAGE: ", walletBTCweight.clientWallet)
                                                //console.log("TOTAL BTC: ", walletBTCweight.totalBTC)
                                                //console.log("TOTAL BTC: ", walletBTCweight.totalUSDT)

                                                // 6. Get order list
                                                await getOrderListWithoutQty(walletBTCweight.clientWallet, walletBTCweight.totalUSDT, cci30details, usdtpairs[0])
                                                    .then(async (orders) => {
                                                        //console.log("ORDER LIST: ", orders.orderList);
                                                        //console.log("NOT IN CCI30: ", orders.notInCci30);

                                                        // Variables
                                                        let canceledOrdersArray;

                                                        // 7. Get all orders quantity
                                                        // await getOrderQty(orders.orderList, usdtpairs[0], walletBTCweight.totalBTC)
                                                        if (orders.orderList.length > 0) {
                                                            await getOrderQty(orders.orderList, usdtpairs[0], walletBTCweight.totalBTC)
                                                                .then(async (ordersWithQty) => {
                                                                    console.log("ORDER WITH QTY: ", ordersWithQty[0]);

                                                                    // Place all sell market order first
                                                                    let sellOrders = [];
                                                                    let buyOrders = [];

                                                                    const waitForSellOrdersArray = await ordersWithQty[0].map(async (o) => {
                                                                        if (o.order_type == "SELL") {
                                                                            //console.log("OOOO: ", o)
                                                                            if (isInArray(sellOrders, o.asset) == false) {
                                                                                sellOrders.push(o);
                                                                            }

                                                                        } else {
                                                                            if (isInArray(buyOrders, o.asset) == false) {
                                                                                buyOrders.push(o);
                                                                            }
                                                                        }
                                                                    })

                                                                    //console.log("ALL SELL: ", sellOrders);
                                                                    //console.log("ALL BUY: ", buyOrders);

                                                                    if (sellOrders.length > 0) {
                                                                        await placeSellMarketOrders(sellOrders)
                                                                            .then(async (sellMarketOrdersDone) => {
                                                                                console.log("SELL MARKET ORDERS DONE:")
                                                                            })
                                                                    }
                                                                    /*else {
                                                                        await placeBuyLimitOrders(buyOrders)
                                                                            .then(async (buyLimitOrdersDone) => {
                                                                                console.log("BUY LIMIT ORDERS DONE:")
                                                                            })
                                                                    }*/

                                                                    // Place all buy limit order after 3min so that we are sure that 
                                                                    // are executed all sell markets
                                                                    setTimeout(async () => {
                                                                        await placeBuyLimitOrders(buyOrders)
                                                                            .then(async (buyLimitOrdersDone) => {
                                                                                console.log("BUY LIMIT ORDERS DONE: ", buyLimitOrdersDone)
                                                                            })
                                                                    }, 1 * 60 * 1000);
                                                                })

                                                            // Check for limit orders that have not been executed yet
                                                            // Cancel them and go for market orders
                                                            setTimeout(async () => {
                                                                await getOpenOrdersList()
                                                                    .then(async (canceledOrders) => {
                                                                        console.log("Canceled Orders: ", canceledOrders)
                                                                        canceledOrdersArray = canceledOrders;
                                                                    })
                                                            }, 2 * 60 * 1000);

                                                            // Convert dust to BNB
                                                            setTimeout(async () => {
                                                                await convertToBnb()
                                                                    .then(() => {
                                                                        console.log("CONVERT DUST TO BNB DONE: ")
                                                                    })
                                                            }, 3 * 60 * 1000);

                                                            // Place all buy market orders for orders that have been canceled
                                                            /*setTimeout(async () => {
                                                                // Variables
                                                                let buyMarketArray = [];

                                                                await canceledOrdersArray.map(async (co) => {
                                                                    await buyOrders.map(async (bo) => {
                                                                        if (co.symbol == `${bo.asset}USDT`) {
                                                                            buyMarketArray.push(bo);
                                                                        }
                                                                    })
                                                                })

                                                                if (buyMarketArray.length > 0) {
                                                                    await placeBuyMarketOrders(buyMarketArray)
                                                                        .then(async (buyMarketOrders) => {
                                                                            console.log("after buy market Orders: ", buyMarketOrders)
                                                                        })
                                                                }
                                                            }, 3 * 60 * 1000);*/
                                                        }
                                                    })
                                            })
                                    })
                            });
                    });
            });

        res.status(200).json(cci30UsdtOrderPrice);


    } catch (error) {
        console.log(error)
    }
}

exports.afterSellMarketBatch = async (req, res, next) => {
    try {
        // Variables
        let cci30UsdtPairs;
        let cci30UsdtOrderPrice;
        let binanceAccount;

        // 0. Get Binance wallet info
        const cci30Info = await getBinanceAccountInfo(process.env.API_KEY, process.env.SECRET_KEY)
            .then(async (clientwallet) => {
                //console.log("WALLET CLIENT: ", clientwallet);

                // 1. Get all constituents info from Google Sheet
                await getCCi30Info()
                    .then(async (cci30details) => {

                        // 2. Get all cci30 USDT value
                        await getAllUSDTPairs(clientwallet, cci30details)
                            .then(async (usdtpairs) => {
                                //console.log("HERE: ", usdtpairs[0])

                                // 3. Get all cci30 USDT order price
                                await getUsdtOrderPrice(usdtpairs[0])
                                    .then(async (orderprice) => {
                                        //console.log("ODR PRICE: ", orderprice[0])

                                        // 5. Get wallet BTC value of each coins
                                        await getBinanceWalletBTCValues(clientwallet, usdtpairs[0])
                                            .then(async (walletBTCweight) => {
                                                //console.log("PERCENTAGE: ", walletBTCweight.clientWallet)
                                                //console.log("TOTAL BTC: ", walletBTCweight.totalBTC)

                                                // 6. Get order list
                                                await getOrderListWithoutQty(walletBTCweight.clientWallet, cci30details, usdtpairs[0])
                                                    .then(async (orders) => {
                                                        //console.log("ORDER LIST: ", orders.orderList);
                                                        //console.log("NOT IN CCI30: ", orders.notInCci30);

                                                        // 7. Get all orders quantity
                                                        await getOrderQty(orders.orderList, usdtpairs[0], walletBTCweight.totalBTC)
                                                            .then(async (ordersWithQty) => {
                                                                //console.log("ORDER WITH QTY: ", ordersWithQty[0]);

                                                                // Place all sell market order first
                                                                let sellOrders = [];
                                                                let buyOrders = [];

                                                                const waitForSellOrdersArray = await ordersWithQty[0].map(async (o) => {
                                                                    if (o.order_type == "SELL") {
                                                                        if (isInArray(sellOrders, o.asset) == false) {
                                                                            sellOrders.push(o);
                                                                        }

                                                                    } else {
                                                                        if (isInArray(buyOrders, o.asset) == false) {
                                                                            buyOrders.push(o);
                                                                        }
                                                                    }
                                                                })

                                                                console.log("ALL SELL AFTER: ", sellOrders);
                                                                console.log("ALL BUY AFTER: ", buyOrders);

                                                                if (sellOrders.length > 0) {
                                                                    await placeSellMarketOrders(sellOrders)
                                                                        .then(async (sellMarketOrdersDone) => {
                                                                            console.log("SELL MARKET ORDERS DONE:")

                                                                            /*await placeBuyLimitOrders(buyOrders)
                                                                                .then(async (buyLimitOrdersDone) => {
                                                                                    console.log("BUY LIMIT ORDERS DONE:")
                                                                                })*/
                                                                        })
                                                                } else {
                                                                    console.log("BUY ARRAY: ", buyOrders)
                                                                    await placeBuyLimitOrders(buyOrders)
                                                                        .then(async (buyLimitOrdersDone) => {
                                                                            console.log("BUY LIMIT ORDERS DONE:")
                                                                        })
                                                                }


                                                                // Place all buy limit order
                                                            })

                                                        /*if (orders[0].notInCci30.length == 0) {
                                                            // Get all orders quantity
                                                            await getOrderQty(orders[0].orderList, usdtpairs[0], walletBTCweight.totalBTC)
                                                                .then(async (ordersWithQty) => {
                                                                    console.log("ORDER WITH QTY: ", ordersWithQty[0]);

                                                                    // Place order
                                                                })
                                                        } else {
                                                            // Get historical trade of not in CCi30 asset

                                                        }*/
                                                    })
                                            })
                                    })
                            });
                    });
            });

        res.status(200).json(cci30UsdtOrderPrice);


    } catch (error) {
        console.log(error)
    }
}

// Place order to sell all excess weight to BTC.. only call this action if there is any other coin than BTC

// Place order to buy other coins if wallet is composed only of BTC



// Place order to buy all remaining constituents
const getAccountInfoAfterBTCRebalancing = async () => {

    // 1. Get the new Binance account info after all excesses have been transfered to BTC
    const binanceAccount = await getBinanceAccountInfo(process.env.API_KEY, process.env.SECRET_KEY)

    // 2. Get all constituents info from Google Sheet
    const cci30Info = await getCCi30Info();

    // 3. Compare existing assets weight
    let orderList = [];

    // Loop though each cci30 constituent and check if binance account has the constituent
    await cci30Info.map(async (c) => {
        let exist = 0;
        let differenceCB = 0;
        let order_type;

        await binanceAccount.assets.map(async (b) => {
            // If it's already in the binance account, just ajust the weight
            if (c.asset == b.asset) {
                exist = exist + 1;

                differenceCB = Number((c.weight - b.weight_percentage).toFixed(2));

                // If difference > 0 ==> we shall buy the the asset with weight differenceCB
                // Else we shall sell the excess
                if (differenceCB > 0) {
                    order_type = "BUY"
                } else {
                    order_type = "SELL"
                }

                let tempObj = {
                    asset: c.asset,
                    order_type: order_type,
                    order_percentage: differenceCB
                }

                orderList.push(tempObj);
            }
        })

        if (exist == 0) {
            let tempObj = {
                asset: c.asset,
                order_type: "BUY",
                order_percentage: c.weight
            }

            orderList.push(tempObj);
        }
    })

    res.status(200).json(orderList);
}