const { getBinanceAccountInfo, buyOrdersFromBTC, sellOrdersToBTC, getAllUSDTPairs, getUsdtOrderPrice } = require('./binance')
const { getCCi30Info } = require('./constituents')

exports.getBTCrebalancing = async (req, res, next) => {
    try {
        // Variables
        let cci30UsdtPairs;
        let cci30UsdtOrderPrice;

        // 1. Get all constituents info from Google Sheet
        const cci30Info = await getCCi30Info()
            .then(async (cci30details) => {

                // 2. Get all cci30 USDT value
                cci30UsdtPairs = await getAllUSDTPairs(cci30details)
                    .then(async (usdtpairs) => {

                        // 3. Get all cci30 USDT order price
                        cci30UsdtOrderPrice = await getUsdtOrderPrice(usdtpairs[0])
                            .then(async (orderprice) => {
                                //console.log("ODR PRICE: ", orderprice[0])

                                // 4. Get client account info
                                binanceAccount = await getBinanceAccountInfo(process.env.API_KEY, process.env.SECRET_KEY, cci30details)
                                    .then(async (clientinfo) => {
                                        console.log(clientinfo);
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