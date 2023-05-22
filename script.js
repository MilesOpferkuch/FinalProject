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
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `http://localhost:3000/tides/${station}/${beginDate}/${endDate}`);
        xhr.send();
        xhr.onload = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const body = JSON.parse(xhr.responseText);
                    resolve(body);
                    console.log(xhr.responseText);
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
  //  const secondsSinceEpoch = Math.round(Date.now() / 1000)
    console.log((Date.parse("2023-05-21:00:00.000Z"))/1000);
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

        getTides(station, beginDate, endDate).then(
            (result) => {
                getMetadata(station).then(
                    (result) => {
                        getSunData(result.lat, result.lng, result.timezonecorr, beginDateSelector.value);
                    },
                    (onRejected) => {
                        console.log("oops");
                    });                
            },
            (onRejected) => {
                console.log("oops");
            }
        )


    });

};