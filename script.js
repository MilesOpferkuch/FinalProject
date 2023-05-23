let date = new Date();
let year = date.getFullYear().toString();
let month = date.getMonth() + 1;
let day = date.getDate();
// Zero-pad date
if (month < 10) {
    month = month.toString().padStart(2, "0");
}
if (day < 10) {
    day = day.toString().padStart(2, "0");
}
let dateString = `${year}-${month}-${day}`; // HTML date picker needs yyyy-mm-dd

function getTides(station, beginDate, endDate) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://localhost:3000/tides/${station}/${beginDate}/${endDate}`);
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
    });
}

function getSunData(lat, lon, tz, date) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `http://localhost:3000/suntimes/${lat}/${lon}/${tz}/${date}`)
    xhr.send();
    xhr.onload = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const body = JSON.parse(xhr.responseText);
                console.log(body);
                return body;
            }
        }
    }
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
                    console.log(body)
                    resolve(body);
                } else {
                    reject(Error(xhr.responseText));
                }
            }
        }        
    })

}

window.onload = function() {
    const ctx = document.getElementById('myChart');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
          label: '# of Votes',
          data: [12, 19, 3, 5, 2, 3],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    const stationInput = document.getElementById("station");
    // Configure date pickers
    const beginDateSelector = document.getElementById("begin_date");
    beginDateSelector.value = dateString;
    beginDateSelector.min = dateString;
    const endDateSelector = document.getElementById("end_date");
    endDateSelector.value = dateString;
    endDateSelector.min = dateString;

    const buttonGo = document.getElementById("buttonGo");
    buttonGo.addEventListener("click", () => {
        let station = stationInput.value;
        // Tides API wants yyyymmdd without dashes
        let beginDate = beginDateSelector.value.replaceAll('-', '');
        let endDate = endDateSelector.value.replaceAll('-', '');
        let lat = 0;
        let lon = 0;
        getTides(station, beginDate, endDate).then(
            (result) => {
                getMetadata(station).then(
                    (result) => {
                        // Get lat, lon and timezone info from the NOAA station
                        lat = result.lat;
                        lon = result.lng;
                        // NOAA doesn't return the time compensated for DST
                        // so we check with Google timezone API and the following monstrosity:
                        let tzString = Math.abs(result.timezonecorr).toString();
                        tzString = tzString.padStart(2, '0');
                        if (result.timezonecorr < 0) {
                            tzString = '-' + tzString;
                        } else {
                            tzString = '+' + tzString;
                        }
                        let dateObject = new Date(`${beginDateSelector.value}T00:00:00.000${tzString}:00`)
                        let timestamp = dateObject.valueOf()/1000;
                        // Fetch timezone data from Google's API
                        getTimezoneData(result.lat, result.lng, timestamp).then(
                            (result) => {
                                tzOffset = (result.rawOffset + result.dstOffset)/60/60;
                                // Get sunrise/sunset times
                                getSunData(lat, lon, tzOffset, beginDateSelector.value)
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