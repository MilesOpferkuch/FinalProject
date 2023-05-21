//let station = 9410230
let lat = 0;
let lon = 0;

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
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `http://localhost:3000/tides/${station}/${beginDate}/${endDate}`);
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



function getMetadata(station) {
    return new Promise(function(resolve, reject) {

        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://localhost:3000/metadata/${station}`);
        xhr.send();
        xhr.onload = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const body = JSON.parse(xhr.responseText);
                    let lat = body.stations[0].lat;
                    let lon = body.stations[0].lng;
                    let tz = body.stations[0].timezone;
                    resolve({'lat': lat, 'lon': lon, 'tz':tz});
                    console.log(body);
                } else {
                    reject(Error(xhr.responseText));
                }
            };
        }
    });
}


function getSunData(lat, lon, tz, date) {
    const xhr2 = new XMLHttpRequest();
    xhr2.open("GET", `http://localhost:3000/suntimes/${lat}/${lon}/${tz}/${date}`)
    xhr2.send();
    xhr2.onload = function() {
        if (xhr2.readyState === 4) {
            if (xhr2.status === 200) {
                const body = JSON.parse(xhr2.responseText);
                console.log(body);
                return body;
            }
        }
    }
}

function successCallback(result) {
    console.log(`Success: ${result}`);
}

function failureCallback(error) {
    console.log(`Error: ${error}`);
}

window.onload = function() {

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
        let beginDate = beginDateSelector.value.replaceAll('-', '');
        let endDate = endDateSelector.value.replaceAll('-', '');
        getMetadata(stationInput.value).then(
            (result) => {
                getSunData(result.lat, result.lon, result.tz, beginDateSelector.value);
            },
            (onRejected) => {
                console.log("oops");
            });

    });

};