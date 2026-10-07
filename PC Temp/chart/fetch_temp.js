const url = "https://api.thingspeak.com/channels/3499465/feeds.json?results=50";

fetch(url)
  .then(response => response.json())

  // Once the data is parsed, process it.
  .then(data => {

    // Extract the 'feeds' array from the response.
    // Each feed contains a timestamp and one or more data fields.
    const feeds = data.feeds;

    // Map over each feed to create a simplified array of temperature readings.
    // Each object in the array contains:
    // - 'time': the timestamp when the reading was recorded.
    // - 'temp': the temperature value from 'field1', converted from string to float.

    const temperatures = feeds.map(feed => ({

      time: feed.created_at,
      temp: parseFloat(feed.field1) // Convert temperature string to float
    }));

    // Display the temperature data in a readable JSON format inside the HTML element with ID 'output'.
    // The second argument (null) and third (2) add indentation for readability.
    document.getElementById("output").textContent = JSON.stringify(temperatures, null, 2);
  })

  // If an error occurs during the fetch or data processing, handle it here.
  .catch(error => {
    // Log the error to the browser console for debugging.
    console.error("Error fetching data:", error);

    // Display a user-friendly error message in the HTML element with ID 'output'.
    document.getElementById("output").textContent = "Error loading data.";
  });