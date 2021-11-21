require('dotenv-extended').load()
const moment = require('moment');

const {
    getAuthToken,
    getSpreadSheet,
    getSpreadSheetValues
} = require('./googleSheetsService.js');

const spreadsheetId = process.env.OHLCV_SHEET_ID;
const sheetName = process.env.OHLCV_SHEET_NAME;

exports.getSpreadSheet = async (req, res, next) => {
    try {
        const auth = await getAuthToken();
        const response = await getSpreadSheet({
            spreadsheetId,
            auth
        })
        //console.log('output for getSpreadSheet', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log(error.message, error.stack);
    }
}

exports.getSpreadSheetValues = async (req, res, next) => {
    try {
        const auth = await getAuthToken();
        const response = await getSpreadSheetValues({
            spreadsheetId,
            sheetName,
            auth
        })
        //console.log('output for getSpreadSheetValues', JSON.stringify(response.data, null, 2));

        res.status(200).json(response.data);
    } catch (error) {
        console.log(error.message, error.stack);
    }
}

exports.getSpreadSheetValuesMonthly = async (req, res, next) => {
    let yearArray = [];
    let monthArray = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    let finalArray = [];
    const startDate = moment('01/01/2015', "DD/MM/YYYY");
    const todayDate = moment(new Date());

    try {
        const auth = await getAuthToken();
        const response = await getSpreadSheetValues({
            spreadsheetId,
            sheetName,
            auth
        })

        // Initialize yearArray
        for (let i = 0; i <= todayDate.diff(startDate, 'years'); i++) {
            let y = 2015 + i;
            yearArray.push(y.toString());
        }

        for (let j = 0; j < yearArray.length; j++) {
            for (let k = 0; k < monthArray.length; k++) {
                let currentMonthArray = [];
                let pushIntoFinalArray = [];

                let date;
                let open;
                let high;
                let low;
                let close;

                let monthData = response.data.values
                    .filter(res =>
                        moment(moment.unix(moment(res[0], "DD/MM/YYYY").unix()).format("YYYY-MM-DD")).format('YYYY') == yearArray[j] &&
                        moment(moment.unix(moment(res[0], "DD/MM/YYYY").unix()).format("YYYY-MM-DD")).format('MM') == monthArray[k]
                    )

                if (monthData.length > 0) {
                    monthData.map((d,) => {
                        let dataDay = moment(moment.unix(moment(d[0], "DD/MM/YYYY").unix()).format("YYYY-MM-DD")).format('DD');
                        let tempArray = [];

                        tempArray[0] = moment.unix(moment(d[0], "DD/MM/YYYY").unix()).format("YYYY-MM-DD");
                        tempArray[1] = Number(parseFloat(d[1].replace(',', '.')).toFixed(2));
                        tempArray[2] = Number(parseFloat(d[2].replace(',', '.')).toFixed(2));
                        tempArray[3] = Number(parseFloat(d[3].replace(',', '.')).toFixed(2));
                        tempArray[4] = Number(parseFloat(d[4].replace(',', '.')).toFixed(2));

                        currentMonthArray.push(tempArray);

                        // Get date and open price of the month
                        if (dataDay == '01') {
                            date = tempArray[0];
                            open = tempArray[1];
                        }
                    })

                    //Get highest price of the month
                    let highArray = currentMonthArray.sort((a, b) => a[2] > b[2] ? -1 : 1);
                    high = highArray[0][2];

                    //Get lowest price of the month
                    let lowArray = currentMonthArray.sort((a, b) => a[3] > b[3] ? 1 : -1);
                    low = lowArray[0][3];

                    // Get close price of the day
                    let closeArray = currentMonthArray.sort((a, b) => moment(a[0], "YYYY-MM-DD") > moment(b[0], "YYYY-MM-DD") ? -1 : 1);
                    close = closeArray[0][4];

                    // Create the array to push into the final one
                    pushIntoFinalArray[0] = date;
                    pushIntoFinalArray[1] = open.toString();
                    pushIntoFinalArray[2] = high.toString();
                    pushIntoFinalArray[3] = low.toString();
                    pushIntoFinalArray[4] = close.toString();

                    finalArray.push(pushIntoFinalArray);
                }
            }
        }

        res.status(200).json(finalArray);
    } catch (error) {
        console.log(error.message, error.stack);
    }
}
