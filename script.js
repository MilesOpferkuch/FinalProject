function getTides(station, beginDate) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://localhost:3000/tides/${station}/${beginDate}`);
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

function getTimezoneData(lat, lon, timestamp) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://localhost:3000/timezone/${lat}/${lon}/${timestamp}`)
        xhr.send();
        xhr.onload = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const body = JSON.parse(xhr.responseText);
                    resolve(body);
                } else {
                    reject(Error(xhr.responseText));
                }
            }
        }        
    })
}

function getSunData(lat, lon, tz, date) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://localhost:3000/suntimes/${lat}/${lon}/${tz}/${date}`)
        xhr.send();
        xhr.onload = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const body = JSON.parse(xhr.responseText);
                    resolve(body);
                } else {
                    reject(Error(xhr.responseText));
                }
            }
        }
    })
}

function drawGraph(chart, tideData, date, metadata, timeZoneName) {
    // Clear all chart data
    chart.data.datasets[0].data = [];
    // Set text
    chart.options.plugins.title.text = `Tides on ${date} at station ${metadata.name} (${metadata.station})`;
    chart.options.scales.x.title.text = `Time (${timeZoneName})`
    // Insert new data
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
    const beginDateSelector = document.getElementById("begin_date");
    const sunInfoText = document.getElementsByClassName("sunInfoText");
    const buttonGo = document.getElementById("buttonGo");
    const errorText = document.getElementById("errortext")

    // Set up the graph, make it empty at first
    Chart.defaults.color = '#FFFFFF';
    Chart.defaults.backgroundColor = '#c4c4c4';
    Chart.defaults.borderColor = '#575757';
    const tideChart = new Chart(ctx, chartConfig);

    // Configure date picker
    beginDateSelector.value = dateString;
    beginDateSelector.min = dateString;

    buttonGo.addEventListener("click", () => {
        let station = stationInput.value;
        // Tides API wants yyyymmdd without dashes
        let beginDate = beginDateSelector.value.replaceAll('-', '');
        let lat = 0;
        let lon = 0;
        getTides(station, beginDate).then(
            (tidesResult) => {
                getMetadata(station).then(
                    (metaResult) => {
                        // Get lat, lon and timezone info from the NOAA station
                        lat = metaResult.lat;
                        lon = metaResult.lng;
                        // NOAA doesn't return the time compensated for DST
                        // so we check with Google timezone API and the following monstrosity:
                        let tzString = Math.abs(metaResult.timezonecorr).toString();
                        tzString = tzString.padStart(2, '0');
                        if (metaResult.timezonecorr < 0) {
                            tzString = '-' + tzString;
                        } else {
                            tzString = '+' + tzString;
                        }
                        let dateObject = new Date(`${beginDateSelector.value}T00:00:00.000${tzString}:00`)
                        let timestamp = dateObject.valueOf()/1000;
                        // Fetch timezone data from Google's API
                        getTimezoneData(metaResult.lat, metaResult.lng, timestamp).then(
                            (tzResult) => {
                                tzOffset = (tzResult.rawOffset + tzResult.dstOffset)/60/60;
                                // Get sunrise/sunset times
                                getSunData(lat, lon, tzOffset, beginDateSelector.value).then(
                                    (sunResult) => {
                                        sunInfoText.first_light.innerText = sunResult.first_light;
                                        sunInfoText.dawn.innerText = sunResult.dawn;
                                        sunInfoText.sunrise.innerText = sunResult.sunrise;
                                        sunInfoText.golden_hour.innerText = sunResult.golden_hour;
                                        sunInfoText.sunset.innerText = sunResult.sunset;
                                        sunInfoText.dusk.innerText = sunResult.dusk;
                                        sunInfoText.last_light.innerText = sunResult.last_light;
                                        drawGraph(tideChart, tidesResult, beginDateSelector.value, metaResult, tzResult.timeZoneName);
                                        errorText.innerText = ""
                                    },
                                    (onSunRejected) => {
                                        errorText.innerText = "Error retrieving sunrise/sunset data";
                                        console.log("Error retrieving sunrise/sunset data");
                                    }
                                );
                            },
                            (onTzRejected) => {
                                errorText.innerText = "Error retrieving timezone data";
                                console.log("Error retrieving timezone data");
                            }
                        )
                    },
                    (onMetaRejected) => {
                        errorText.innerText = "Error retrieving station metadata";
                        console.log("Error retrieving station metadata");
                    });                
            },
            (onTidesRejected) => {
                errorText.innerText = "Error retrieving tide data";
                console.log("Error retrieving tide data");
            }
        )
    });
};