const express = require('express');
const request = require("request");
const cors = require('cors');
const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World! Welcome to Node.js')
})

app.get("/tides/:station/:begin_date/:units", (req, res) => {
    const station = req.params.station;
    const begin_date = req.params.begin_date;
    const units = req.params.units;
    const url = `https://tidesandcurrents.noaa.gov/api/datagetter?product=predictions&begin_date=${begin_date}&range=24&datum=MLLW&station=${station}&time_zone=lst_ldt&units=${units}&interval=60&format=json`
    console.log(url);
    request(url, (error, response, body) => {
        if (error || body.includes("error")) {
            console.log(`Error retrieving tide data: ${body}`);
            return res.status(500).send(body);
        }
        body = JSON.parse(body);
        res.send(body);
    })
});

app.get("/metadata/:station", (req, res) => {
    const station = req.params.station;
    const url = `https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations/${station}.json?units=english`
    console.log(url);
    request(url, (error, response, body) => {
        if (error || body.includes("errorMsg")) {
            console.log("Error retrieving metadata: ", body);
            return res.status(500).send(body);
        } else {
        body = JSON.parse(body).stations[0];
        res.send({
            'station': station,
            'state': body.state,
            'timezonecorr': body.timezonecorr,
            'observedst': body.observedst,
            'name': body.name,
            'lat': body.lat,
            'lng': body.lng});
        }
    })
});

app.get("/suntimes/:lat/:lon/:date", (req, res) => {
    const lat = req.params.lat;
    const lon = req.params.lon;
    const date = req.params.date;
    const url = `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lon}&date=${date}`
    console.log(url);
    request(url, (error, response, body) => {
        if (error || body.includes("ERROR")) {
            console.log("Error retrieving sunrise/sunset data: ", body);
            return res.status(500).send(body);
        } else {
        body = JSON.parse(body);
        res.send(body.results);
        }
    })
});

app.listen(3000, () => {
    console.log('App listening on port 3000!');
});