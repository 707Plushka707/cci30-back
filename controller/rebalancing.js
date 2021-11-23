const { getBinanceAccountInfo } = require('./binance')
const { getCCi30Info } = require('./constituents')

exports.getBTCrebalancing = async (req, res, next) => {
    try {
        // 1. Get all asset info from Binance account
        const binanceAccount = await getBinanceAccountInfo('eUzRDZRLKCoS2d3Ttpy6F9mneuOZUuMGHlTW2MYtDZ9qqoCny4SVuHMCAn6ESwGd', '5LMOrukq9UYAIqZKbEIzJ9mqvn7jFKNQynHlsqG4bjVG5LFwyGbWjCZ41sG5Xwev')

        // 2. Get all constituents info from Google Sheet
        const cci30Info = await getCCi30Info();

        // 3. Compare existing assets weight
        let orderList = [];

        // Loop though each cci30 constituent and check if binance account has the constituent
        await cci30Info.map(async (c) => {
            let exist = 0;
            let differenceCB = 0;
            let order_type;

            await binanceAccount.map(async (b) => {
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
    } catch (error) {
        console.log(error)
    }
}

// Place order to sell all excess weight to BTC

// Place order to buy all remaining constituents