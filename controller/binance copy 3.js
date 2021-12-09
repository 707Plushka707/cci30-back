const { Spot } = require('@binance/connector');

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

// Get all details from binance
exports.getBinanceAccountInfoBEFORE = async (apiKey, secretKey, cci30Info) => {
    try {
        const client = new Spot(apiKey, secretKey);

        let assets = [];
        let allOrderPrice = [];

        // Get all assets quantity
        await client.account()
            .then(response => {
                client.logger.log(response.data.balances);
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
                // Get last 120 seconds value of the asset to find the average
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
                                            //client.logger.log("SZ: ", Number(sz.stepSize));
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
                                            //client.logger.log("SZ: ", Number(sz.stepSize));
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
                                        //client.logger.log("SZ: ", Number(sz.stepSize));
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

// Place order to buy other coins if wallet is composed only of BTC
exports.buyOrdersFromBTCBEFORE = async (apiKey, secretKey, total, orderArray, allOrderPrice) => {
    const client = new Spot(apiKey, secretKey);

    await orderArray.map(async (b) => {
        await allOrderPrice.map(async (p) => {
            if (p.asset == b.asset) {
                // Get number of decimal for each qty based on step_size
                let stepSizeDecimal = countDecimals(p.step_size);

                // Get quantity of asset to buy
                let qty = Number((((total * b.order_percentage) / 100) / p.order_price).toFixed(stepSizeDecimal));

                // If order_percentage is less than 0.5, don't buy as maybe the transaction fee will be higher
                if (b.order_percentage >= 0.5) {
                    // Check if it is SHIB or not
                    if (b.asset == "SHIB" && p.asset == "BTC") {
                        // Sell BTCUSDT first and then buy SHIBUSDT
                        // Get number of decimal for each qty based on step_size
                        let stepSizeDecimalUsdt = countDecimals(p.step_size);

                        // Get quantity of asset to buy
                        let qtyUsdt = Number((((total * b.order_percentage) / 100) / p.order_price).toFixed(stepSizeDecimalUsdt));

                        console.log(`SELL: ${p.asset}USDT and ${b.asset}`)

                        // Sell BTC to USDT
                        /*await client.newOrder(`${p.asset}USDT`, 'SELL', 'MARKET', {
                            quantity: qtyUsdt,
                        }).then(async response => {
                            client.logger.log(response.data, ` ASSET SELL: ${p.asset}USDT`)

                            // Buy SHIB against USDT that has just been converted from BTC
                            // Get number of decimal for each qty based on step_size
                            let stepSizeDecimalCoins = countDecimals(p.step_size);

                            // Get quantity of asset to buy
                            let qtyCoins = Number((((total * b.order_percentage) / 100) / p.order_price).toFixed(stepSizeDecimalCoins));
                            await client.newOrder(`${b.asset}USDT`, 'BUY', 'LIMIT', {
                                price: `${p.order_price}`,
                                quantity: qtyCoins,
                                timeInForce: 'GTC'
                            }).then(response => response.data, ` ASSET BUY: ${p.asset}USDT`)
                                .catch(error => client.logger.error(error))
                        })
                            .catch(error => client.logger.error(error))*/

                    } else if (b.asset != "SHIB") {
                        console.log(`ELSE BUY: ${p.asset}USDT and ${b.asset}`)
                        // Place a new order
                        /*await client.newOrder(`${b.asset}BTC`, 'BUY', 'LIMIT', {
                            price: `${p.order_price}`,
                            quantity: qty,
                            timeInForce: 'GTC'
                        }).then(response => client.logger.log(response.data))
                            .catch(error => client.logger.error(error))*/
                    }

                }
            }
        })
    })
};

// Place order to sell other coins in excess to BTC
exports.sellOrdersToBTCBEFORE = async (apiKey, secretKey, total, orderArray, allOrderPrice) => {
    const client = new Spot(apiKey, secretKey);

    await orderArray.map(async (b) => {
        await allOrderPrice.map(async (p) => {
            if (p.asset == b.asset) {
                // Get number of decimal for each qty based on step_size
                let stepSizeDecimal = countDecimals(p.step_size);

                // Get quantity of asset to buy
                let qty = Number((((total * Math.abs(b.order_percentage)) / 100) / p.order_price).toFixed(stepSizeDecimal));

                // If order_percentage is less than 0.5, don't buy as maybe the transaction fee will be higher
                if (Math.abs(b.order_percentage) >= 0.5) {
                    // Check if it is SHIB or not
                    if (b.asset == "SHIB" && p.asset == "BTC") {
                        // Sell SHIBUSDT first and then buy BTCUSDT
                        // Get number of decimal for each qty based on step_size
                        let stepSizeDecimalUsdt = countDecimals(p.step_size);

                        // Get quantity of asset to buy
                        let qtyUsdt = Number((((total * b.order_percentage) / 100) / p.order_price).toFixed(stepSizeDecimalUsdt));
                        console.log(`BUY: ${p.asset}USDT and ${b.asset}`)

                        /*await client.newOrder(`${p.asset}USDT`, 'SELL', 'MARKET', {
                            quantity: qtyUsdt,
                        }).then(async response => {
                            client.logger.log(response.data)

                            // Get number of decimal for each qty based on step_size
                            let stepSizeDecimalCoins = countDecimals(p.step_size);

                            // Get quantity of asset to buy
                            let qtyCoins = Number((((total * b.order_percentage) / 100) / p.order_price).toFixed(stepSizeDecimalCoins));
                            await client.newOrder(`${p.asset}USDT`, 'BUY', 'LIMIT', {
                                price: `${p.order_price}`,
                                quantity: qtyCoins,
                                timeInForce: 'GTC'
                            }).then(response => client.logger.log(response.data))
                                .catch(error => client.logger.error(error))
                        })
                            .catch(error => client.logger.error(error))*/
                    } else if (b.asset != "SHIB") {
                        console.log(`BUY ELSE: ${p.asset}USDT and ${b.asset}`)
                        // Place a new order
                        /* await client.newOrder(`${b.asset}BTC`, 'SELL', 'LIMIT', {
                             price: `${p.order_price}`,
                             quantity: qty,
                             timeInForce: 'GTC'
                         }).then(response => client.logger.log(response.data))
                             .catch(error => client.logger.error(error))*/
                    }
                }
            }
        })
    })
};

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
                // Get last 120 seconds value of the asset to find the average
                if (a.asset != "USDT" || a.asset != "SHIB") {
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
            }
        })

        // Get order price for each asset in cci30
        const orderPriceValue = await cci30Info.map(async (a) => {
            let priceArray = [];
            let order_price;
            let decimalNumber;
            let stepSize;
            let minQty;
            let minNotional;

            if (a.asset != "BTC") {
                // Because SHIBBTC doesn't exist, check if current asset is SHIB
                if (a.asset != "SHIB" || a.asset != "USDT") {
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
                                            // client.logger.log(`LOT ${a.asset}: ${sz.stepSize}`);
                                            stepSize = Number(sz.stepSize);
                                            minQty = Number(sz.minQty);
                                        }
                                        if (sz.filterType == "MIN_NOTIONAL") {
                                            //client.logger.log(`MIN ${a.asset}: ${sz.minNotional}`);
                                            minNotional = Number(sz.minNotional);
                                        }
                                    })
                                })

                            // Update assets allOrderPrice array
                            let tempObj = {
                                asset: a.asset,
                                order_price: order_price,
                                step_size: stepSize,
                                min_qty: minQty,
                                min_notional: minNotional,
                            }

                            allOrderPrice.push(tempObj);
                        })
                } else if (a.asset == "SHIB") {
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
                                            client.logger.log(`LOT 468 ${a.asset}: ${sz.stepSize}`);
                                            stepSize = Number(sz.stepSize);
                                            minQty = Number(sz.minQty);
                                        }
                                        if (sz.filterType == "MIN_NOTIONAL") {
                                            client.logger.log(`LOT 468 ${a.asset}: ${sz.minNotional}`);
                                            minNotional = Number(sz.minNotional);
                                        }
                                    })
                                })

                            // Update assets allOrderPrice array
                            let tempObj = {
                                asset: a.asset,
                                order_price: order_price,
                                step_size: stepSize,
                                min_qty: minQty,
                                min_notional: minNotional,
                            }

                            allOrderPrice.push(tempObj);
                        })
                }
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
                                        client.logger.log(`LOT 509 ${a.asset}: ${sz.stepSize}`);
                                        stepSize = Number(sz.stepSize);
                                        minQty = Number(sz.minQty);
                                    }
                                    if (sz.filterType == "MIN_NOTIONAL") {
                                        client.logger.log(`LOT 509 ${a.asset}: ${sz.minNotional}`);
                                        minNotional = Number(sz.minNotional);
                                    }
                                })
                            })

                        // Update assets allOrderPrice array
                        let tempObj = {
                            asset: a.asset,
                            order_price: order_price,
                            step_size: stepSize,
                            min_qty: minQty,
                            min_notional: minNotional,
                        }

                        allOrderPrice.push(tempObj);
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

// Place order to buy other coins if wallet is composed only of BTC
exports.buyOrdersFromBTC = async (apiKey, secretKey, total, orderArray, allOrderPrice) => {
    const client = new Spot(apiKey, secretKey);

    await orderArray.map(async (b) => {
        await allOrderPrice.map(async (p) => {
            if (p.asset == b.asset) {
                // Call calculate quantity function
                let qty = await calculateQty(total, b, p);
                console.log("QTY 576: ", qty)

                // Get number of decimal for each qty based on step_size
                /*let stepSizeDecimal = countDecimals(p.step_size);

                // Get quantity of asset to buy
                let qty = Number((((total * b.order_percentage) / 100) / p.order_price).toFixed(stepSizeDecimal));

                if (qty == 0 || qty < Number(p.min_notional)) {
                    qty = Number(Number(p.min_notional) / p.order_price).toFixed(stepSizeDecimal);

                    console.log("NOTION: ", p.order_price * qty)
                }*/

                // If order_percentage is less than 0.5, don't buy as maybe the transaction fee will be higher
                if (b.order_percentage >= 0.5) {
                    // Check if it is SHIB or not
                    if (b.asset == "SHIB") {
                        // Sell BTCUSDT first and then buy SHIBUSDT
                        allOrderPrice.map(async p2 => {
                            if (p2.asset == "BTC") {
                                console.log(`LIGNE 564 ===> b.asset: ${b.asset} && p.asset: ${p2.asset}`)
                                let qtyUsdt = await calculateQty(total, b, p2);
                                console.log("QTY 599: ", qtyUsdt)

                                // Sell BTC
                                // Get number of decimal for each qty based on step_size
                                /*let stepSizeDecimalUsdt = countDecimals(p2.step_size);

                                // Get quantity of asset to buy
                                let qtyUsdt = Number((((total * b.order_percentage) / 100) / p2.order_price).toFixed(stepSizeDecimalUsdt));
                                console.log(`LIGNE 598 ===> ${Number(p2.min_notional)} PRICE: ${p2.order_price}`)

                                let notional = Number(p2.order_price) * Number(qtyUsdt);

                                if (qtyUsdt == 0 || notional < Number(p2.min_notional)) {
                                    qtyUsdt = (Number(p2.min_notional) / p2.order_price).toFixed(stepSizeDecimalUsdt);

                                    console.log("NOTION 605: ", p2.order_price * qtyUsdt)

                                    if (Number(notional) < Number(p2.min_notional)) {
                                        do {
                                            qtyUsdt = (Number(qtyUsdt) + Number(p2.step_size)).toFixed(stepSizeDecimalUsdt);
                                            notional = Number(qtyUsdt) * Number(p2.order_price);

                                            console.log("WHILE 610: ", qtyUsdt, " NOTION: ", Number(notional))

                                        } while (Number(notional) < Number(p2.min_notional))
                                    }
                                }*/

                                console.log(`LIGNE 603 ===> ${qtyUsdt} `)
                                await client.newOrder(`${p2.asset}USDT`, 'SELL', 'MARKET', {
                                    quantity: qtyUsdt,
                                }).then(async response => {
                                    //client.logger.log(response.data)

                                    // Buy SHIB
                                    allOrderPrice.map(async (p3) => {
                                        if (p3.asset == "SHIB") {
                                            let qtyCoins = await calculateQty(total, b, p3);
                                            console.log("QTY 637: ", qtyCoins)

                                            // Get number of decimal for each qty based on step_size
                                            /*let stepSizeDecimalCoins = countDecimals(p3.step_size);

                                            // Get quantity of asset to buy
                                            let qtyCoins = Number((((total * b.order_percentage) / 100) / p3.order_price).toFixed(stepSizeDecimalCoins));

                                            if (qtyCoins == 0 || qtyCoins < Number(p3.min_notional)) {
                                                qtyCoins = Number(Number(p3.min_notional) / p3.order_price).toFixed(stepSizeDecimalCoins);
                                            }*/

                                            console.log(`LIGNE 585 ===> b.asset: ${b.asset} && p.asset: ${p3.asset}`)
                                            await client.newOrder(`${b.asset}USDT`, 'BUY', 'LIMIT', {
                                                price: `${p3.order_price}`,
                                                quantity: qtyCoins,
                                                timeInForce: 'GTC'
                                            }).then(response => client.logger.log(response.data))
                                                .catch(error => client.logger.error(error))
                                        }
                                    })

                                })
                                    .catch(error => client.logger.error(error))
                            }
                        })
                    } else {
                        console.log(`LIGNE 595 ===> b.asset: ${b.asset} && p.asset: ${p.asset}`)
                        // Place a new order
                        await client.newOrder(`${b.asset}BTC`, 'BUY', 'LIMIT', {
                            price: `${p.order_price}`,
                            quantity: qty,
                            timeInForce: 'GTC'
                        }).then(response => client.logger.log(response.data))
                            .catch(error => client.logger.error(error))
                    }

                }
            }
        })
    })
};

// Place order to sell other coins in excess to BTC
exports.sellOrdersToBTC = async (apiKey, secretKey, total, orderArray, allOrderPrice) => {
    const client = new Spot(apiKey, secretKey);

    await orderArray.map(async (b) => {
        await allOrderPrice.map(async (p) => {
            if (p.asset == b.asset) {
                let qty = await calculateQty(total, b, p);
                console.log("QTY 688: ", qty)

                // Get number of decimal for each qty based on step_size
                /*let stepSizeDecimal = countDecimals(p.step_size);

                // Get quantity of asset to buy
                let qty = Number((((total * Math.abs(b.order_percentage)) / 100) / p.order_price).toFixed(stepSizeDecimal));

                if (qty == 0 || qty < Number(p.minNotional)) {
                    qty = Number(Number(p.min_notional) / p.order_price).toFixed(stepSizeDecimal);
                }*/

                // If order_percentage is less than 0.5, don't buy as maybe the transaction fee will be higher
                if (Math.abs(b.order_percentage) >= 0.5) {
                    // Check if it is SHIB or not
                    if (b.asset == "SHIB") {
                        // Sell SHIBUSDT first and then buy BTCUSDT
                        allOrderPrice.map(async p2 => {
                            if (p2.asset == "BTC") {
                                console.log(`LIGNE 637 ===> b.asset: ${b.asset} && p.asset: ${p2.asset}`)

                                let qtyUsdt = await calculateQty(total, b, p2);
                                console.log("QTY 710: ", qtyUsdt)
                                // Sell SHIB
                                // Get number of decimal for each qty based on step_size
                                /*let stepSizeDecimalUsdt = countDecimals(p2.step_size);

                                // Get quantity of asset to buy
                                let qtyUsdt = Number((((total * b.order_percentage) / 100) / p2.order_price).toFixed(stepSizeDecimalUsdt));

                                if (qtyUsdt == 0 || qtyUsdt < Number(p2.min_notional)) {
                                    qtyUsdt = Number(Number(p2.min_notional) / p2.order_price).toFixed(stepSizeDecimalUsdt);
                                }*/

                                console.log(`LIGNE 689 ===> ${qtyUsdt} `)
                                await client.newOrder(`${p.asset}USDT`, 'SELL', 'MARKET', {
                                    quantity: qtyUsdt,
                                }).then(response => {
                                    //client.logger.log(response.data)

                                    // Buy BTC
                                    allOrderPrice.map(async (p3) => {
                                        if (p3.asset == "BTC") {
                                            let qtyCoins = await calculateQty(total, b, p2);
                                            console.log("QTY 732: ", qtyCoins)

                                            // Get number of decimal for each qty based on step_size
                                            /*let stepSizeDecimalCoins = countDecimals(p3.step_size);

                                            console.log(`LIGNE 657 ===> b.asset: ${b.asset} && p.asset: ${p3.asset}`)

                                            // Get quantity of asset to buy
                                            let qtyCoins = Number((((total * b.order_percentage) / 100) / p3.order_price).toFixed(stepSizeDecimalCoins));

                                            if (qtyCoins == 0 || qtyCoins < Number(p3.min_notional)) {
                                                qtyCoins = Number(Number(p3.min_notional) / p3.order_price).toFixed(stepSizeDecimalCoins);
                                            }*/

                                            await client.newOrder(`${b.asset}USDT`, 'BUY', 'LIMIT', {
                                                price: `${p3.order_price}`,
                                                quantity: qtyCoins,
                                                timeInForce: 'GTC'
                                            }).then(response => client.logger.log(response.data))
                                                .catch(error => client.logger.error(error))
                                        }
                                    })
                                })
                                    .catch(error => client.logger.error(error))
                            }
                        })
                    } else {
                        console.log(`LIGNE 673 ===> b.asset: ${b.asset} && p.asset: ${p.asset}`)

                        if (b.asset != "BTC" || b.asset != "USDT") {
                            // Place a new order
                            await client.newOrder(`${b.asset}BTC`, 'SELL', 'LIMIT', {
                                price: `${p.order_price}`,
                                quantity: qty,
                                timeInForce: 'GTC'
                            }).then(response => client.logger.log(response.data))
                                .catch(error => client.logger.error(error))
                        }
                    }
                }
            }
        })
    })
};

// Calculate quantity of coin to buy
exports.calculateQty = async (total, order, prices) => {
    let stepSizeDecimal = await countDecimals(prices.step_size);
    let qty = Number((((total * order.order_percentage) / 100) / prices.order_price).toFixed(stepSizeDecimal));
    let minNotional = prices.order_price * qty;

    while (minNotional < Number(prices.min_notional)) {
        qty = (Number(qty) + Number(prices.step_size)).toFixed(stepSizeDecimal);
        minNotional = Number(qty) * Number(prices.order_price);
    }

    console.log("FUNCTION: ", qty);
    return qty;
}
