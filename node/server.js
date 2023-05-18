const express = require('express');
const request = require("request");
const cors = require('cors');
const app = express();
app.use(cors());

app.get("tides/:station/:begin_date/:end_date/:tz", (req, res) => {
    console.log("wtf");
    const station = req.params.station;
    const begin_date = req.params.begin_date;
    const end_date = req.params.end_date;
    const tz = req.params.tz;
    const url = `https://tidesandcurrents.noaa.gov/api/datagetter?product=predictions&begin_date=${begin_date}&end_date=${end_date}&datum=MLLW&station=${station}&time_zone=${tz}&units=english&interval=1&format=json`

    request(url, (error, response, body) => {
        if (error) {
            return res.status(500).send("Error retrieving tide data.");
        }
        body = JSON.parse(body);
        console.log(body);
        res.send(body.main);
    })
});

app.get("metadata/:station", (req, res) => {
    const station = req.params.station;
    const url = `https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations/${station}.json?units=english`

    request(url, (error, response, body) => {
        if (error) {
            return res.status(500).send("Error retrieving station metadata.");
        }
        body = JSON.parse(body);
        console.log(body);
    })
});

app.get("suntimes/:lat/:lon/:tz/:date", (req, res) => {
    const lat = req.params.lat;
    const lon = req.params.lon;
    const tz = req.params.tz;
    const date = req.params.date;
    const url = `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lon}&timezone=${tz}&date=${date}`

    request(url, (error, response, body) => {
        if (error) {
            return res.status(500).send("Error retrieving sunrise/sunset data.");
        }
        body = JSON.parse(body);
        console.log(body);
    })

})

app.listen(3000, () => {
    console.log('App listening on port 3000!');
});