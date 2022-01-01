const mongoose = require('mongoose');

// Create Schema
const BtcPriceHistorySchema = mongoose.Schema({
    date: {
        type: String,
        required: [true, "Please provide a date for BTC price"]
    },
    currency: {
        type: String,
        required: [true, "Please provide a currency for this BTC price"]
    },
    price: {
        type: Number,
        required: [true, "Please provide the BTC price for this curerncy"]
    },
},
    {
        timestamps: true
    }
);

const BtcPriceHistory = mongoose.model("BtcPriceHistory", BtcPriceHistorySchema);

module.exports = BtcPriceHistory;