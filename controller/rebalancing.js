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
    convertToBnbArray,
    convertToBnb
} = require('./binance');
const { getCCi30Info } = require('./constituents');

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
                                                //console.log("PERCENTAGE: ", walletBTCweight.clientWallet)
                                                //console.log("TOTAL BTC: ", walletBTCweight.totalBTC)
                                                //console.log("TOTAL BTC: ", walletBTCweight.totalUSDT)

                                                // 6. Get order list
                                                await getOrderListWithoutQty(walletBTCweight.clientWallet, walletBTCweight.totalUSDT, cci30details, usdtpairs[0])
                                                    .then(async (orders) => {
                                                        //console.log("ORDER LIST: ", orders.orderList);
                                                        console.log("NOT IN CCI30: ", orders.notInCci30);

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
                                                                getCCi30Info()
                                                                .then(async (cci30details2) => {
                                                                    await getBinanceAccountInfo(process.env.API_KEY, process.env.SECRET_KEY)
                                                                        .then(async (walletInfo) => {
                                                                            await convertToBnbArray(cci30details2, walletInfo)
                                                                                .then(async (toBnbArray) => {
                                                                                    console.log("CONVERT DUST TO BNB DONE: ", toBnbArray)
                                                                                    await convertToBnb(toBnbArray)
                                                                                })
                                                                        })
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

                                                        // Convert dust to BNB
                                                        /*setTimeout(async () => {
                                                            getCCi30Info()
                                                                .then(async (cci30details2) => {
                                                                    await getBinanceAccountInfo(process.env.API_KEY, process.env.SECRET_KEY)
                                                                        .then(async (walletInfo) => {
                                                                            await convertToBnbArray(cci30details2, walletInfo)
                                                                                .then(async (toBnbArray) => {
                                                                                    console.log("CONVERT DUST TO BNB DONE: ", toBnbArray)
                                                                                    await convertToBnb(toBnbArray)
                                                                                })
                                                                        })
                                                                })
                                                        }, 1 * 60 * 1000);*/
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
                                        console.log("ODR PRICE: ", orderprice[0])

                                        // 5. Get wallet BTC value of each coins
                                        await getBinanceWalletBTCValues(clientwallet, usdtpairs[0])
                                            .then(async (walletBTCweight) => {
                                                console.log("PERCENTAGE: ", walletBTCweight.clientWallet)
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
                                                                        })
                                                                } else {
                                                                    console.log("BUY ARRAY: ", buyOrders)
                                                                    await placeBuyLimitOrders(buyOrders)
                                                                        .then(async (buyLimitOrdersDone) => {
                                                                            console.log("BUY LIMIT ORDERS DONE:")
                                                                        })
                                                                }
                                                            })
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
