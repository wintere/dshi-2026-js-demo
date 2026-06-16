// Helper function: computes distance from London
function londonDistance(lat, lon) {
    const london_lat = 51.51393677914357 // London lat
    const london_lon = -0.1225777998430477; // London lon
    const R = 6371; // Earth's radius in kilometers

    // Convert degrees to radians
    const dLat = (lat - london_lat) * Math.PI / 180;
    const dLon = (lon - london_lon) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(london_lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Runs only after page content is loaded
document.addEventListener('DOMContentLoaded', function () {
    // 1. Initialize the map and set its view
    // L.map('map') creates a map instance linked to the div with id="map"
    const map = L.map('map').setView([54.977238852655034, -4.8475691922206385], 5); // NYC Coordinates [lat, lng], Zoom level 13

    // Add basemap, in this case a neutral maptiler one, load API key   
    L.tileLayer(`https://api.maptiler.com/maps/landscape-v4/{z}/{x}/{y}.png?key=Z6psnzpcddvNHSQUpZCT`, {
        minZoom: 5,
        maxZoom: 13, // Max zoom level for these tiles
        attribution: '&copy; <a href="https://cloud.maptiler.com/maps/landscape-v4/">MapTiler</a>'
    }).addTo(map); // Add the tile layer to our map instance

    console.log("Map initialized.");

    // Populate default prompt for info box
    $("#info-body").addClass("default-prompt");


    // Load and configure custom icons
    const WOMEN_ICON = L.icon({
        iconUrl: 'images/women-pin.png',
        iconSize: [38, 38], // size of the icon
        iconAnchor: [15, 15], // point of the icon which will correspond to marker's location
        popupAnchor: [-3, -10], // point from which the popup should open relative to the iconAnchor
    });
    const MEN_ICON = L.icon({
        iconUrl: 'images/men-pin.png',
        iconSize: [38, 38], // size of the icon
        iconAnchor: [15, 15], // point of the icon which will correspond to marker's location
        popupAnchor: [-3, -10] // point from which the popup should open relative to the iconAnchor
    });


    // Add London splash zone
    const londonCoords = [51.51393677914357, -0.1225777998430477]
    const londonRadius = L.circle(londonCoords, {
        color: '#5d2713',       // Outline color
        fillColor: '#5d2713',   // Fill color
        fillOpacity: 0.2,  // Fill transparency (0-1)
        radius: 8050        // Radius in meters
    }).bindPopup("<b>A five-mile radius of London.</b>").addTo(map);

    // Add legend, adapted from https://leafletjs.com/examples/choropleth/
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend'),
            colors = ['#0e2e5e', '#98284a'],
            labels = ['Male', 'Female'];

        div.innerHTML += "<h3>Gender</h3>"
        for (var i = 0; i < labels.length; i++) {
            div.innerHTML +=
                '<i style="background:' + colors[i] + '"></i> ' + labels[i] + '<br>';
        }
        return div;
    };

    legend.addTo(map);

    // Default divider to hidden
    $("#viaf-divider").hide();

    // Read in points
    $.getJSON("data/people.json", function (data) {
        data.forEach(function (person) {
            let coords = [person.lat, person.lon]

            // Make sure person doesn't live within 5 miles of London
            if (londonDistance(person.lat, person.lon) > 9) {
                let popup = "<b>" + person.name + "</b></br>" + // Name
                    "<i>" + person.birth + "-" + person.death + "</i><br>" +
                    person.birthplace;

                //Set icon based on gender (lazy, I know)
                let map_icon;
                if (person.gender === "Man") {
                    map_icon = MEN_ICON;
                }
                else {
                    map_icon = WOMEN_ICON;
                }
                // Get distance from London, add a touch of jitter for the Dubliners
                let personMarker = L.marker([person.lat + (Math.random() - 0.5) * 0.046,
                person.lon + ((Math.random() - 0.5) * 0.046)], { icon: map_icon });

                // Add person marker to map
                personMarker.addTo(map).bindPopup(popup);
                personMarker.on('click', function () { // On click behavior
                    personMarker.openPopup(); // Don't override default behavior

                    // Remove default text
                    if ($('#info-body').hasClass('default-prompt')) {
                        $('#info-body').text('');
                        $('#info-body').removeClass('default-prompt');
                    }
                    // Default to hiding metadata links
                    $("#viaf-link").hide();
                    $("wikidata-link").hide();
                    // Populate name 
                    $("#person-name").text(person.name + " (" + person.birth + "–" + person.death + ")");

                    // Add VIAF and Wikidata links if available
                    $('#info-body').html("Born in " + person.birthplace + ", " + person.country + ".");
                    if (person.link_viaf !== null) {
                        console.log(person.link_viaf);
                        $("#viaf-link").text("VIAF").show(); // Display
                        $("#viaf-link").attr('href', person.link_viaf); // Embed link
                    }
                    if (person.wikidata_id !== null) { // Wikidata, if available
                        $('#wikidata-link').text("Wikidata").show(); // Display 
                        $("#wikidata-link").attr('href', //Generate link
                            "https://www.wikidata.org/wiki/" + person.wikidata_id);
                    }
                    // Add separator if person has both a Wikidata id and VIAF link
                    $("#viaf-divider").hide();
                    if ((person.wikidata_id !== null) && (person.link_viaf !== null)) {
                        $("#viaf-divider").show();
                    }
                });
            }
        });
    }).fail(function (jqXHR, textStatus, errorThrown) {
        // Handle errors if poem.json cannot be loaded
        console.error("Error loading people.json:", textStatus, errorThrown);
        $("#map").html("<p style='color:red;'>Error loading map data.</p>");
    });

}); // End DOMContentLoaded listener
