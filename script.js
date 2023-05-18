const station = 9410230;
const lat = 0;
const lon = 0;
const begin_date = "20230517";
const end_date = "20230518";
const tz = "lst_ldt";

window.onload = function() {
    console.log("here")
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `http://localhost:3000/tides/${station}/${begin_date}/${end_date}/${tz}`);
    xhr.send();
    xhr.onload = function() {
        const body = JSON.parse(xhr.responseText);
        console.log(body);
    }
}