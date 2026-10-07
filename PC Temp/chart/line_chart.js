const THINGSPEAK_URL =
"https://api.thingspeak.com/channels/3499465/feeds.json?results=50";

const REFRESH_INTERVAL = 15000; // Päivitetään 15 sekunnin välein


// GOOGLE CHARTS
google.charts.load("current", {
    packages: ["corechart"]
});

google.charts.setOnLoadCallback(init);

// MUUTTUJAT
let chart;
let allData = [];

// OHJELMAN KÄYNNISTYS
function init() {

    chart = new google.visualization.LineChart(
        document.getElementById("line_chart")
    );

    // Slider
    const slider =
        document.getElementById("sampleSlider");


    slider.addEventListener("input", function () {

        document.getElementById("sampleCount").textContent =
            this.value;

        drawChart();
    });

    // Haetaan ensimmäinen data
    fetchThingSpeakData();

    // Päivitetään data 10 sekunnin välein
    setInterval(
        fetchThingSpeakData,
        10000
    );
}

// THINGSPEAK DATAN HAKEMINEN

async function fetchThingSpeakData() {
    try {
        const response = await fetch(
            THINGSPEAK_URL
        );

        if (!response.ok) {
            throw new Error(
                `HTTP virhe: ${response.status}`
            );
        }

        const json = await response.json();

        // Tyhjennetään vanha data
        allData = [];

        // Käydään ThingSpeak feed läpi
        json.feeds.forEach(feed => {

            // Jos jompikumpi puuttuu,
            // ei lisätä pistettä
            if (
                feed.field1 === null ||
                feed.field3 === null
            ) {
                return;
            }

            // ThingSpeak timestamp
            const time = new Date(
                feed.created_at
            );

            // CPU
            const cpu =
                parseFloat(feed.field1);

            // GPU
            const gpu =
                parseFloat(feed.field3);

            // Varmistetaan että numerot ovat kelvollisia
            if (
                Number.isNaN(cpu) ||
                Number.isNaN(gpu)
            ) {
                return;
            }

            allData.push([
                time,
                cpu,
                gpu
            ]);

        });

        // Päivitetään chart
        drawChart();

    } catch (error) {
        console.error(
            "ThingSpeak virhe:",
            error
        );

        document.getElementById("status").textContent =
            `Virhe: ${error.message}`;
    }
}

// CHARTIN PIIRTÄMINEN
function drawChart() {
    if (allData.length === 0) {
        console.log(
            "ThingSpeakistä ei löytynyt dataa."
        );
        return;
    }

    const slider =
        document.getElementById("sampleSlider");

    const amount =
        parseInt(slider.value);

    // Otetaan viimeiset X mittausta
    const rows =
        allData.slice(-amount);

    // Luodaan DataTable
    const data =
        new google.visualization.DataTable();

    // X-akseli
    data.addColumn(
        "datetime",
        "Aika"
    );

    // CPU
    data.addColumn(
        "number",
        "CPU"
    );

    // GPU
    data.addColumn(
        "number",
        "GPU"
    );

    // Lisätään data
    data.addRows(rows);

    // CHART ASETUKSET
    const options = {
        title:
            "PC osien lämpötila",

        curveType:
            "function",

        legend: {
            position: "bottom"
        },

        hAxis: {
            title:
                "Aika",
            format:
                "HH:mm:ss"
        },

        vAxis: {
            title:
                "Lämpötila (°C)",

            viewWindow: {
                min: 0,
                max: 100
            }
        },

        width:
            "100%",

        height:
            700,

        colors: [
            "#4285F4",
            "#EA4335"
        ],

        chartArea: {
            left: 70,
            right: 30,
            top: 60,
            bottom: 80
        }
    };

    // Piirretään chart
    chart.draw(
        data,
        options
    );
}