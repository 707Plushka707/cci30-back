const mongoose = require('mongoose');

// Create Schema
const AccountSnapshotSchema = mongoose.Schema({
    uid: {
        type: String,
        require: true
    },
    date: {
        type: String,
        required: [true, "Please provide a date for account snapshot"]
    },
    totalAssetOfBtc: {
        type: Number,
        required: [true, "Please provide a total asset BTC value"]
    },
    balances: {
        type: Array,
        required: [true, "Please provide an array of assets inside user account"]
    },
},
    {
        timestamps: true
    }
);

const AccountSnapshot = mongoose.model("AccountSnapshot", AccountSnapshotSchema);

module.exports = AccountSnapshot;