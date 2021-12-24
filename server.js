const express = require('express');
require('dotenv-extended').load()
const connectDB = require('./config/db');

// Connect Database
connectDB();

const app = express();

// Init Middleware
app.use(express.json());

//Define Routes 
app.use('/api/weight', require('./routes/weight'));
app.use('/api/ohlcv', require('./routes/ohlcv'));
app.use('/api/constituents', require('./routes/constituents'));
app.use('/api/binance', require('./routes/binance'));
app.use('/api/rebalancing', require('./routes/rebalancing'));
app.use('/api/history', require('./routes/history'));

app.get('/', (req, res) => res.json({ msg: 'Welcome to the Waitlist.....' }));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
