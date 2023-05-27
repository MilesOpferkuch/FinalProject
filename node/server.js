const express = require('express');
const request = require("request");
const cors = require('cors');
const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World! Welcome to Node.js')
})

app.get("/tides/:station/:begin_date", (req, res) => {
    const station = req.params.station;
    const begin_date = req.params.begin_date;
    const url = `https://tidesandcurrents.noaa.gov/api/datagetter?product=predictions&begin_date=${begin_date}&range=24&datum=MLLW&station=${station}&time_zone=lst_ldt&units=english&interval=30&format=json`
    console.log(url);
    request(url, (error, response, body) => {
        if (error) {
            return res.status(500).send("Error retrieving tide data.");
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
        if (error) {
            return res.status(500).send("Error retrieving station metadata.");
        }
        body = JSON.parse(body).stations[0];
        res.send({
            'station': station,
            'state': body.state,
            'timezonecorr': body.timezonecorr,
            'observedst': body.observedst,
            'name': body.name,
            'lat': body.lat,
            'lng': body.lng});
    })
});

app.get("/suntimes/:lat/:lon/:tz/:date", (req, res) => {
    const lat = req.params.lat;
    const lon = req.params.lon;
    const tz = req.params.tz;
    const date = req.params.date;
    const url = `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lon}&timezone=${tz}&date=${date}`
    console.log(url);
    request(url, (error, response, body) => {
        if (error) {
            return res.status(500).send("Error retrieving sunrise/sunset data.");
        }
        body = JSON.parse(body);
        res.send(body);
    })
});

app.get("/timezone/:lat/:lon/:timestamp", (req, res) => {
    const lat = req.params.lat;
    const lon = req.params.lon;
    const timestamp = req.params.timestamp;
    
    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat}%2C${lon}&timestamp=${timestamp}&key=AIzaSyBQoqoV57zkl9rIHLKVKAbMpsdVddOZNWQ`;
    console.log(url);
    request(url, (error, response, body) => {
        if (error) {
            return res.status(500).send("Error retrieving timezone data.");
        }
        body = JSON.parse(body);
        res.send(body);
    })
})

app.listen(3000, () => {
    console.log('App listening on port 3000!');
});