// Get tide data from NOAA COOPS
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

// Get station metadata from NOAA COOPS
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

// Get data from sunrisesunset.io
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

// Takes input string formatted as HH:MM:SS PM, returns the number of seconds from midnight
// This is super janky but it works
function hhmmssToSeconds(input) {
    // Isolate the period from the time
    let str = input.split(" ");
    let time = str[0];
    let period = str[1];
    // Isolate hours, mins and secs from each other
    let split = time.split(":");
    let hrs = parseInt(split[0], 10);
    let mins = parseInt(split[1], 10);
    let secs = parseInt(split[2], 10);
    // If time is 1 PM or later, add 12 hours
    let pmOffset = (period == "PM" && hrs != 12) ? (12 * 60 * 60) : 0;
    return (hrs * 60 * 60) + (mins * 60) + secs + pmOffset;
}

// Take a string with format HH:MM:SS AM.
// If twelveHour is true, return it without changes.
// If twelveHour is false, convert it to 24 hour format.
// This is needed because sunrisesunset.io only returns times in 12 hour format.
function formatTime(input, twelveHour) {
    if (twelveHour) {
        return input
    } else {
        let time = new Date(null);
        time.setSeconds(hhmmssToSeconds(input));
        return time.toISOString().slice(11, 19);
    }
}

function drawGraph(chart, tideData, date, metadata, twelveHour, units, sunData) {
    // Clear all chart data
    chart.data.datasets[0].data = [];
    // Set graph title and axis titles
    chart.options.plugins.title.text = `Tides on ${date} at station ${metadata.name} (${metadata.station})`;
    chart.options.scales.x.title.text = `Time (${sunData.timezone})`;
    chart.options.scales.y.title.text = (units == "english") ? "Height (ft.)" : "Height (meters)";
    // Set x axis format (12 hour or 24 hour)
    (twelveHour) ? (chart.data.labels = labels12h) : (chart.data.labels = labels24h) ;
    // Insert tide data
    let parsedData = JSON.parse(tideData).predictions;
    for (var i = 0; i < 24; i++) {
        chart.data.datasets[0].data.push(parsedData[i].v);
    }
    // Configure chart colors. Post-sunrise is orange, post-sunset is blue, transition hours are purple.
    let colorList = [];
    let sunriseSecs = hhmmssToSeconds(sunData.sunrise);
    let sunsetSecs = hhmmssToSeconds(sunData.sunset);
    for (var i = 0; i < 24; i++) {
        let currentSecs = i * 60 * 60;
        // If the current time is before sunrise - 1hr, make it blue
        if (currentSecs + 3600 < sunriseSecs) {
            colorList.push('rgb(109, 164, 252)');
        }
        // If sunrise occurs within this hour, make it purple
        else if (currentSecs < sunriseSecs && currentSecs + 3600 > sunriseSecs) {
            colorList.push('rgb(135, 72, 150)');
        }
        // If the current time is between sunrise and sunset, make it orange
        else if (currentSecs > sunriseSecs && currentSecs < sunsetSecs - 3600) {
            colorList.push('rgb(255, 209, 59)');
        }
        // If sunset occurs within this hour, make it purple
        else if (currentSecs < sunsetSecs && currentSecs + 3600 > sunsetSecs) {
            colorList.push('rgb(135, 72, 150)');
        }
        // If after sunset, make it blue
        else if (currentSecs > sunsetSecs) {
            colorList.push('rgb(109, 164, 252)');
        }
    }
    chart.data.datasets[0].backgroundColor = colorList;
    chart.update();
}

window.onload = function() {
    const ctx = document.getElementById("myChart");
    const inputStation = document.getElementById("station");
    const inputDate = document.getElementById("datePicker");
    const textSunInfo = document.getElementsByClassName("textSunInfo");
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
    let today = new Date();
    let year = today.getFullYear().toString();
    let month = (today.getMonth() + 1).toString().padStart(2, "0");
    let day = today.getDate().toString().padStart(2, "0");
    let dateString = `${year}-${month}-${day}`; // HTML date picker needs yyyy-mm-dd
    inputDate.value = dateString;
    inputDate.min = dateString;

    buttonGo.addEventListener("click", () => {
        tideChart.options.plugins.title.text = "Loading...";
        tideChart.update();
        let station = inputStation.value;
        // Tides API wants yyyymmdd without dashes
        let beginDate = inputDate.value.replaceAll('-', '');
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
                        getSunData(lat, lon, inputDate.value).then(
                            (sunResult) => {
                                let sunData = JSON.parse(sunResult);
                                textSunInfo.first_light.innerText = formatTime(sunData.first_light, twelveHour);
                                textSunInfo.dawn.innerText = formatTime(sunData.dawn, twelveHour);
                                textSunInfo.sunrise.innerText = formatTime(sunData.sunrise, twelveHour);
                                textSunInfo.solar_noon.innerText = formatTime(sunData.solar_noon, twelveHour);
                                textSunInfo.golden_hour.innerText = formatTime(sunData.golden_hour, twelveHour);
                                textSunInfo.sunset.innerText = formatTime(sunData.sunset, twelveHour);
                                textSunInfo.dusk.innerText = formatTime(sunData.dusk, twelveHour);
                                textSunInfo.last_light.innerText = formatTime(sunData.last_light, twelveHour);
                                drawGraph(tideChart, tidesResult, inputDate.value, metaResult, twelveHour, units, sunData);
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
