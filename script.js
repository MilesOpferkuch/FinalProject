function getTides(station, beginDate, units) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://localhost:3000/tides/${station}/${beginDate}/${units}`);
        xhr.send();
        xhr.onload = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const body = xhr.responseText;
                    resolve(body);
                } else {
                    reject(Error(xhr.responseText));
                }
            }
        }
    })
}

function getMetadata(station) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://localhost:3000/metadata/${station}`);
        xhr.send();
        xhr.onload = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const body = JSON.parse(xhr.response);
                    resolve(body);
                } else {
                    reject(Error(xhr.responseText));
                }
            }
        }
    })
}

function getSunData(lat, lon, date) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://localhost:3000/suntimes/${lat}/${lon}/${date}`)
        xhr.send();
        xhr.onload = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const body = xhr.responseText;
                    resolve(body);
                } else {
                    reject(Error(xhr.responseText));
                }
            }
        }
    })
}

function drawGraph(chart, tideData, date, metadata, timeZoneName, twelveHour, units) {
    // Clear all chart data
    chart.data.datasets[0].data = [];
    // Set graph title and axis titles
    chart.options.plugins.title.text = `Tides on ${date} at station ${metadata.name} (${metadata.station})`;
    chart.options.scales.x.title.text = `Time (${timeZoneName})`;
    chart.options.scales.y.title.text = (units == "english") ? "Height (ft.)" : "Height (meters)";
    // Set x axis format (12 hour or 24 hour)
    (twelveHour) ? (chart.data.labels = labels12h) : (chart.data.labels = labels24h) ;
    // Insert tide data
    let parsedData = JSON.parse(tideData).predictions;
    for (var i = 0; i < parsedData.length; i++) {
        chart.data.datasets[0].data.push(parsedData[i].v);
    }
    chart.update();
}

window.onload = function() {
    // Set up the date picker
    let today = new Date();
    let year = today.getFullYear().toString();
    let month = (today.getMonth() + 1).toString().padStart(2, "0");
    let day = today.getDate().toString().padStart(2, "0");
    let dateString = `${year}-${month}-${day}`; // HTML date picker needs yyyy-mm-dd

    const ctx = document.getElementById("myChart");
    const stationInput = document.getElementById("station");
    const beginDateSelector = document.getElementById("beginDate");
    const sunInfoText = document.getElementsByClassName("sunInfoText");
    const buttonGo = document.getElementById("buttonGo");
    const errorHeader = document.getElementById("errorHeader");
    const errorText = document.getElementById("errorText");
    const radioFeet = document.getElementById("radioFeet");
    const radio12h = document.getElementById("radio12h");
    
    // Set up the graph, make it empty at first
    Chart.defaults.color = '#FFFFFF';
    Chart.defaults.backgroundColor = '#c4c4c4';
    Chart.defaults.borderColor = '#575757';
    const tideChart = new Chart(ctx, chartConfig);
    // Redraw graph when window is resized
    addEventListener("resize", (event) => {
        tideChart.resize();
    });

    // Configure date picker
    beginDateSelector.value = dateString;
    beginDateSelector.min = dateString;

    buttonGo.addEventListener("click", () => {
        let station = stationInput.value;
        // Tides API wants yyyymmdd without dashes
        let beginDate = beginDateSelector.value.replaceAll('-', '');
        let lat = 0;
        let lon = 0;
        // Get selected units
        let units = (radioFeet.checked) ? "english" : "metric";
        // Get selected time format
        let twelveHour = (radio12h.checked) ? true : false;

        getTides(station, beginDate, units).then(
            (tidesResult) => {
                getMetadata(station).then(
                    (metaResult) => {
                        // Get lat and lon from the NOAA station
                        lat = metaResult.lat;
                        lon = metaResult.lng;
                        // Get sunrise/sunset times
                        getSunData(lat, lon, beginDateSelector.value).then(
                            (sunResult) => {
                                const sunData = JSON.parse(sunResult);
                                sunInfoText.first_light.innerText = sunData.first_light;
                                sunInfoText.dawn.innerText = sunData.dawn;
                                sunInfoText.sunrise.innerText = sunData.sunrise;
                                sunInfoText.golden_hour.innerText = sunData.golden_hour;
                                sunInfoText.sunset.innerText = sunData.sunset;
                                sunInfoText.dusk.innerText = sunData.dusk;
                                sunInfoText.last_light.innerText = sunData.last_light;
                                drawGraph(tideChart, tidesResult, beginDateSelector.value, metaResult, sunData.timezone, twelveHour, units);
                                errorHeader.innerText = "";
                                errorText.innerText = "";
                            },
                            (onSunRejected) => {
                                errorHeader.innerText = "Error retrieving sunrise/sunset data:";
                                errorText.innerText = JSON.parse(onSunRejected.message).body;
                            }
                        );
                    },  
                    (onMetaRejected) => {
                        errorHeader.innerText = "Error retrieving station metadata:";
                        errorText.innerText = JSON.parse(onMetaRejected.message).errorMsg;
                    }
                );  
            },
            (onTidesRejected) => {
                errorHeader.innerText = "Error retrieving tide data:";
                errorText.innerText = JSON.parse(onTidesRejected.message).error.message;
            }
        );
        
    })}
