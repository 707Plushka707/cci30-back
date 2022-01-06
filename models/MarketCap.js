const mongoose = require('mongoose');

// Create Schema
const MarketCapSchema = mongoose.Schema({
    date: {
        type: String,
        required: [true, "Please provide a date for market cap data"]
    },
    marketCaps: {
        type: Array,
        required: [true, "Please provide array of market cap"]
    },
},
    {
        timestamps: true
    }
);

const MarketCap = mongoose.model("MarketCap", MarketCapSchema);

module.exports = MarketCap;