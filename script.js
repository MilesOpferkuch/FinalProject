let station = 9410230;
let lat = 0;
let lon = 0;
let begin_date = "20230517";
let end_date = "20230518";
let tz = "lst_ldt";
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
let dateString = `${year}-${month}-${day}`

window.onload = function() {

    const beginDateSelector = document.getElementById("begin_date");
    beginDateSelector.value = dateString;
    beginDateSelector.min = dateString;
    const endDateSelector = document.getElementById("end_date");
    endDateSelector.value = dateString;
    endDateSelector.min = dateString;

    console.log(dateString);
    const xhr = new XMLHttpRequest();
    //xhr.open("GET", `http://localhost:3000/tides/${station}/${begin_date}/${end_date}/${tz}`);
    xhr.open("GET", `http://localhost:3000/metadata/${station}`);
    xhr.send();
    xhr.onload = function() {
        const body = JSON.parse(xhr.responseText);
        console.log(body.stations[0].name);
    }
};