function getTides(station, beginDate) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://localhost:3000/tides/${station}/${beginDate}`);
        xhr.send();
        xhr.onload = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const body = xhr.responseText;
                    console.log(body);
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
                    console.log(body);
                    resolve(body);
                } else {
                    reject(Error(xhr.responseText));
                }
            };
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
                    console.log(body);
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
                    console.log(body);
                    resolve(body);
                } else {
                    reject(Error(xhr.responseText));
                }
            }
        }
    })
}

function drawGraph(ctx, data) {
    console.log(data);
    for (i in JSON.parse(data)) {
        for (x in i) {
            console.log(x)
        }
        
    }
    new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [
          {
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            borderWidth: 1,
            backgroundColor: '#7faefa'
          }
      ]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
}

window.onload = function() {
    let today = new Date();
    let year = today.getFullYear().toString();
    let month = (today.getMonth() + 1).toString().padStart(2, "0");
    let day = today.getDate().toString().padStart(2, "0");
    let dateString = `${year}-${month}-${day}`; // HTML date picker needs yyyy-mm-dd

    const ctx = document.getElementById('myChart');
    Chart.defaults.color = '#FFFFFF';
    Chart.defaults.backgroundColor = '#c4c4c4';
    Chart.defaults.borderColor = '#575757';

    const stationInput = document.getElementById("station");
    // Configure date picker
    const beginDateSelector = document.getElementById("begin_date");
    beginDateSelector.value = dateString;
    beginDateSelector.min = dateString;

    const buttonGo = document.getElementById("buttonGo");
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
                                        console.log(sunResult);
                                    },
                                    (onRejected) => {
                                        console.log("Error retrieving sunrise/sunset data");
                                    }
                                );
                              //  drawGraph(ctx, tidesResult);

                            },
                            (onRejected) => {
                                console.log("Error retrieving timezone data");
                            }
                        )
                    },
                    (onRejected) => {
                        console.log("Error retrieving station metadata");
                    });                
            },
            (onRejected) => {
                console.log("Error retrieving tide data");
            }
        )
    });
};